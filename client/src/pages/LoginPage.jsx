import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Truck, Lock, Mail, ArrowRight, ShieldCheck, Eye, EyeOff, Sparkles,
  Navigation, CheckCircle2, UserCheck, KeyRound
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const res = await login(email, password);
      toast.success(`Welcome back, ${res.user.name}!`);
      if (res.user.role === 'ADMIN') navigate('/admin');
      else if (res.user.role === 'AGENT') navigate('/agent');
      else navigate('/customer');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLoading(true);
    try {
      const res = await login(demoEmail, demoPassword);
      toast.success(`Signed in as ${res.user.role}!`);
      if (res.user.role === 'ADMIN') navigate('/admin');
      else if (res.user.role === 'AGENT') navigate('/agent');
      else navigate('/customer');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex font-['Plus_Jakarta_Sans',sans-serif] selection:bg-sky-500 selection:text-white">
      {/* LEFT PANEL — Split Screen Visual & Branding (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 border-r border-slate-800/80 p-12 flex-col justify-between relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base text-white tracking-tight block">LAST-MILE TRACKER</span>
              <span className="text-[9px] font-mono font-bold text-sky-400 tracking-widest uppercase block -mt-1">LOGISTICS PLATFORM</span>
            </div>
          </Link>

          <div className="pt-12 space-y-4">
            <h1 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
              Delivering visibility. <br />
              <span className="bg-gradient-to-r from-sky-400 to-indigo-300 bg-clip-text text-transparent">Every single mile.</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-md">
              Access real-time Leaflet OpenStreetMap tracking, Haversine proximity auto-assignment, and immutable tracking history.
            </p>
          </div>

          <div className="space-y-3 pt-6 text-xs text-slate-300 font-medium">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Role-Based Access for Customers, Agents, & Admins</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Multi-Channel Email & SMS Notification Engine</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Failed Delivery Recovery & Rescheduling Pipeline</span>
            </div>
          </div>
        </div>

        {/* Footer Brand Ticker */}
        <div className="relative z-10 pt-8 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between items-center">
          <span>© 2026 Last-Mile Tracker</span>
          <span className="font-mono text-sky-400">v2.4 Production Build</span>
        </div>
      </div>

      {/* RIGHT PANEL — Redesigned Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800/80 rounded-3xl p-8 shadow-2xl space-y-6 relative z-10">
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Welcome back 👋</h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">Sign in to manage your shipments and operations</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-300">Password</label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); toast.info('Please contact support to reset password.'); }} className="text-[11px] text-sky-400 hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 text-xs text-slate-400 font-medium">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-sky-500 focus:ring-0"
              />
              <label htmlFor="remember" className="cursor-pointer">Remember me on this device</label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Signing in...' : 'SIGN IN TO DASHBOARD'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[10px] text-slate-500 uppercase font-mono">OR</span>
          </div>

          {/* Mock Social Sign In */}
          <button
            type="button"
            onClick={() => handleQuickLogin('customer@example.com', 'password123')}
            className="w-full py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <span>🌐</span> Continue with Google SSO
          </button>

          <div className="text-center text-xs text-slate-400 pt-2 font-medium">
            Don't have an account?{' '}
            <Link to="/register" className="text-sky-400 font-bold hover:underline">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
