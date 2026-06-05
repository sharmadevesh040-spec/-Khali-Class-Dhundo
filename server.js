const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query } = require('./db');

const app = express();
const port = 3000;
const JWT_SECRET = 'super_secret_jwt_key_123';

app.use(cors());
app.use(express.json());

// 1. WebSocket Server Setup
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Set();
wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`WebSocket client connected. Total clients: ${clients.size}`);
  
  ws.on('close', () => {
    clients.delete(ws);
    console.log(`WebSocket client disconnected. Total clients: ${clients.size}`);
  });
});

// Broadcast helper
function broadcastUpdate(type, data = {}) {
  const payload = JSON.stringify({ type, data });
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

// 2. Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: "Access token required" });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: "Admin authorization required" });
  }
}

// 3. API Endpoints

// Authentication API
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }

  try {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    
    const result = await query.run(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'student')",
      [name, email, hashedPassword]
    );
    
    const userPayload = { id: result.lastID, name, email, role: 'student' };
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ token, user: userPayload });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: "Email is already registered" });
    }
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await query.get("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const userPayload = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ token, user: userPayload });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rooms GET API with filters
app.get('/api/rooms', async (req, res) => {
  const { search, block, landmark } = req.query;
  let sql = "SELECT * FROM rooms WHERE 1=1";
  let params = [];

  if (block && block !== 'All') {
    sql += " AND block = ?";
    params.push(block);
  }

  if (landmark && landmark !== 'All') {
    sql += " AND landmark = ?";
    params.push(landmark);
  }

  if (search) {
    sql += " AND (room_number LIKE ? OR landmark LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  try {
    const rooms = await query.all(sql, params);
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rooms Claim API
app.post('/api/rooms/claim/:id', authenticateToken, async (req, res) => {
  const roomId = req.params.id;
  const now = new Date();
  const claimTime = now.toISOString();
  // Auto-release in 1 hour
  const expiryTime = new Date(now.getTime() + 60 * 60 * 1000).toISOString();

  try {
    // Atomic check-and-set
    const result = await query.run(
      `UPDATE rooms 
       SET status = 'claimed', claimed_by_id = ?, claimed_by_name = ?, claim_time = ?, expiry_time = ? 
       WHERE id = ? AND status = 'available'`,
      [req.user.id, req.user.name, claimTime, expiryTime, roomId]
    );

    if (result.changes > 0) {
      const room = await query.get("SELECT room_number FROM rooms WHERE id = ?", [roomId]);
      
      // Log to history
      await query.run(
        `INSERT INTO claims_history (room_id, room_number, user_id, user_name, claim_time) 
         VALUES (?, ?, ?, ?, ?)`,
        [roomId, room.room_number, req.user.id, req.user.name, claimTime]
      );

      // Broadcast changes
      broadcastUpdate('ROOMS_UPDATED');
      
      res.json({ message: `Classroom ${room.room_number} claimed successfully!`, expiryTime });
    } else {
      // Find out why it failed
      const room = await query.get("SELECT * FROM rooms WHERE id = ?", [roomId]);
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }
      return res.status(400).json({ error: `Room ${room.room_number} is already occupied` });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rooms Release API (User/Admin manual release)
app.post('/api/rooms/release/:id', authenticateToken, async (req, res) => {
  const roomId = req.params.id;
  const now = new Date().toISOString();

  try {
    const room = await query.get("SELECT * FROM rooms WHERE id = ?", [roomId]);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    if (room.status !== 'claimed') {
      return res.status(400).json({ error: "Room is already empty" });
    }

    // Check permissions: claimant or admin
    if (req.user.role !== 'admin' && room.claimed_by_id !== req.user.id) {
      return res.status(403).json({ error: "You are not authorized to release this room" });
    }

    const releasedBy = req.user.role === 'admin' ? 'admin' : 'user';

    await query.run(
      `UPDATE rooms 
       SET status = 'available', claimed_by_id = NULL, claimed_by_name = NULL, claim_time = NULL, expiry_time = NULL 
       WHERE id = ?`,
      [roomId]
    );

    // Update history log
    await query.run(
      `UPDATE claims_history 
       SET release_time = ?, released_by = ? 
       WHERE room_id = ? AND release_time IS NULL`,
      [now, releasedBy, roomId]
    );

    broadcastUpdate('ROOMS_UPDATED');
    res.json({ message: `Classroom ${room.room_number} has been released.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stats API
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await query.get(`
      SELECT 
        COUNT(*) as total,
        SUM(case when status = 'available' then 1 else 0 end) as available,
        SUM(case when status = 'claimed' then 1 else 0 end) as claimed
      FROM rooms
    `);
    
    const total = stats.total || 0;
    const available = stats.available || 0;
    const claimed = stats.claimed || 0;
    const occupancyPercent = total > 0 ? Math.round((claimed / total) * 100) : 0;

    res.json({ total, available, claimed, occupancyPercent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Panel APIs
app.get('/api/admin/claims', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const claims = await query.all("SELECT * FROM claims_history ORDER BY id DESC");
    res.json(claims);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/rooms', authenticateToken, requireAdmin, async (req, res) => {
  const { room_number, block, landmark } = req.body;
  if (!room_number || !block || !landmark) {
    return res.status(400).json({ error: "Room number, block, and landmark are required" });
  }

  try {
    await query.run(
      "INSERT INTO rooms (room_number, block, landmark, status) VALUES (?, ?, ?, 'available')",
      [room_number, block, landmark]
    );
    broadcastUpdate('ROOMS_UPDATED');
    res.status(201).json({ message: `Classroom ${room_number} created successfully.` });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: "Room number already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/rooms/:id', authenticateToken, requireAdmin, async (req, res) => {
  const roomId = req.params.id;
  const { room_number, block, landmark } = req.body;
  
  if (!room_number || !block || !landmark) {
    return res.status(400).json({ error: "Room number, block, and landmark are required" });
  }

  try {
    await query.run(
      "UPDATE rooms SET room_number = ?, block = ?, landmark = ? WHERE id = ?",
      [room_number, block, landmark, roomId]
    );
    broadcastUpdate('ROOMS_UPDATED');
    res.json({ message: `Classroom updated successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/rooms/:id', authenticateToken, requireAdmin, async (req, res) => {
  const roomId = req.params.id;
  try {
    const room = await query.get("SELECT room_number FROM rooms WHERE id = ?", [roomId]);
    if (!room) return res.status(404).json({ error: "Room not found" });

    await query.run("DELETE FROM rooms WHERE id = ?", [roomId]);
    // Also clean active claims in history for integrity
    await query.run(
      "UPDATE claims_history SET release_time = ?, released_by = 'admin' WHERE room_id = ? AND release_time IS NULL",
      [new Date().toISOString(), roomId]
    );

    broadcastUpdate('ROOMS_UPDATED');
    res.json({ message: `Classroom ${room.room_number} deleted successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Auto Release Cron Loop
// Scans rooms every 10 seconds for expired claims
setInterval(async () => {
  const now = new Date().toISOString();
  try {
    const expiredRooms = await query.all(
      "SELECT * FROM rooms WHERE status = 'claimed' AND expiry_time <= ?",
      [now]
    );

    if (expiredRooms.length > 0) {
      console.log(`[AutoRelease] Found ${expiredRooms.length} expired claims. Releasing...`);
      
      for (const room of expiredRooms) {
        await query.run(
          `UPDATE rooms 
           SET status = 'available', claimed_by_id = NULL, claimed_by_name = NULL, claim_time = NULL, expiry_time = NULL 
           WHERE id = ?`,
          [room.id]
        );

        await query.run(
          `UPDATE claims_history 
           SET release_time = ?, released_by = 'auto' 
           WHERE room_id = ? AND release_time IS NULL`,
          [now, room.id]
        );
        console.log(`[AutoRelease] Room ${room.room_number} released automatically.`);
      }

      broadcastUpdate('ROOMS_UPDATED');
    }
  } catch (err) {
    console.error("[AutoRelease] Error in cron loop:", err.message);
  }
}, 10000);

// Start Server
server.listen(port, () => {
  console.log(`Khali Class Dhundo server listening at http://localhost:${port}`);
});
