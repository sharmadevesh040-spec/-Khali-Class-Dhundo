import React from 'react';
import { LogOut, User, ShieldCheck } from 'lucide-react';

function Navbar({ user, onLogout, showAdminPanel, setShowAdminPanel }) {
  return (
    <nav className="glass-panel sticky top-0 z-40 px-6 py-4 mb-8 flex justify-between items-center shadow-lg">
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setShowAdminPanel(false)}>
        <span className="text-3xl">🏫</span>
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
            Khali Class Dhundo
          </h1>
          <p className="text-[10px] text-gray-400 tracking-widest uppercase font-semibold">
            Galgotias Real-Time Portal
          </p>
        </div>
      </div>

      {user ? (
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2.5 bg-slate-900/60 py-1.5 px-3 rounded-xl border border-white/5">
            {user.role === 'admin' ? (
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            ) : (
              <User className="w-4 h-4 text-blue-400" />
            )}
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-200 leading-tight">{user.name}</p>
              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                user.role === 'admin' 
                  ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20' 
                  : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
              }`}>
                {user.role}
              </span>
            </div>
          </div>

          {user.role === 'admin' && (
            <button
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className={`text-xs font-semibold px-4 py-2 rounded-xl transition duration-200 cursor-pointer ${
                showAdminPanel 
                  ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-md shadow-purple-600/20' 
                  : 'bg-slate-800 text-purple-400 border border-purple-500/30 hover:bg-slate-700'
              }`}
            >
              {showAdminPanel ? 'Dashboard' : 'Admin Console'}
            </button>
          )}

          <button
            onClick={onLogout}
            className="flex items-center space-x-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 py-2 px-3 rounded-xl transition text-xs font-semibold cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      ) : (
        <div className="text-xs text-gray-400 font-medium italic">
          Sign in to claim classrooms
        </div>
      )}
    </nav>
  );
}

export default Navbar;
