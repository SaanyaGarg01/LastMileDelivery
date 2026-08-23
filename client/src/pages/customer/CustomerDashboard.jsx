import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import {
  Package, Truck, CheckCircle2, AlertTriangle, XCircle,
  ArrowRight, Search, PlusCircle, Clock, Navigation,
  MapPin, Bell, ChevronRight, RefreshCw
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
    } catch { toast.error('Failed to load shipments'); }
    finally { setLoading(false); }
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
      OUT_FOR_DELIVERY: 'bg-sky-100 text-sky-700 border-sky-200',
      IN_TRANSIT: 'bg-blue-100 text-blue-700 border-blue-200',
      DELIVERED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      FAILED: 'bg-rose-100 text-rose-700 border-rose-200',
      CANCELLED: 'bg-slate-100 text-slate-500 border-slate-200',
      CREATED: 'bg-amber-100 text-amber-700 border-amber-200',
      ASSIGNED: 'bg-purple-100 text-purple-700 border-purple-200',
      PICKED_UP: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      RESCHEDULED: 'bg-orange-100 text-orange-700 border-orange-200',
    };
    return map[status] || 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const statusDot = (status) => {
    const map = {
      OUT_FOR_DELIVERY: 'bg-sky-500',
      IN_TRANSIT: 'bg-blue-500',
      DELIVERED: 'bg-emerald-500',
      FAILED: 'bg-rose-500',
      CANCELLED: 'bg-slate-400',
      CREATED: 'bg-amber-500',
      ASSIGNED: 'bg-purple-500',
      PICKED_UP: 'bg-indigo-500',
    };
    return map[status] || 'bg-slate-300';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* ── Greeting Row ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {getGreeting()}, <span className="text-sky-600">{user?.name?.split(' ')[0] || 'there'}</span> 👋
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Track your active shipments in real time</p>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Order ID / Tracking ID"
              className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900 w-48 focus:outline-none focus:ring-2 focus:ring-sky-300"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          </div>
          <button type="submit" className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors">
            Track
          </button>
        </form>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link to="/customer/shipments?tab=ACTIVE"
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Active Shipments</p>
            <p className="text-3xl font-extrabold text-sky-600 mt-1">{active.length}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-sky-50 flex items-center justify-center">
            <Truck className="w-5 h-5 text-sky-500" />
          </div>
        </Link>

        <Link to="/customer/shipments?tab=DELIVERED"
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Delivered</p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-1">{delivered.length}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
        </Link>

        <Link to="/customer/shipments?tab=ACTIVE"
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Pending</p>
            <p className="text-3xl font-extrabold text-amber-600 mt-1">{pending.length}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
        </Link>

        <Link to="/customer/shipments?tab=CANCELLED"
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Cancelled</p>
            <p className="text-3xl font-extrabold text-rose-600 mt-1">{cancelled.length}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-50 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-rose-500" />
          </div>
        </Link>
      </div>

      {/* ── Main 2-col layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">

        {/* LEFT */}
        <div className="space-y-4">

          {/* Current Delivery */}
          {currentOrder ? (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-white font-bold text-xs uppercase tracking-wide">Current Delivery</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${statusBadgeClass(currentOrder.status)}`}>
                  {currentOrder.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link to={`/customer/orders/${currentOrder.id}`} className="font-mono font-extrabold text-sky-600 text-base hover:underline">
                      {currentOrder.orderNumber}
                    </Link>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate max-w-[200px]">{currentOrder.pickupAddress}</span>
                      <span className="text-slate-300 font-mono">→</span>
                      <span className="truncate max-w-[200px]">{currentOrder.dropAddress}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Arriving in</p>
                    <p className="text-lg font-extrabold text-slate-900">12–18 min</p>
                    <p className="text-[11px] text-slate-400">2.4 km away</p>
                  </div>
                </div>

                {/* Route progress bar */}
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-sky-500 rounded-full" style={{ width: '75%' }} />
                  </div>
                  <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    {currentOrder.assignedAgent?.user?.name && (
                      <span>Agent: <strong className="text-slate-800">{currentOrder.assignedAgent.user.name}</strong></span>
                    )}
                  </div>
                  <Link to="/customer/tracking"
                    className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow transition-colors">
                    <Navigation className="w-3.5 h-3.5" /> Track Live
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
              <Package className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-600">No active deliveries right now</p>
              <Link to="/customer/create-order"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-sky-600 text-white text-xs font-extrabold hover:bg-sky-500 transition-colors">
                <PlusCircle className="w-4 h-4" /> Create New Shipment
              </Link>
            </div>
          )}

          {/* Recent Shipments */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800">Recent Shipments</span>
              <Link to="/customer/shipments" className="text-xs text-sky-600 font-semibold hover:underline flex items-center gap-1">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="p-6 text-center text-xs text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-500" /> Loading...
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No shipments yet.</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {orders.slice(0, 5).map(o => (
                  <div key={o.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${statusDot(o.status)}`} />
                      <div>
                        <Link to={`/customer/orders/${o.id}`} className="font-mono font-bold text-slate-900 text-xs hover:text-sky-600 transition-colors">
                          {o.orderNumber}
                        </Link>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {(o.pickupAddress || '').substring(0, 18)}… → {(o.dropAddress || '').substring(0, 14)}…
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadgeClass(o.status)}`}>
                          {o.status.replace(/_/g, ' ')}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{formatRelative(o.updatedAt)}</p>
                      </div>
                      <span className="font-bold text-slate-700 text-xs">₹{o.totalAmount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-4">

          {/* Quick Actions */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</p>

            <Link to="/customer/create-order" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
              <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                <PlusCircle className="w-4 h-4 text-sky-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-800 group-hover:text-sky-700">New Shipment</p>
                <p className="text-[11px] text-slate-400">Create a new delivery</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
            </Link>

            <Link to="/customer/tracking" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <Navigation className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-800 group-hover:text-sky-700">Live Tracking</p>
                <p className="text-[11px] text-slate-400">Track your package</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
            </Link>

            <Link to="/customer/shipments" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
              <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-800 group-hover:text-sky-700">My Shipments</p>
                <p className="text-[11px] text-slate-400">View all orders</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
            </Link>

            <Link to="/customer/addresses" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-800 group-hover:text-sky-700">Saved Addresses</p>
                <p className="text-[11px] text-slate-400">Manage address book</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
            </Link>

            <Link to="/customer/notifications" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
              <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 text-rose-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-800 group-hover:text-sky-700">Notifications</p>
                <p className="text-[11px] text-slate-400">View alerts</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
            </Link>
          </div>

          {/* Delivery Stats */}
          <div className="bg-gradient-to-br from-sky-600 to-indigo-600 rounded-2xl p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-wide opacity-75 mb-3">Delivery Stats</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-[10px] opacity-70">Total Orders</p>
                <p className="text-lg font-extrabold">{orders.length}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-[10px] opacity-70">Success Rate</p>
                <p className="text-lg font-extrabold">
                  {orders.length ? `${Math.round((delivered.length / orders.length) * 100)}%` : '—'}
                </p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-[10px] opacity-70">Delivered</p>
                <p className="text-lg font-extrabold">{delivered.length}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-[10px] opacity-70">Avg Amount</p>
                <p className="text-lg font-extrabold">
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
