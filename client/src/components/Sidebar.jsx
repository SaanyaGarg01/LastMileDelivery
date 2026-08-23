import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Package, 
  Navigation, 
  Bell, 
  CreditCard, 
  BarChart3, 
  Settings, 
  HelpCircle, 
  Truck, 
  MapPin, 
  DollarSign, 
  CheckCircle2, 
  User, 
  X,
  Radio,
  ShieldCheck,
  Play
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      <aside
        className={`fixed md:static top-0 left-0 bottom-0 w-64 bg-slate-900 text-slate-100 border-r border-slate-800 z-50 transition-transform duration-300 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } flex flex-col justify-between`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white font-extrabold shadow-md shadow-sky-500/20">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-extrabold text-sm tracking-tight text-white leading-none">
                  LAST-MILE <span className="text-sky-400">TRACKER</span>
                </h1>
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mt-1">
                  LOGISTICS PLATFORM
                </span>
              </div>
            </div>
            <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-3 space-y-5 overflow-y-auto max-h-[calc(100vh-140px)]">
            {/* CUSTOMER NAVIGATION */}
            {role === 'CUSTOMER' && (
              <>
                <div>
                  <span className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">WORKSPACE</span>
                  <div className="space-y-1">
                    <NavLink to="/customer" end onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}><LayoutDashboard className="w-4 h-4" /><span>Dashboard</span></NavLink>
                    <NavLink to="/customer/create-order" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}><PlusCircle className="w-4 h-4" /><span>New Shipment</span></NavLink>
                    <NavLink to="/customer/shipments" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}><Package className="w-4 h-4" /><span>My Shipments</span></NavLink>
                    <NavLink to="/customer/tracking" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}><Navigation className="w-4 h-4" /><span>Live Tracking</span></NavLink>
                    <NavLink to="/customer/addresses" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}><MapPin className="w-4 h-4" /><span>Saved Addresses</span></NavLink>
                  </div>
                </div>

                <div>
                  <span className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">COMMUNICATION</span>
                  <NavLink to="/customer/notifications" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}><Bell className="w-4 h-4" /><span>Notifications</span></NavLink>
                </div>

                <div>
                  <span className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">FINANCE</span>
                  <NavLink to="/customer/billing" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}><CreditCard className="w-4 h-4" /><span>Billing</span></NavLink>
                </div>

                <div>
                  <span className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">INSIGHTS</span>
                  <NavLink to="/customer/analytics" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}><BarChart3 className="w-4 h-4" /><span>Analytics</span></NavLink>
                </div>

                <div>
                  <span className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">ACCOUNT</span>
                  <div className="space-y-1">
                    <NavLink to="/customer/settings" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}><Settings className="w-4 h-4" /><span>Settings</span></NavLink>
                    <NavLink to="/customer/support" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}><HelpCircle className="w-4 h-4" /><span>Support</span></NavLink>
                  </div>
                </div>
              </>
            )}

            {/* ADMIN NAVIGATION */}
            {role === 'ADMIN' && (
              <>
                <div>
                  <span className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">OVERVIEW</span>
                  <NavLink to="/admin" end onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}><LayoutDashboard className="w-4 h-4" /><span>Dashboard</span></NavLink>
                </div>

                <div>
                  <span className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">ORDERS & BULK</span>
                  <div className="space-y-1">
                    <NavLink to="/admin/orders" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}><Package className="w-4 h-4" /><span>All Orders</span></NavLink>
                    <NavLink to="/admin/bulk-orders" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}><PlusCircle className="w-4 h-4" /><span>Bulk CSV Import</span></NavLink>
                  </div>
                </div>

                <div>
                  <span className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">FINANCE & SETTLEMENTS</span>
                  <NavLink to="/admin/settlements" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}><DollarSign className="w-4 h-4" /><span>Agent Settlements</span></NavLink>
                </div>

                <div>
                  <span className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">OPERATIONS & SUPPORT</span>
                  <div className="space-y-1">
                    <NavLink to="/admin/agents" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}><Truck className="w-4 h-4" /><span>Agents</span></NavLink>
                    <NavLink to="/admin/zones" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}><MapPin className="w-4 h-4" /><span>Zones & Areas</span></NavLink>
                    <NavLink to="/admin/rate-cards" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}><CreditCard className="w-4 h-4" /><span>Rate Cards</span></NavLink>
                    <NavLink to="/admin/support" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}><HelpCircle className="w-4 h-4" /><span>Support Desk</span></NavLink>
                    <NavLink to="/admin/live" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}>
                      <Radio className="w-4 h-4" />
                      <span>Live Operations</span>
                      <span className="ml-auto flex items-center gap-1 text-[9px] font-extrabold text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>LIVE</span>
                    </NavLink>
                  </div>
                </div>

                <div>
                  <span className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">INTELLIGENCE COMMAND</span>
                  <div className="space-y-1">
                    <NavLink to="/admin/mission-control" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}>
                      <Radio className="w-4 h-4 text-emerald-400" />
                      <span>Mission Control</span>
                      <span className="ml-auto text-[9px] font-extrabold text-emerald-400 bg-emerald-400/10 px-1 py-0.5 rounded border border-emerald-400/20">LIVE</span>
                    </NavLink>
                    <NavLink to="/admin/risk-radar" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}>
                      <ShieldCheck className="w-4 h-4 text-rose-400" />
                      <span>Risk Radar</span>
                    </NavLink>
                    <NavLink to="/admin/optimization" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}>
                      <BarChart3 className="w-4 h-4 text-sky-400" />
                      <span>Optimization Impact</span>
                    </NavLink>
                  </div>
                </div>

                <div>
                  <span className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">INSIGHTS & ANALYTICS</span>
                  <NavLink to="/admin/analytics" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}><BarChart3 className="w-4 h-4" /><span>Analytics</span></NavLink>
                </div>

                <div>
                  <span className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">COMMUNICATION</span>
                  <NavLink to="/admin/notifications" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}><Bell className="w-4 h-4" /><span>Notifications</span></NavLink>
                </div>

                <div>
                  <span className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">SYSTEM OPERATIONS</span>
                  <div className="space-y-1">
                    <NavLink to="/admin/audit-logs" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}><ShieldCheck className="w-4 h-4" /><span>Audit Logs</span></NavLink>
                    <NavLink to="/admin/simulation" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}>
                      <Play className="w-4 h-4 text-amber-400" />
                      <span>Delivery Testing Tool</span>
                    </NavLink>
                    <NavLink to="/admin/system-health" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}><Radio className="w-4 h-4 text-emerald-400" /><span>System Health</span></NavLink>
                    <NavLink to="/admin/settings" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}><Settings className="w-4 h-4" /><span>Settings</span></NavLink>
                  </div>
                </div>
              </>
            )}

            {/* AGENT NAVIGATION */}
            {role === 'AGENT' && (
              <>
                <div>
                  <span className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">OVERVIEW</span>
                  <NavLink to="/agent" end onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}><LayoutDashboard className="w-4 h-4" /><span>Dashboard</span></NavLink>
                </div>

                <div>
                  <span className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">DELIVERIES</span>
                  <div className="space-y-1">
                    <NavLink to="/agent" end onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}><Truck className="w-4 h-4" /><span>My Deliveries</span></NavLink>
                    <NavLink to="/agent/active-delivery" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}><Navigation className="w-4 h-4" /><span>Active Delivery</span></NavLink>
                    <NavLink to="/agent/history" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}><CheckCircle2 className="w-4 h-4" /><span>Delivery History</span></NavLink>
                  </div>
                </div>

                <div>
                  <span className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">ACCOUNT</span>
                  <div className="space-y-1">
                    <NavLink to="/customer/notifications" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}><Bell className="w-4 h-4" /><span>Notifications</span></NavLink>
                    <NavLink to="/agent/profile" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}><User className="w-4 h-4" /><span>Profile</span></NavLink>
                  </div>
                </div>
              </>
            )}
          </nav>
        </div>

        {/* Bottom Logged-In User Profile Card */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center font-extrabold text-white text-xs shadow-sm">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <h4 className="text-xs font-bold text-slate-100 truncate">{user.name}</h4>
            <span className="text-[10px] font-bold text-sky-400 uppercase bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
              {role}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
