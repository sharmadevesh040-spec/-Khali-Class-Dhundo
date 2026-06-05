import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, QrCode, Smartphone, Sparkles } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

function QRClaimModal({ room, onClose, onClaim }) {
  const [scanning, setScanning] = useState(false);

  if (!room) return null;

  // The claim URL that would be coded in the QR
  const claimUrl = `http://localhost:3000/api/rooms/claim/${room.id}`;

  const handleSimulateScan = () => {
    setScanning(true);
    setTimeout(() => {
      onClaim(room.id);
      setScanning(false);
      onClose();
    }, 1200); // Simulate scanning delay
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="glass-modal w-full max-w-sm p-6 rounded-3xl relative overflow-hidden shadow-2xl text-center"
      >
        {/* Glow Effects */}
        <div className="absolute -top-10 -left-10 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white rounded-xl border border-white/5 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 mb-4">
          <QrCode className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-white mb-1">Claim via QR Code</h3>
        <p className="text-xs text-gray-400 max-w-xs mx-auto mb-6">
          Scan this QR Code posted outside classroom <strong className="text-gray-200">{room.room_number}</strong> to claim it instantly on your phone.
        </p>

        {/* QR Code Container */}
        <div className="bg-white p-5 rounded-2xl inline-block shadow-inner mb-6 relative group border border-white/10">
          <QRCodeSVG 
            value={claimUrl}
            size={160}
            bgColor="#ffffff"
            fgColor="#090d16"
            level="M"
            includeMargin={false}
          />
          
          {scanning && (
            <div className="absolute inset-0 bg-slate-950/75 rounded-2xl flex flex-col justify-center items-center text-indigo-400 font-bold text-xs space-y-2">
              <Smartphone className="w-8 h-8 animate-bounce" />
              <span className="tracking-wide">Scanning QR...</span>
            </div>
          )}
        </div>

        <div className="text-[11px] text-gray-500 font-semibold mb-6 flex items-center justify-center space-x-1.5">
          <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
          <span>QR Payload: claim/{room.id}</span>
        </div>

        {/* Mobile Simulation Scan Button */}
        <button
          onClick={handleSimulateScan}
          disabled={scanning}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex justify-center items-center space-x-2 text-xs cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Simulate Phone Scan</span>
        </button>
      </motion.div>
    </div>
  );
}

export default QRClaimModal;
