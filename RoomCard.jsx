import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, QrCode, Lock, Unlock, User } from 'lucide-react';

function RoomCard({ room, currentUser, onClaim, onRelease, onViewMap, onOpenQR }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (room.status !== 'claimed' || !room.expiry_time) {
      setTimeLeft('');
      return;
    }

    const updateTimer = () => {
      const difference = new Date(room.expiry_time) - new Date();
      if (difference <= 0) {
        setTimeLeft('00:00');
        return;
      }

      const totalSeconds = Math.floor(difference / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      const formattedMinutes = String(minutes).padStart(2, '0');
      const formattedSeconds = String(seconds).padStart(2, '0');
      setTimeLeft(`${formattedMinutes}:${formattedSeconds}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [room.status, room.expiry_time]);

  const isClaimed = room.status === 'claimed';
  const canRelease = currentUser && (currentUser.role === 'admin' || room.claimed_by_id === currentUser.id);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`glass-card p-6 rounded-3xl flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 ${
        isClaimed 
          ? 'border-rose-500/20' 
          : 'border-emerald-500/20 glow-available'
      }`}
    >
      {/* Visual Indicator Line */}
      <div className={`absolute top-0 left-0 right-0 h-1 transition-colors ${
        isClaimed ? 'bg-gradient-to-r from-rose-500 to-pink-500' : 'bg-gradient-to-r from-emerald-400 to-teal-400'
      }`} />

      <div>
        {/* Header: Name and Block */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-white">{room.room_number}</h3>
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
              {room.block}
            </span>
          </div>
          <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full flex items-center space-x-1 ${
            isClaimed 
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25' 
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1 ${isClaimed ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'}`} />
            {room.status}
          </span>
        </div>

        {/* Location Landmark */}
        <div className="flex items-center space-x-2 text-gray-400 text-xs mb-4">
          <MapPin className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
          <span>Near Canteen: <strong className="text-gray-300 font-semibold">{room.landmark}</strong></span>
        </div>

        {/* Claim Info Section */}
        {isClaimed ? (
          <div className="space-y-2 bg-slate-950/40 p-3.5 rounded-2xl border border-white/5 mb-5 text-xs">
            <div className="flex justify-between items-center text-gray-400">
              <span className="flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-rose-400" />
                <span>Claimed by:</span>
              </span>
              <strong className="text-gray-200 font-semibold">{room.claimed_by_name || 'Student'}</strong>
            </div>

            <div className="flex justify-between items-center text-gray-400">
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Expires in:</span>
              </span>
              <strong className="text-indigo-400 font-bold font-mono tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded-md">
                {timeLeft || '00:00'}
              </strong>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-2xl text-[11px] text-emerald-400/90 leading-relaxed mb-5">
            ✨ This room is currently unoccupied and ready for study sessions.
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5">
        {!isClaimed ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onClaim(room.id)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-2 px-3 rounded-xl shadow-md transition duration-200 text-xs flex items-center justify-center space-x-1 cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Claim</span>
            </button>
            <button
              onClick={() => onOpenQR(room)}
              className="bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-indigo-500/30 font-bold py-2 px-3 rounded-xl transition duration-200 text-xs flex items-center justify-center space-x-1 cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Claim</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => onRelease(room.id, room.room_number)}
            disabled={!canRelease}
            className={`w-full font-bold py-2.5 px-4 rounded-xl transition duration-200 text-xs flex items-center justify-center space-x-1 cursor-pointer ${
              canRelease 
                ? 'bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400' 
                : 'bg-slate-800 text-gray-500 border border-white/5 cursor-not-allowed'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{canRelease ? 'Release Classroom' : 'Claimed (Locked)'}</span>
          </button>
        )}

        <button
          onClick={() => onViewMap(room)}
          className="w-full bg-slate-900/60 hover:bg-slate-900 border border-white/5 hover:border-indigo-500/20 text-gray-300 font-semibold py-2 px-4 rounded-xl transition duration-200 text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
        >
          <MapPin className="w-3.5 h-3.5 text-gray-400" />
          <span>View on Campus Map</span>
        </button>
      </div>
    </motion.div>
  );
}

export default RoomCard;
