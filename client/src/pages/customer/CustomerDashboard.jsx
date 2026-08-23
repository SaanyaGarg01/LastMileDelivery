import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import {
  Package, Truck, CheckCircle2, AlertTriangle, XCircle,
  ArrowRight, Search, PlusCircle, Clock, Navigation,
  MapPin, Bell, ChevronRight, RefreshCw, Zap, ShieldCheck,
  ZapIcon, Compass, Sparkles, Activity, Layers, ArrowUpRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      if (res.data.success) setOrders(res.data.orders || []);
    } catch {
      toast.error('Failed to load shipments');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const found = orders.find(o =>
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (found) navigate(`/customer/orders/${found.id}`);
    else toast.error(`No order found for "${searchQuery}"`);
  };

  const active = orders.filter(o =>
    ['CREATED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'RESCHEDULED'].includes(o.status)
  );
  const delivered = orders.filter(o => o.status === 'DELIVERED');
  const pending = orders.filter(o => ['CREATED', 'ASSIGNED'].includes(o.status));
  const cancelled = orders.filter(o => ['FAILED', 'CANCELLED'].includes(o.status));

  const currentOrder = active.find(o => ['OUT_FOR_DELIVERY', 'IN_TRANSIT'].includes(o.status)) || active[0];

  const formatRelative = (ts) => {
    if (!ts) return '';
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    if (mins < 60) return `${mins} min ago`;
    if (hrs < 24) return `${hrs} hr ago`;
    return new Date(ts).toLocaleDateString([], { day: 'numeric', month: 'short' });
  };

  const statusBadgeClass = (status) => {
    const map = {
      OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700 border-orange-200',
      IN_TRANSIT: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      DELIVERED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      FAILED: 'bg-rose-100 text-rose-700 border-rose-200',
      CANCELLED: 'bg-slate-100 text-slate-500 border-slate-200',
      CREATED: 'bg-amber-100 text-amber-700 border-amber-200',
      ASSIGNED: 'bg-purple-100 text-purple-700 border-purple-200',
      PICKED_UP: 'bg-sky-100 text-sky-700 border-sky-200',
      RESCHEDULED: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    };
    return map[status] || 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const statusDot = (status) => {
    const map = {
      OUT_FOR_DELIVERY: 'bg-orange-500',
      IN_TRANSIT: 'bg-indigo-500',
      DELIVERED: 'bg-emerald-500',
      FAILED: 'bg-rose-500',
      CANCELLED: 'bg-slate-400',
      CREATED: 'bg-amber-500',
      ASSIGNED: 'bg-purple-500',
      PICKED_UP: 'bg-sky-500',
    };
    return map[status] || 'bg-slate-300';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* ── Swiggy/Zomato Style Hero Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 p-6 md:p-8 text-white shadow-xl border border-slate-800">
        {/* Glowing Decorative Backdrop Blobs */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/0 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 rounded-full bg-gradient-to-tr from-indigo-500/20 to-cyan-500/0 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[11px] font-extrabold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-orange-400 animate-spin" />
              <span>HYPERLOCAL EXPRESS LOGISTICS • NCR 15-MIN SLA</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400">{user?.name?.split(' ')[0] || 'there'}</span> 👋
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Track live deliveries, request instant fleet pickup, and monitor real-time SLA metrics across Delhi NCR.
            </p>
          </div>

          {/* Quick Search Form */}
          <form onSubmit={handleSearch} className="w-full md:w-auto flex items-center gap-2 shrink-0">
            <div className="relative w-full md:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Order ID / Tracking ID"
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-slate-400 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white/15 transition-all shadow-inner"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-extrabold transition-all shadow-lg hover:shadow-orange-500/25 flex items-center gap-1.5 shrink-0"
            >
              <Zap className="w-3.5 h-3.5" /> Track
            </button>
          </form>
        </div>

        {/* Category Service Selector Pills (Swiggy Instamart Style) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-white/10">
          <Link to="/customer/create-order" className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xs flex items-center gap-3 transition-all group">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-white group-hover:text-orange-300 transition-colors">Express B2C</p>
              <p className="text-[10px] text-slate-400">Instant Local Pickups</p>
            </div>
          </Link>

          <Link to="/customer/create-order" className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xs flex items-center gap-3 transition-all group">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-white group-hover:text-indigo-300 transition-colors">Commercial B2B</p>
              <p className="text-[10px] text-slate-400">Bulk Freight Dispatch</p>
            </div>
          </Link>

          <Link to="/customer/shipments" className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xs flex items-center gap-3 transition-all group">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-white group-hover:text-emerald-300 transition-colors">Scheduled Slot</p>
              <p className="text-[10px] text-slate-400">Guaranteed Delivery Window</p>
            </div>
          </Link>

          <Link to="/customer/tracking" className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xs flex items-center gap-3 transition-all group">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-white group-hover:text-cyan-300 transition-colors">Tamper Sealed</p>
              <p className="text-[10px] text-slate-400">OTP Verified Delivery</p>
            </div>
          </Link>
        </div>
      </div>

      {/* ── KPI Cards (Swiggy / Zomato Micro-Gradient Style) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Link
          to="/customer/shipments?tab=ACTIVE"
          className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Active Shipments</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-3xl font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">{active.length}</p>
              {active.length > 0 && <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Truck className="w-6 h-6" />
          </div>
        </Link>

        <Link
          to="/customer/shipments?tab=DELIVERED"
          className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Delivered</p>
            <p className="text-3xl font-extrabold text-slate-900 group-hover:text-emerald-600 transition-colors mt-1">{delivered.length}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </Link>

        <Link
          to="/customer/shipments?tab=ACTIVE"
          className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Pending Dispatch</p>
            <p className="text-3xl font-extrabold text-slate-900 group-hover:text-amber-600 transition-colors mt-1">{pending.length}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Clock className="w-6 h-6" />
          </div>
        </Link>

        <Link
          to="/customer/shipments?tab=CANCELLED"
          className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Cancelled / Exception</p>
            <p className="text-3xl font-extrabold text-slate-900 group-hover:text-rose-600 transition-colors mt-1">{cancelled.length}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <XCircle className="w-6 h-6" />
          </div>
        </Link>
      </div>

      {/* ── Main 2-Col Content Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

        {/* LEFT COLUMN */}
        <div className="space-y-6">

          {/* Swiggy Style Active Delivery Live Card */}
          {currentOrder ? (
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden hover:shadow-md transition-all">
              <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-white font-extrabold text-xs uppercase tracking-wider">Live Delivery Radar</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${statusBadgeClass(currentOrder.status)}`}>
                  {currentOrder.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="p-6 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <Link to={`/customer/orders/${currentOrder.id}`} className="font-mono font-extrabold text-indigo-600 text-lg hover:underline flex items-center gap-2">
                      {currentOrder.orderNumber}
                      <ArrowUpRight className="w-4 h-4 text-slate-400" />
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-slate-600 pt-1">
                      <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate max-w-[160px]">{currentOrder.pickupAddress}</span>
                      <span className="text-slate-300 font-mono">→</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[160px]">{currentOrder.dropAddress}</span>
                    </div>
                  </div>

                  <div className="text-right bg-orange-50/80 border border-orange-100 rounded-2xl p-3 shrink-0">
                    <p className="text-[10px] text-orange-800 font-bold uppercase tracking-wider">Estimated SLA</p>
                    <p className="text-xl font-extrabold text-orange-600">12–18 min</p>
                    <p className="text-[11px] text-slate-500">Live Agent ~2.4 km</p>
                  </div>
                </div>

                {/* Animated Route Progress Indicator (Swiggy Live Tracker Style) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span>Dispatch Hub</span>
                    <span className="text-indigo-600">On-Track • 75% Completed</span>
                    <span>Destination</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs shrink-0" />
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-orange-500 rounded-full animate-pulse transition-all duration-500"
                        style={{ width: '75%' }}
                      />
                    </div>
                    <div className="w-3.5 h-3.5 rounded-full bg-orange-500 border-2 border-white shadow-xs shrink-0" />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="text-xs text-slate-600">
                    {currentOrder.assignedAgent?.user?.name ? (
                      <span className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                          {currentOrder.assignedAgent.user.name.charAt(0)}
                        </span>
                        <span>Assigned Agent: <strong className="text-slate-900 font-bold">{currentOrder.assignedAgent.user.name}</strong></span>
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">Auto-dispatching nearest available NCR agent...</span>
                    )}
                  </div>

                  <Link
                    to={`/customer/orders/${currentOrder.id}`}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all hover:scale-[1.02]"
                  >
                    <Navigation className="w-4 h-4" /> Open Live Map GPS
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto shadow-inner">
                <Package className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">No Active Deliveries Right Now</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">Book instant hyperlocal delivery or commercial freight dispatch across NCR in 30 seconds.</p>
              </div>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <Link
                  to="/customer/create-order"
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-extrabold shadow-lg hover:shadow-orange-500/25 transition-all flex items-center gap-2 hover:scale-[1.02]"
                >
                  <PlusCircle className="w-4 h-4" /> Create New Shipment
                </Link>
              </div>
            </div>
          )}

          {/* Swiggy/Zomato Recent Shipments List */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Recent Shipments</h3>
                <p className="text-[11px] text-slate-400">All historical and active customer orders</p>
              </div>
              <Link to="/customer/shipments" className="text-xs text-indigo-600 font-extrabold hover:underline flex items-center gap-1">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-orange-500" />
                <span>Loading your shipments history...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs">No shipments recorded yet.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {orders.slice(0, 5).map(o => (
                  <div key={o.id} className="p-4 md:px-6 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors">
                    <div className="flex items-center gap-3.5">
                      <div className={`w-3 h-3 rounded-full shrink-0 ${statusDot(o.status)}`} />
                      <div>
                        <Link to={`/customer/orders/${o.id}`} className="font-mono font-extrabold text-slate-900 text-xs hover:text-indigo-600 transition-colors flex items-center gap-1">
                          {o.orderNumber}
                          <ArrowUpRight className="w-3 h-3 text-slate-400" />
                        </Link>
                        <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs truncate">
                          {(o.pickupAddress || '').substring(0, 20)}… → {(o.dropAddress || '').substring(0, 16)}…
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${statusBadgeClass(o.status)}`}>
                          {o.status.replace(/_/g, ' ')}
                        </span>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{formatRelative(o.updatedAt)}</p>
                      </div>
                      <span className="font-extrabold text-slate-900 text-sm font-mono">₹{o.totalAmount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">

          {/* Quick Actions Panel */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-5 space-y-2">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">QUICK WORKSPACE ACTIONS</h4>

            <Link to="/customer/create-order" className="flex items-center gap-3.5 p-3.5 rounded-2xl hover:bg-orange-50/60 border border-transparent hover:border-orange-100 transition-all group">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-extrabold text-slate-900 group-hover:text-orange-600 transition-colors">New Shipment</p>
                <p className="text-[11px] text-slate-400">Create a new delivery request</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600" />
            </Link>

            <Link to="/customer/tracking" className="flex items-center gap-3.5 p-3.5 rounded-2xl hover:bg-indigo-50/60 border border-transparent hover:border-indigo-100 transition-all group">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Navigation className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">Live GPS Tracking</p>
                <p className="text-[11px] text-slate-400">Track active driver location</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600" />
            </Link>

            <Link to="/customer/shipments" className="flex items-center gap-3.5 p-3.5 rounded-2xl hover:bg-purple-50/60 border border-transparent hover:border-purple-100 transition-all group">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Package className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-extrabold text-slate-900 group-hover:text-purple-600 transition-colors">My Shipments</p>
                <p className="text-[11px] text-slate-400">Manage all past orders</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600" />
            </Link>

            <Link to="/customer/addresses" className="flex items-center gap-3.5 p-3.5 rounded-2xl hover:bg-emerald-50/60 border border-transparent hover:border-emerald-100 transition-all group">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-extrabold text-slate-900 group-hover:text-emerald-600 transition-colors">Saved Addresses</p>
                <p className="text-[11px] text-slate-400">Address book manager</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600" />
            </Link>

            <Link to="/customer/notifications" className="flex items-center gap-3.5 p-3.5 rounded-2xl hover:bg-rose-50/60 border border-transparent hover:border-rose-100 transition-all group">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-extrabold text-slate-900 group-hover:text-rose-600 transition-colors">Notifications</p>
                <p className="text-[11px] text-slate-400">Email & SMS alerts log</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600" />
            </Link>
          </div>

          {/* Delivery Performance Widget */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 rounded-3xl p-6 text-white shadow-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-extrabold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                <Activity className="w-4 h-4" /> DELIVERY STATS
              </p>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-500/30">
                100% SLA SAFE
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
                <p className="text-[10px] text-slate-300 font-semibold">Total Orders</p>
                <p className="text-xl font-extrabold text-white mt-0.5">{orders.length}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
                <p className="text-[10px] text-slate-300 font-semibold">Success Rate</p>
                <p className="text-xl font-extrabold text-emerald-400 mt-0.5">
                  {orders.length ? `${Math.round((delivered.length / orders.length) * 100)}%` : '100%'}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
                <p className="text-[10px] text-slate-300 font-semibold">Completed</p>
                <p className="text-xl font-extrabold text-white mt-0.5">{delivered.length}</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-3.5 border border-white/10">
                <p className="text-[10px] text-slate-300 font-semibold">Average Ticket</p>
                <p className="text-xl font-extrabold text-amber-300 mt-0.5">
                  {orders.length ? `₹${Math.round(orders.reduce((s, o) => s + Number(o.totalAmount || 0), 0) / orders.length)}` : '₹0'}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
