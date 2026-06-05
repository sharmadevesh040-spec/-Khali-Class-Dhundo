import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, RotateCcw, ClipboardList, Database, X } from 'lucide-react';

function AdminPanel({ token, rooms, onRoomsUpdate, onShowToast }) {
  const [activeTab, setActiveTab] = useState('database'); // 'database' or 'history'
  const [claimsHistory, setClaimsHistory] = useState([]);
  
  // Form State
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [editRoomId, setEditRoomId] = useState(null);
  const [roomForm, setRoomForm] = useState({ room_number: '', block: 'AI Block', landmark: 'Chai Adda' });
  const [loading, setLoading] = useState(false);

  const blocks = ['AI Block', 'A Block', 'B Block', 'C Block', 'D Block'];
  const landmarks = ['Chai Adda', 'Le Broc', 'Fusion Cafe', 'Maggie Point'];

  useEffect(() => {
    if (activeTab === 'history') {
      fetchClaimsHistory();
    }
  }, [activeTab]);

  const fetchClaimsHistory = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/admin/claims', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setClaimsHistory(data);
      } else {
        onShowToast(data.error || 'Failed to fetch claims history', 'error');
      }
    } catch (err) {
      console.error(err);
      onShowToast('Connection failed. Server offline.', 'error');
    }
  };

  const handleInputChange = (e) => {
    setRoomForm({ ...roomForm, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setRoomForm({ room_number: '', block: 'AI Block', landmark: 'Chai Adda' });
    setFormMode('add');
    setEditRoomId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const url = formMode === 'add' 
      ? 'http://localhost:3000/api/admin/rooms'
      : `http://localhost:3000/api/admin/rooms/${editRoomId}`;
    
    const method = formMode === 'add' ? 'POST' : 'PUT';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(roomForm)
      });
      const data = await response.json();

      if (response.ok) {
        onShowToast(data.message || 'Room saved successfully', 'success');
        resetForm();
        onRoomsUpdate(); // Trigger dashboard refresh
      } else {
        onShowToast(data.error || 'Failed to save room', 'error');
      }
    } catch (err) {
      console.error(err);
      onShowToast('Connection error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (room) => {
    setFormMode('edit');
    setEditRoomId(room.id);
    setRoomForm({ room_number: room.room_number, block: room.block, landmark: room.landmark });
  };

  const handleDeleteClick = async (id, roomNumber) => {
    if (!window.confirm(`Are you sure you want to delete classroom ${roomNumber}?`)) return;

    try {
      const response = await fetch(`http://localhost:3000/api/admin/rooms/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (response.ok) {
        onShowToast(data.message || 'Room deleted successfully', 'success');
        onRoomsUpdate();
      } else {
        onShowToast(data.error || 'Failed to delete room', 'error');
      }
    } catch (err) {
      console.error(err);
      onShowToast('Connection error', 'error');
    }
  };

  const handleReleaseClick = async (id, roomNumber) => {
    try {
      const response = await fetch(`http://localhost:3000/api/rooms/release/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (response.ok) {
        onShowToast(data.message || `Classroom ${roomNumber} released manually.`, 'success');
        onRoomsUpdate();
      } else {
        onShowToast(data.error || 'Failed to release room', 'error');
      }
    } catch (err) {
      console.error(err);
      onShowToast('Connection error', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Selectors */}
      <div className="flex space-x-3 bg-slate-900/60 p-1.5 rounded-2xl border border-white/5 w-fit">
        <button
          onClick={() => setActiveTab('database')}
          className={`flex items-center space-x-2 py-2 px-4 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'database' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/15' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Room Database</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center space-x-2 py-2 px-4 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'history' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/15' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          <span>Claims History Log</span>
        </button>
      </div>

      {activeTab === 'database' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add/Edit Room Form */}
          <div className="glass-card p-6 rounded-2xl h-fit">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-200">
                {formMode === 'add' ? 'Add New Classroom' : 'Edit Classroom'}
              </h3>
              {formMode === 'edit' && (
                <button onClick={resetForm} className="text-gray-400 hover:text-rose-400 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Room Number</label>
                <input
                  type="text"
                  name="room_number"
                  required
                  value={roomForm.room_number}
                  onChange={handleInputChange}
                  placeholder="e.g. AI-102"
                  className="w-full bg-slate-900/60 border border-white/5 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-gray-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Block</label>
                <select
                  name="block"
                  value={roomForm.block}
                  onChange={handleInputChange}
                  className="w-full bg-slate-900/60 border border-white/5 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-purple-500 text-gray-200 cursor-pointer"
                >
                  {blocks.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Landmark (Nearest Canteen)</label>
                <select
                  name="landmark"
                  value={roomForm.landmark}
                  onChange={handleInputChange}
                  className="w-full bg-slate-900/60 border border-white/5 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-purple-500 text-gray-200 cursor-pointer"
                >
                  {landmarks.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-4 rounded-xl transition duration-200 text-xs shadow-md shadow-purple-600/10 flex justify-center items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span className="custom-spinner border-2 border-white/30 border-t-white rounded-full w-4 h-4" />
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>{formMode === 'add' ? 'Create Room' : 'Save Changes'}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Database Table */}
          <div className="glass-card p-6 rounded-2xl lg:col-span-2 overflow-x-auto">
            <h3 className="text-lg font-bold text-gray-200 mb-4">Classroom Registrations</h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                  <th className="pb-3 px-3">Room</th>
                  <th className="pb-3 px-3">Block</th>
                  <th className="pb-3 px-3">Landmark</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {rooms.map(room => (
                  <tr key={room.id} className="hover:bg-white/1">
                    <td className="py-3 px-3 font-semibold text-gray-200">{room.room_number}</td>
                    <td className="py-3 px-3 text-gray-400">{room.block}</td>
                    <td className="py-3 px-3 text-gray-400">{room.landmark}</td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        room.status === 'available' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                      }`}>
                        {room.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      {room.status === 'claimed' && (
                        <button
                          onClick={() => handleReleaseClick(room.id, room.room_number)}
                          className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/20 cursor-pointer inline-flex items-center justify-center"
                          title="Force Release Room"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEditClick(room)}
                        className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/20 cursor-pointer inline-flex items-center justify-center"
                        title="Edit Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(room.id, room.room_number)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/20 cursor-pointer inline-flex items-center justify-center"
                        title="Delete Room"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="glass-card p-6 rounded-2xl overflow-x-auto">
          <h3 className="text-lg font-bold text-gray-200 mb-4">Historical Claims Log</h3>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                <th className="pb-3 px-3">Room</th>
                <th className="pb-3 px-3">Student Name</th>
                <th className="pb-3 px-3">Claim Time</th>
                <th className="pb-3 px-3">Release Time</th>
                <th className="pb-3 px-3">Released By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {claimsHistory.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-4 text-center text-gray-400 text-xs italic">
                    No historical claim records found
                  </td>
                </tr>
              ) : (
                claimsHistory.map(log => (
                  <tr key={log.id} className="hover:bg-white/1 text-xs">
                    <td className="py-3 px-3 font-semibold text-gray-200">{log.room_number}</td>
                    <td className="py-3 px-3 text-gray-300 font-medium">{log.user_name}</td>
                    <td className="py-3 px-3 text-gray-400">
                      {new Date(log.claim_time).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-gray-400">
                      {log.release_time ? new Date(log.release_time).toLocaleString() : <span className="text-emerald-400 font-bold uppercase text-[9px] tracking-wider bg-emerald-500/10 border border-emerald-500/20 py-0.5 px-2 rounded-md">Active Claim</span>}
                    </td>
                    <td className="py-3 px-3">
                      {log.released_by ? (
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
                          log.released_by === 'auto' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' :
                          log.released_by === 'admin' ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20' :
                          'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                        }`}>
                          {log.released_by}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
