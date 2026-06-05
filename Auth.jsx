import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, Key, Mail, User } from 'lucide-react';

function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin 
      ? { email: formData.email, password: formData.password }
      : formData;

    try {
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (response.ok) {
        onAuthSuccess(data.token, data.user);
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failed. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md p-8 rounded-3xl shadow-2xl relative overflow-hidden"
      >
        {/* Glow Effects */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Tab Selection */}
        <div className="flex bg-slate-950/60 p-1.5 rounded-2xl mb-8 border border-white/5 relative z-10">
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
              isLogin ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Login</span>
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
              !isLogin ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Register</span>
          </button>
        </div>

        <h2 className="text-2xl font-bold text-center mb-1 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          {isLogin ? 'Welcome Back' : 'Create Student Account'}
        </h2>
        <p className="text-xs text-gray-400 text-center mb-6">
          {isLogin ? 'Enter credentials to find empty classrooms' : 'Join Galgotias classroom tracking portal'}
        </p>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs py-3 px-4 rounded-xl flex items-center space-x-2"
          >
            <span className="font-semibold">⚠️</span>
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="name-field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <label className="text-xs font-semibold text-gray-400 block mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    name="name"
                    required={!isLogin}
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className="w-full bg-slate-900/60 border border-white/5 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-gray-200"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="student@galgotias.edu"
                className="w-full bg-slate-900/60 border border-white/5 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-gray-200"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1">Password</label>
            <div className="relative">
              <Key className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="w-full bg-slate-900/60 border border-white/5 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-gray-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex justify-center items-center space-x-2 text-sm disabled:opacity-50 cursor-pointer mt-6"
          >
            {loading ? (
              <span className="custom-spinner border-2 border-white/30 border-t-white rounded-full w-4 h-4" />
            ) : (
              <>
                {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span>{isLogin ? 'Login Now' : 'Create Account'}</span>
              </>
            )}
          </button>
        </form>

        {isLogin && (
          <div className="mt-6 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-[11px] text-gray-400 text-center leading-relaxed">
            <span className="font-bold text-indigo-400 block mb-1">💡 Demo Accounts:</span>
            Student: <code className="text-gray-300">student@galgotias.edu</code> / <code className="text-gray-300">student123</code><br/>
            Admin: <code className="text-gray-300">admin@galgotias.edu</code> / <code className="text-gray-300">admin123</code>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default Auth;
