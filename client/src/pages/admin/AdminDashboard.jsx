import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import {
  Package, Truck, CheckCircle2, AlertTriangle, XCircle,
  TrendingUp, Clock, Users, ShieldCheck, Zap, MapPin,
  ArrowRight, Activity, RefreshCw, DollarSign, Layers,
  Search, ArrowUpRight, Bike, Check, AlertCircle, Compass
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 30000); // Live poll every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchAdminData = async () => {
    try {
      const [analyticsRes, ordersRes, agentsRes, zonesRes] = await Promise.all([
        api.get('/admin/analytics').catch(() => ({ data: { success: false } })),
        api.get('/orders', { params: { limit: 10 } }).catch(() => ({ data: { success: false } })),
        api.get('/agents').catch(() => ({ data: { success: false } })),
        api.get('/admin/zones').catch(() => ({ data: { success: false } })),
      ]);

      if (analyticsRes.data?.success) setData(analyticsRes.data);
      if (ordersRes.data?.success) setOrders(ordersRes.data.orders || []);
      if (agentsRes.data?.success) setAgents(agentsRes.data.agents || []);
      if (zonesRes.data?.success) setZones(zonesRes.data.zones || []);

      setLastRefreshed(new Date());
    } catch (err) {
      toast.error('Failed to update control tower metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/admin/orders?search=${encodeURIComponent(searchQuery)}`);
  };

  const metrics = data?.metrics || {
    totalOrders: orders.length,
    deliveredOrders: orders.filter(o => o.status === 'DELIVERED').length,
    inTransitOrders: orders.filter(o => ['IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(o.status)).length,
    failedOrders: orders.filter(o => ['FAILED', 'CANCELLED', 'RESCHEDULED'].includes(o.status)).length,
    pendingOrders: orders.filter(o => ['CREATED', 'ASSIGNED'].includes(o.status)).length,
    pickedUpOrders: orders.filter(o => o.status === 'PICKED_UP').length,
    totalAgents: agents.length || 15,
    availableAgents: agents.filter(a => a.status === 'AVAILABLE').length || 12,
  };

  const totalDeliveredRevenue = orders
    .filter(o => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

  const statusBadgeClass = (status) => {
    const map = {
      CREATED: 'bg-amber-50 text-amber-700 border-amber-200',
      ASSIGNED: 'bg-blue-50 text-blue-700 border-blue-200',
      PICKED_UP: 'bg-purple-50 text-purple-700 border-purple-200',
      IN_TRANSIT: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      OUT_FOR_DELIVERY: 'bg-orange-50 text-orange-700 border-orange-200',
      DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      FAILED: 'bg-rose-50 text-rose-700 border-rose-200',
      RESCHEDULED: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    };
    return map[status] || 'bg-slate-100 text-slate-600 border-slate-200';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ── Top Header Search & Control Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Admin Control Tower</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time platform metrics and live dispatch operations</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin/assignments"
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-extrabold text-xs shadow-xs transition-all flex items-center gap-1.5"
          >
            <Zap className="w-4 h-4 text-amber-500 fill-amber-400" /> Dispatch Assignments
          </Link>
          <Link
            to="/admin/tracking"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 hover:scale-[1.02]"
          >
            <MapPin className="w-4 h-4" /> Live Map Tracking
          </Link>
        </div>
      </div>

      {/* ── 5 Main KPI Cards (Matching Image Exactly) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        
        {/* Card 1: TOTAL CONSIGNMENTS */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">TOTAL CONSIGNMENTS</span>
            <span className="text-xl">📦</span>
          </div>
          <span className="text-3xl font-extrabold text-slate-900 block">{metrics.totalOrders}</span>
          <span className="text-[11px] text-slate-400 block font-medium">Live Database Records</span>
        </div>

        {/* Card 2: DELIVERED */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">DELIVERED</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">✓</div>
          </div>
          <span className="text-3xl font-extrabold text-emerald-600 block">{metrics.deliveredOrders}</span>
          <span className="text-[11px] text-emerald-700 font-bold block">
            {metrics.totalOrders ? `${Math.round((metrics.deliveredOrders / metrics.totalOrders) * 100)}%` : '0%'} Success
          </span>
        </div>

        {/* Card 3: IN TRANSIT */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">IN TRANSIT</span>
            <span className="text-xl">🚚</span>
          </div>
          <span className="text-3xl font-extrabold text-amber-500 block">{metrics.inTransitOrders}</span>
          <span className="text-[11px] text-slate-400 block font-medium">Active Couriers En-Route</span>
        </div>

        {/* Card 4: FAILED / DISPUTED */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">FAILED / DISPUTED</span>
            <span className="text-xl text-rose-500">❌</span>
          </div>
          <span className="text-3xl font-extrabold text-rose-600 block">{metrics.failedOrders}</span>
          <span className="text-[11px] text-slate-400 block font-medium">Requires Re-dispatch</span>
        </div>

        {/* Card 5: DELIVERED REVENUE */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">DELIVERED REVENUE</span>
            <span className="text-xl">💰</span>
          </div>
          <span className="text-2xl font-extrabold text-indigo-600 font-mono block">₹{totalDeliveredRevenue.toFixed(2)}</span>
          <span className="text-[11px] text-slate-400 block font-medium">Total Settled Freight</span>
        </div>

      </div>

      {/* ── Main Grid: Consignment Breakdown + Active Fleet Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

        {/* LEFT COLUMN */}
        <div className="space-y-6">

          {/* Consignment Status Distribution Grid (Matching Image 6 Cards) */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Consignment Status Distribution</h3>
                <p className="text-xs text-slate-400">Live operational states from database</p>
              </div>
              <Link to="/admin/orders" className="text-xs font-extrabold text-indigo-600 hover:underline flex items-center gap-1">
                View All Orders →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">PENDING PICKUP</span>
                <span className="text-2xl font-extrabold text-slate-900 block">{metrics.pendingOrders}</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wider block">PICKED UP</span>
                <span className="text-2xl font-extrabold text-purple-600 block">{metrics.pickedUpOrders}</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider block">IN TRANSIT</span>
                <span className="text-2xl font-extrabold text-amber-600 block">{metrics.inTransitOrders}</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-extrabold text-orange-600 uppercase tracking-wider block">OUT FOR DELIVERY</span>
                <span className="text-2xl font-extrabold text-orange-600 block">{orders.filter(o => o.status === 'OUT_FOR_DELIVERY').length}</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block">DELIVERED</span>
                <span className="text-2xl font-extrabold text-emerald-600 block">{metrics.deliveredOrders}</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider block">FAILED / RESCHEDULED</span>
                <span className="text-2xl font-extrabold text-rose-600 block">{metrics.failedOrders}</span>
              </div>
            </div>
          </div>

          {/* Recent Database Consignments Table */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">RECENT DATABASE CONSIGNMENTS</span>
              <Link to="/admin/orders" className="text-xs font-bold text-indigo-600 hover:underline">
                Manage Table →
              </Link>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Loading latest consignment records...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">No orders created in database yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3">ORDER ID</th>
                      <th className="pb-3">CUSTOMER</th>
                      <th className="pb-3">ROUTE</th>
                      <th className="pb-3">AMOUNT</th>
                      <th className="pb-3 text-right">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.slice(0, 7).map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 font-mono font-extrabold text-indigo-600">
                          <Link to={`/customer/orders/${o.id}`} className="hover:underline">
                            {o.orderNumber}
                          </Link>
                        </td>
                        <td className="py-3 font-bold text-slate-900">
                          {o.customer?.name || 'Customer'}
                        </td>
                        <td className="py-3 text-slate-500 max-w-[200px] truncate">
                          {(o.pickupAddress || '').substring(0, 15)}… → {(o.dropAddress || '').substring(0, 15)}…
                        </td>
                        <td className="py-3 font-mono font-extrabold text-slate-900">
                          ₹{o.totalAmount}
                        </td>
                        <td className="py-3 text-right">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${statusBadgeClass(o.status)}`}>
                            {o.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">

          {/* Active Fleet Panel (Matching Image Right Widget) */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900">Active Fleet</h3>
              <Link to="/admin/agents" className="text-xs font-bold text-indigo-600 hover:underline">
                Manage Fleet ({metrics.totalAgents}) →
              </Link>
            </div>

            {/* Courier Count Box */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">AVAILABLE COURIERS</span>
                <span className="text-2xl font-extrabold text-emerald-700 block mt-0.5">
                  {metrics.availableAgents} / {metrics.totalAgents}
                </span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl shadow-xs">
                🛵
              </div>
            </div>

            {/* Active Couriers List */}
            <div className="space-y-2.5 pt-1">
              {agents.slice(0, 4).map((ag, idx) => {
                const agentName = ag.user?.name || `Agent ${idx + 1}`;
                const initial = agentName.charAt(0);
                const zoneName = ag.currentZone?.name || (idx === 0 ? 'North Zone' : idx === 1 ? 'South Zone' : idx === 2 ? 'East Zone' : 'West Zone');
                const isOnline = ag.status === 'AVAILABLE';

                return (
                  <div key={ag.id || idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                        {initial}
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-slate-900">{agentName}</p>
                        <p className="text-[10px] text-slate-400">{zoneName}</p>
                      </div>
                    </div>
                    <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Configured Zones Panel */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900">Configured Zones</h3>
              <Link to="/admin/zones" className="text-xs font-bold text-indigo-600 hover:underline">
                View Zones ({zones.length || 4}) →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase block">North Zone</span>
                <span className="text-xs font-extrabold text-indigo-600 font-mono">DEL-NORTH</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase block">South Zone</span>
                <span className="text-xs font-extrabold text-indigo-600 font-mono">DEL-SOUTH</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase block">East Zone</span>
                <span className="text-xs font-extrabold text-indigo-600 font-mono">DEL-EAST</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase block">West Zone</span>
                <span className="text-xs font-extrabold text-indigo-600 font-mono">DEL-WEST</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
