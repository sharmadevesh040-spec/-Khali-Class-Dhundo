import React from 'react';
import { motion } from 'framer-motion';
import { X, Navigation, Coffee } from 'lucide-react';

function MapModal({ room, onClose }) {
  if (!room) return null;

  // Blocks positions (for vector highlighting)
  const blockPositions = {
    'A Block': { x: 90, y: 110, w: 100, h: 60, label: 'Block A' },
    'B Block': { x: 260, y: 110, w: 100, h: 60, label: 'Block B' },
    'C Block': { x: 90, y: 250, w: 100, h: 60, label: 'Block C' },
    'D Block': { x: 260, y: 250, w: 100, h: 60, label: 'Block D' },
    'AI Block': { x: 175, y: 180, w: 100, h: 50, label: 'AI Block (Tech)' },
  };

  // Canteens positions
  const canteens = {
    'Chai Adda': { x: 70, y: 190, label: 'Chai Adda ☕' },
    'Le Broc': { x: 380, y: 195, label: 'Le Broc 🍔' },
    'Fusion Cafe': { x: 225, y: 70, label: 'Fusion Cafe 🍕' },
    'Maggie Point': { x: 225, y: 340, label: 'Maggie Point 🍜' },
  };

  const selectedBlock = blockPositions[room.block];
  const selectedCanteen = canteens[room.landmark];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="glass-modal w-full max-w-2xl p-6 rounded-3xl relative overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center space-x-2">
              <Navigation className="w-5 h-5 text-indigo-400" />
              <span>Galgotias Campus Navigation Map</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Showing <strong className="text-gray-200">{room.room_number}</strong> ({room.block}) near <strong className="text-indigo-400">{room.landmark}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white rounded-xl border border-white/5 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Map Canvas */}
        <div className="relative bg-slate-950/80 border border-white/5 rounded-2xl p-4 flex justify-center items-center overflow-hidden h-[380px]">
          <svg viewBox="0 0 480 400" className="w-full h-full text-slate-700 select-none">
            {/* Grid background lines */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Campus Pathways (roads) */}
            <path d="M 225 30 L 225 370 M 50 195 L 430 195" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="24" strokeLinecap="round" />
            <path d="M 225 30 L 225 370 M 50 195 L 430 195" fill="none" stroke="rgba(99, 102, 241, 0.05)" strokeWidth="4" strokeLinecap="round" />

            {/* Render Blocks */}
            {Object.entries(blockPositions).map(([name, pos]) => {
              const isSelected = name === room.block;
              return (
                <g key={name}>
                  <rect
                    x={pos.x}
                    y={pos.y}
                    width={pos.w}
                    height={pos.h}
                    rx="10"
                    className={`transition-all duration-500 fill-slate-900 stroke-2 ${
                      isSelected 
                        ? 'stroke-indigo-500 fill-indigo-600/10' 
                        : 'stroke-white/10'
                    }`}
                  />
                  <text
                    x={pos.x + pos.w / 2}
                    y={pos.y + pos.h / 2 + 5}
                    textAnchor="middle"
                    className={`text-xs font-bold font-sans ${
                      isSelected ? 'fill-indigo-300' : 'fill-gray-500'
                    }`}
                  >
                    {pos.label}
                  </text>
                </g>
              );
            })}

            {/* Render Canteens */}
            {Object.entries(canteens).map(([name, pos]) => {
              const isSelected = name === room.landmark;
              return (
                <g key={name}>
                  {/* Glowing circle for canteen */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isSelected ? '14' : '10'}
                    className={`transition-all duration-500 fill-slate-950 stroke-2 ${
                      isSelected 
                        ? 'stroke-amber-400 fill-amber-500/20' 
                        : 'stroke-white/10'
                    }`}
                  />
                  <text
                    x={pos.x}
                    y={pos.y - 18}
                    textAnchor="middle"
                    className={`text-[9px] font-bold font-sans ${
                      isSelected ? 'fill-amber-300' : 'fill-gray-500'
                    }`}
                  >
                    {pos.label}
                  </text>
                </g>
              );
            })}

            {/* Proximity path indicator (between selected block and selected canteen) */}
            {selectedBlock && selectedCanteen && (
              <motion.line
                initial={{ strokeDasharray: 8, strokeDashoffset: 100 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                x1={selectedBlock.x + selectedBlock.w / 2}
                y1={selectedBlock.y + selectedBlock.h / 2}
                x2={selectedCanteen.x}
                y2={selectedCanteen.y}
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}

            {/* Highlighted Glowing Pin for active room */}
            {selectedBlock && (
              <g>
                <circle
                  cx={selectedBlock.x + selectedBlock.w / 2}
                  cy={selectedBlock.y + selectedBlock.h / 2}
                  r="6"
                  className="fill-indigo-500 animate-ping"
                />
                <circle
                  cx={selectedBlock.x + selectedBlock.w / 2}
                  cy={selectedBlock.y + selectedBlock.h / 2}
                  r="4"
                  className="fill-indigo-400"
                />
              </g>
            )}
          </svg>

          {/* Floating UI description */}
          <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 border border-white/5 py-2.5 px-4 rounded-xl flex items-center justify-between text-xs">
            <span className="text-gray-400 flex items-center space-x-1.5">
              <Coffee className="w-4 h-4 text-amber-400" />
              <span>Proximity: <strong className="text-gray-200 font-semibold">{room.landmark}</strong> is nearest.</span>
            </span>
            <span className="text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20 text-[10px] tracking-wider uppercase">
              Distance: ~45m
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default MapModal;
