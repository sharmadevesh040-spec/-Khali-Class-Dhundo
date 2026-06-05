const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, './database.sqlite');
const db = new sqlite3.Database(dbPath);

// Helper function to run DB queries as promises
const query = {
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ changes: this.changes, lastID: this.lastID });
      });
    });
  },
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

async function initDB() {
  console.log("Initializing database...");
  
  // 1. Create Users Table
  await query.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'student'
    )
  `);

  // 2. Create Rooms Table
  await query.run(`
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_number TEXT UNIQUE NOT NULL,
      block TEXT NOT NULL,
      landmark TEXT NOT NULL,
      status TEXT DEFAULT 'available',
      claimed_by_id INTEGER,
      claimed_by_name TEXT,
      claim_time TEXT,
      expiry_time TEXT,
      FOREIGN KEY (claimed_by_id) REFERENCES users(id)
    )
  `);

  // 3. Create Claims History Table
  await query.run(`
    CREATE TABLE IF NOT EXISTS claims_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      room_number TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      claim_time TEXT NOT NULL,
      release_time TEXT,
      released_by TEXT -- 'user', 'admin', 'auto'
    )
  `);

  console.log("Database tables verified/created.");

  // Seed Admin and Student Users
  const salt = bcrypt.genSaltSync(10);
  const adminPasswordHash = bcrypt.hashSync('admin123', salt);
  const studentPasswordHash = bcrypt.hashSync('student123', salt);

  try {
    await query.run(
      "INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      ['Admin Sir', 'admin@galgotias.edu', adminPasswordHash, 'admin']
    );
    await query.run(
      "INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      ['Student Bhai', 'student@galgotias.edu', studentPasswordHash, 'student']
    );
    console.log("Users seeded successfully.");
  } catch (err) {
    console.error("Error seeding users:", err);
  }

  // Seed Initial Rooms
  const initialRooms = [
    { room_number: 'AI-101', block: 'AI Block', landmark: 'Chai Adda' },
    { room_number: 'AI-202', block: 'AI Block', landmark: 'Le Broc' },
    { room_number: 'A-301', block: 'A Block', landmark: 'Fusion Cafe' },
    { room_number: 'B-105', block: 'B Block', landmark: 'Maggie Point' },
    { room_number: 'C-204', block: 'C Block', landmark: 'Chai Adda' },
    { room_number: 'D-401', block: 'D Block', landmark: 'Maggie Point' },
    { room_number: 'AI-303', block: 'AI Block', landmark: 'Fusion Cafe' },
    { room_number: 'B-202', block: 'B Block', landmark: 'Le Broc' },
    { room_number: 'C-101', block: 'C Block', landmark: 'Chai Adda' },
    { room_number: 'A-102', block: 'A Block', landmark: 'Maggie Point' }
  ];

  for (const r of initialRooms) {
    try {
      await query.run(
        `INSERT OR IGNORE INTO rooms (room_number, block, landmark, status) VALUES (?, ?, ?, 'available')`,
        [r.room_number, r.block, r.landmark]
      );
    } catch (err) {
      console.error(`Error seeding room ${r.room_number}:`, err);
    }
  }
  
  console.log("Database seeding completed.");
}

module.exports = {
  db,
  query,
  initDB
};
