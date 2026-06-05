import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Layers, Percent } from 'lucide-react';

function Stats({ stats }) {
  const { total = 0, available = 0, claimed = 0, occupancyPercent = 0 } = stats || {};

  const cards = [
    {
      title: 'Total Classrooms',
      value: total,
      icon: <Layers className="w-5 h-5 text-indigo-400" />,
      bg: 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400',
    },
    {
      title: 'Available Rooms',
      value: available,
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      bg: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400',
    },
    {
      title: 'Occupied Rooms',
      value: claimed,
      icon: <XCircle className="w-5 h-5 text-rose-400" />,
      bg: 'bg-rose-500/10 border-rose-500/25 text-rose-400',
    },
    {
      title: 'Occupancy Rate',
      value: `${occupancyPercent}%`,
      icon: <Percent className="w-5 h-5 text-amber-400" />,
      bg: 'bg-amber-500/10 border-amber-500/25 text-amber-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, idx) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.08 }}
          className="glass-card p-5 rounded-2xl flex items-center justify-between shadow-md relative overflow-hidden"
        >
          {/* Subtle glow background */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/2 rounded-full blur-2xl pointer-events-none" />

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              {card.title}
            </p>
            <h3 className="text-2xl font-bold text-gray-100 tracking-tight leading-none">
              {card.value}
            </h3>
          </div>

          <div className={`p-3 rounded-xl border ${card.bg}`}>
            {card.icon}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default Stats;
