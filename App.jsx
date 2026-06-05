import React, { useState, useEffect, useRef } from 'react';
import Navbar from './Navbar';
import Auth from './Auth';
import Stats from './Stats';
import AdminPanel from './AdminPanel';
import RoomCard from './RoomCard';
import MapModal from './MapModal';
import QRClaimModal from './QRClaimModal';
import { Search, RotateCcw, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

function App() {
  // Authentication & Session
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Application Data States
  const [rooms, setRooms] = useState([]);
  const [stats, setStats] = useState({ total: 0, available: 0, claimed: 0, occupancyPercent: 0 });

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('All');
  const [selectedCanteen, setSelectedCanteen] = useState('All');

  // Modals & Popups
  const [mapRoom, setMapRoom] = useState(null);
  const [qrRoom, setQrRoom] = useState(null);
  const [toast, setToast] = useState({ message: '', type: '' }); // 'success', 'error', 'warning'

  const toastTimeoutRef = useRef(null);
  const wsRef = useRef(null);

  // Filter Options
  const blocks = ['All', 'AI Block', 'A Block', 'B Block', 'C Block', 'D Block'];
  const canteens = ['All', 'Chai Adda', 'Le Broc', 'Fusion Cafe', 'Maggie Point'];

  // Initialize data and WebSockets
  useEffect(() => {
    fetchRooms();
    fetchStats();
    setupWebSocket();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [selectedBlock, selectedCanteen, token]); // Refetch if filters or token change

  // Refetch when search changes (with debouncing or instant)
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchRooms();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const setupWebSocket = () => {
    if (wsRef.current) wsRef.current.close();

    const ws = new WebSocket('ws://localhost:3000');
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'ROOMS_UPDATED') {
          console.log('[WebSocket] Real-time rooms update received.');
          fetchRooms();
          fetchStats();
        }
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    ws.onclose = () => {
      console.log('[WebSocket] Connection closed. Reconnecting in 3s...');
      setTimeout(setupWebSocket, 3000);
    };
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToast({ message: '', type: '' });
    }, 4000);
  };

  const fetchRooms = async () => {
    try {
      const url = `http://localhost:3000/api/rooms?search=${searchTerm}&block=${selectedBlock}&landmark=${selectedCanteen}`;
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setRooms(data);
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/stats');
      const data = await response.json();
      if (response.ok) {
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  // Auth Operations
  const handleAuthSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    showToast(`Logged in successfully as ${newUser.name}!`, 'success');
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    setShowAdminPanel(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showToast('Logged out successfully.', 'info');
  };

  // Claim/Release operations
  const handleClaimRoom = async (roomId) => {
    if (!token) {
      showToast('Please sign in to claim classrooms.', 'warning');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/rooms/claim/${roomId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (response.ok) {
        showToast(data.message || 'Room claimed successfully!', 'success');
      } else {
        showToast(data.error || 'Failed to claim room.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection failed. Server offline.', 'error');
    }
  };

  const handleReleaseRoom = async (roomId, roomNumber) => {
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:3000/api/rooms/release/${roomId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (response.ok) {
        showToast(data.message || `Classroom ${roomNumber} released.`, 'success');
      } else {
        showToast(data.error || 'Failed to release room.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection failed.', 'error');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedBlock('All');
    setSelectedCanteen('All');
    showToast('Filters cleared', 'success');
  };

  return (
    <div className="container min-h-screen pb-16">
      {/* Toast Alert Notification */}
      <AnimatePresence>
        {toast.message && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center space-x-3 px-5 py-4 rounded-2xl shadow-2xl border text-sm font-semibold max-w-sm ${
              toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' :
              toast.type === 'error' ? 'bg-rose-500/10 border-rose-500/25 text-rose-400' :
              toast.type === 'warning' ? 'bg-amber-500/10 border-amber-500/25 text-amber-400' :
              'bg-slate-900 border-white/10 text-gray-300'
            }`}
          >
            <span>
              {toast.type === 'success' ? '✅' :
               toast.type === 'error' ? '❌' :
               toast.type === 'warning' ? '⚠️' : 'ℹ️'}
            </span>
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        showAdminPanel={showAdminPanel} 
        setShowAdminPanel={setShowAdminPanel} 
      />

      {/* Main Layout Orchestrator */}
      {!user ? (
        <Auth onAuthSuccess={handleAuthSuccess} />
      ) : (
        <div className="px-4">
          <Stats stats={stats} />

          {showAdminPanel && user.role === 'admin' ? (
            <AdminPanel 
              token={token} 
              rooms={rooms} 
              onRoomsUpdate={() => { fetchRooms(); fetchStats(); }} 
              onShowToast={showToast}
            />
          ) : (
            <div>
              {/* Filter and Search Bar Section */}
              <div className="glass-panel p-5 rounded-3xl border border-white/5 mb-8 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search room numbers or canteen vicinity..."
                    className="w-full bg-slate-900/60 border border-white/5 rounded-2xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-gray-200 placeholder-gray-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Block:</span>
                    <select
                      value={selectedBlock}
                      onChange={(e) => setSelectedBlock(e.target.value)}
                      className="bg-slate-900 border border-white/5 text-gray-300 text-xs font-semibold rounded-xl py-2 px-3 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {blocks.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Vicinity:</span>
                    <select
                      value={selectedCanteen}
                      onChange={(e) => setSelectedCanteen(e.target.value)}
                      className="bg-slate-900 border border-white/5 text-gray-300 text-xs font-semibold rounded-xl py-2 px-3 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {canteens.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {(searchTerm || selectedBlock !== 'All' || selectedCanteen !== 'All') && (
                    <button
                      onClick={resetFilters}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white rounded-xl border border-white/5 transition flex items-center justify-center cursor-pointer"
                      title="Clear Filters"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Classrooms Grid view */}
              {rooms.length === 0 ? (
                <div className="text-center py-20 bg-slate-950/20 border border-dashed border-white/5 rounded-3xl">
                  <span className="text-4xl block mb-3">🔍</span>
                  <h4 className="text-lg font-bold text-gray-300 mb-1">No Classrooms Found</h4>
                  <p className="text-xs text-gray-400">Try modifying your search text or filters to find empty rooms.</p>
                </div>
              ) : (
                <motion.div 
                  layout
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  <AnimatePresence>
                    {rooms.map((room) => (
                      <RoomCard
                        key={room.id}
                        room={room}
                        currentUser={user}
                        onClaim={handleClaimRoom}
                        onRelease={handleReleaseRoom}
                        onViewMap={setMapRoom}
                        onOpenQR={setQrRoom}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Overlay Modals */}
      <AnimatePresence>
        {mapRoom && (
          <MapModal room={mapRoom} onClose={() => setMapRoom(null)} />
        )}
        {qrRoom && (
          <QRClaimModal 
            room={qrRoom} 
            onClose={() => setQrRoom(null)} 
            onClaim={handleClaimRoom} 
          />
        )}
      </AnimatePresence>

      {/* Footer credits */}
      <footer className="text-center text-[10px] text-gray-500 mt-20 tracking-wider uppercase font-semibold leading-relaxed">
        <div className="flex items-center justify-center space-x-1 mb-1.5">
          <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" />
          <span>Real-time claim updates enabled</span>
        </div>
        © 2026 Galgotias University. Built for Galgotias Hackathon.
      </footer>
    </div>
  );
}

export default App;
