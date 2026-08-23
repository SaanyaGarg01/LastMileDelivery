import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';
import {
  Package, Search, RefreshCw, Navigation, RotateCcw,
  ChevronRight, MapPin, Calendar, Weight, TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'ALL',       label: 'All',          color: '' },
  { id: 'ACTIVE',    label: 'Active',       color: 'sky' },
  { id: 'DELIVERED', label: 'Delivered',    color: 'emerald' },
  { id: 'FAILED',    label: 'Failed',       color: 'rose' },
  { id: 'CANCELLED', label: 'Cancelled',    color: 'slate' },
];

const STATUS_STYLE = {
  OUT_FOR_DELIVERY: { bg: 'bg-sky-50', badge: 'bg-sky-100 text-sky-700 border-sky-200', dot: 'bg-sky-500' },
  IN_TRANSIT:       { bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  DELIVERED:        { bg: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  FAILED:           { bg: 'bg-rose-50', badge: 'bg-rose-100 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  CANCELLED:        { bg: '', badge: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-400' },
  CREATED:          { bg: '', badge: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  ASSIGNED:         { bg: '', badge: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  PICKED_UP:        { bg: '', badge: 'bg-indigo-100 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
  RESCHEDULED:      { bg: '', badge: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
};

const ACTIVE_STATUSES = ['CREATED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'RESCHEDULED'];

const formatDate = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function MyShipmentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const activeTab = searchParams.get('tab') || 'ALL';

  useEffect(() => { fetchOrders(); }, [typeFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter) params.orderType = typeFilter;
      const res = await api.get('/orders', { params });
      if (res.data.success) setOrders(res.data.orders);
    } catch { toast.error('Failed to load shipments'); }
    finally { setLoading(false); }
  };

  const setTab = (tab) => setSearchParams({ tab });

  const filtered = orders.filter(o => {
    const matchesSearch = !searchQuery ||
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.pickupAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.dropAddress?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = activeTab === 'ALL' ? true
      : activeTab === 'ACTIVE' ? ACTIVE_STATUSES.includes(o.status)
      : activeTab === 'DELIVERED' ? o.status === 'DELIVERED'
      : activeTab === 'FAILED' ? o.status === 'FAILED'
      : activeTab === 'CANCELLED' ? o.status === 'CANCELLED'
      : true;

    return matchesSearch && matchesTab;
  });

  // Tab counts
  const counts = {
    ALL: orders.length,
    ACTIVE: orders.filter(o => ACTIVE_STATUSES.includes(o.status)).length,
    DELIVERED: orders.filter(o => o.status === 'DELIVERED').length,
    FAILED: orders.filter(o => o.status === 'FAILED').length,
    CANCELLED: orders.filter(o => o.status === 'CANCELLED').length,
  };

  const isActiveOrder = (o) => ACTIVE_STATUSES.includes(o.status);
  const styleFor = (status) => STATUS_STYLE[status] || STATUS_STYLE.CREATED;

  return (
    <div className="max-w-4xl mx-auto space-y-4">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Orders</h1>
          <p className="text-xs text-slate-500">Manage and track all your delivery orders</p>
        </div>
        <Link to="/customer/create-order"
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-colors"
        >
          + New Shipment
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1.5 overflow-x-auto shadow-sm">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all
              ${activeTab === t.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
          >
            {t.label}
            {counts[t.id] > 0 && (
              <span className={`text-[10px] font-extrabold rounded-full px-1.5 py-0.5 min-w-[18px] text-center
                ${activeTab === t.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {counts[t.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID or address..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 font-semibold"
        >
          <option value="">All Types</option>
          <option value="B2C">B2C Retail</option>
          <option value="B2B">B2B Corporate</option>
        </select>
        <button
          onClick={fetchOrders}
          className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-sky-500 mx-auto mb-2" /> Loading shipments...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-600 text-sm">No shipments found</p>
            <p className="text-xs text-slate-400">
              {activeTab !== 'ALL' ? `No ${activeTab.toLowerCase()} orders.` : 'You have no orders yet.'}
            </p>
            <Link to="/customer/create-order"
              className="inline-block px-5 py-2.5 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-500"
            >
              Create Your First Shipment
            </Link>
          </div>
        ) : (
          filtered.map(o => {
            const s = styleFor(o.status);
            const isActive = isActiveOrder(o);
            return (
              <div key={o.id}
                className={`bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-shadow hover:shadow-md ${s.bg}`}
              >
                {/* Card header */}
                <div className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${s.dot} ${isActive ? 'animate-pulse' : ''}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <Link to={`/customer/orders/${o.id}`}
                          className="font-mono font-extrabold text-slate-900 text-sm hover:text-sky-600 transition-colors"
                        >
                          {o.orderNumber}
                        </Link>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${s.badge}`}>
                          {o.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          {o.orderType} • {o.paymentType}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{o.pickupAddress?.substring(0, 25)}</span>
                        <span className="font-mono text-slate-300">→</span>
                        <span>{o.dropAddress?.substring(0, 25)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-extrabold text-slate-900 text-base">₹{o.totalAmount}</p>
                      <p className="text-[10px] text-slate-400">{o.chargeableWeight}kg • {formatDate(o.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Card footer with actions */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400">
                    {o.status === 'DELIVERED' && o.actualDeliveryAt && (
                      <span>Delivered: {formatDate(o.actualDeliveryAt)}</span>
                    )}
                    {o.status === 'OUT_FOR_DELIVERY' && (
                      <span className="text-sky-600 font-semibold">Arriving in 12–18 min</span>
                    )}
                    {o.status === 'IN_TRANSIT' && (
                      <span className="text-blue-600 font-semibold">In transit to destination</span>
                    )}
                    {o.status === 'FAILED' && (
                      <span className="text-rose-600 font-semibold">Delivery attempt failed</span>
                    )}
                    {o.status === 'CANCELLED' && (
                      <span className="text-slate-500">⚪ Cancelled — No ETA</span>
                    )}
                    {['CREATED', 'ASSIGNED', 'PICKED_UP'].includes(o.status) && (
                      <span>Updated: {formatDate(o.updatedAt)}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/customer/orders/${o.id}`}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      View Details
                    </Link>

                    {isActive && o.status !== 'CANCELLED' && (
                      <Link
                        to="/customer/tracking"
                        className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Navigation className="w-3 h-3" /> Track Live
                      </Link>
                    )}

                    {o.status === 'FAILED' && (
                      <Link
                        to={`/customer/orders/${o.id}`}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" /> Reschedule
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

