import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid,
  RadialBarChart, RadialBar
} from 'recharts';
import {
  Package, Truck, CheckCircle2, AlertTriangle, TrendingUp,
  Clock, Users, ShieldCheck, Zap, MapPin, ArrowRight,
  Activity, RefreshCw, BarChart2, Circle
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  CREATED: '#64748b',
  ASSIGNED: '#3b82f6',
  PICKED_UP: '#8b5cf6',
  IN_TRANSIT: '#f59e0b',
  OUT_FOR_DELIVERY: '#f97316',
  DELIVERED: '#10b981',
  FAILED: '#ef4444',
  RESCHEDULED: '#06b6d4',
};

const CHART_COLORS = ['#0284c7', '#10b981', '#f43f5e', '#a855f7', '#f59e0b', '#f97316', '#06b6d4'];

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KPICard({ label, value, sub, icon: Icon, color, bg, border, trend }) {
  return (
    <div className={`p-5 rounded-2xl bg-white border ${border} shadow-xs space-y-2`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold text-slate-500 flex items-center gap-1.5`}>
          <Icon className={`w-4 h-4 ${color}`} /> {label}
        </span>
        {trend !== undefined && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            trend > 0 ? 'bg-emerald-100 text-emerald-700' : trend < 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
          }`}>
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '—'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <span className={`text-3xl font-extrabold block ${color}`}>{value}</span>
      {sub && <span className="text-[11px] text-slate-400 block">{sub}</span>}
    </div>
  );
}

// ─── Status Distribution Donut ────────────────────────────────────────────────
const CustomDonutLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// ─── Live Activity Feed ───────────────────────────────────────────────────────
function LiveActivityFeed({ orders }) {
  const recent = [...(orders || [])].slice(0, 8);
  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-sky-600" /> Live Order Activity
        </h3>
        <Link to="/admin/orders" className="text-xs text-sky-600 font-bold hover:underline flex items-center gap-1">
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="space-y-2">
        {recent.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No recent orders</p>
        ) : (
          recent.map((o) => (
            <div key={o.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[o.status] || '#94a3b8' }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{o.orderNumber}</p>
                <p className="text-[10px] text-slate-400 truncate">{o.customer?.name} • {o.pickupZone?.code} → {o.dropZone?.code}</p>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border" style={{
                color: STATUS_COLORS[o.status] || '#64748b',
                backgroundColor: (STATUS_COLORS[o.status] || '#64748b') + '15',
                borderColor: (STATUS_COLORS[o.status] || '#64748b') + '30',
              }}>
                {o.status.replace('_', ' ')}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Fleet Utilization Ring ────────────────────────────────────────────────────
function FleetUtilizationRing({ available, total }) {
  const utilization = total > 0 ? Math.round(((total - available) / total) * 100) : 0;
  const data = [{ name: 'Busy', value: total - available }, { name: 'Free', value: available }];
  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col items-center">
      <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3 self-start">Fleet Utilization</h3>
      <div className="relative">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" startAngle={90} endAngle={-270}>
              <Cell fill="#0284c7" />
              <Cell fill="#e2e8f0" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold text-sky-700">{utilization}%</span>
          <span className="text-[10px] text-slate-400 font-semibold">In Use</span>
        </div>
      </div>
      <div className="flex gap-4 mt-2 text-xs">
        <div className="text-center">
          <p className="font-extrabold text-sky-700">{total - available}</p>
          <p className="text-[10px] text-slate-400">Busy</p>
        </div>
        <div className="text-center">
          <p className="font-extrabold text-emerald-700">{available}</p>
          <p className="text-[10px] text-slate-400">Available</p>
        </div>
        <div className="text-center">
          <p className="font-extrabold text-slate-900">{total}</p>
          <p className="text-[10px] text-slate-400">Total</p>
        </div>
      </div>
    </div>
  );
}

// ─── Quick Actions Bar ─────────────────────────────────────────────────────────
function QuickActionsBar() {
  const actions = [
    { label: '🚀 Mission Control', to: '/admin/mission-control', icon: Zap, color: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md' },
    { label: '🚦 Risk Radar', to: '/admin/risk-radar', icon: ShieldCheck, color: 'bg-rose-600 hover:bg-rose-500 text-white shadow-md' },
    { label: '📈 Optimization Impact', to: '/admin/optimization', icon: TrendingUp, color: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md' },
    { label: '📦 Bulk CSV Import', to: '/admin/bulk-orders', icon: Package, color: 'bg-sky-600 hover:bg-sky-500 text-white' },
    { label: '💵 Settlements Desk', to: '/admin/settlements', icon: BarChart2, color: 'bg-amber-500 hover:bg-amber-400 text-white' },
    { label: 'Manage Orders', to: '/admin/orders', icon: Package, color: 'bg-slate-900 hover:bg-slate-800 text-white' },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(({ label, to, icon: Icon, color }) => (
        <Link key={to} to={to} className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all ${color}`}>
          <Icon className="w-4 h-4" /> {label}
        </Link>
      ))}
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 60000); // Auto-refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchAll = async () => {
    try {
      const [analyticsRes, ordersRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/orders', { params: { limit: 8 } }),
      ]);
      if (analyticsRes.data.success) setData(analyticsRes.data);
      if (ordersRes.data.success) setRecentOrders(ordersRes.data.orders || []);
      setLastRefreshed(new Date());
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 rounded-2xl bg-slate-100" />
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-slate-100" />)}</div>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 h-72 rounded-2xl bg-slate-100" />
          <div className="col-span-4 h-72 rounded-2xl bg-slate-100" />
        </div>
      </div>
    );
  }

  const { metrics, charts } = data || {};

  // Build color-coded pie data from status breakdown
  const statusPieData = (charts?.ordersByStatus || []).map((item) => ({
    ...item,
    fill: STATUS_COLORS[item.status] || '#94a3b8',
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Logistics Operations Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time system health, delivery metrics, and fleet utilization
            <span className="ml-2 text-[10px] text-slate-400">· Refreshed {lastRefreshed.toLocaleTimeString()}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchAll} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs">
            <RefreshCw className="w-4 h-4" />
          </button>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Systems Operational
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActionsBar />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Orders" value={metrics.totalOrders} sub="All time, all segments" icon={Package} color="text-sky-700" bg="bg-sky-50" border="border-sky-100" />
        <KPICard label="Delivery Success" value={`${metrics.successRate}%`} sub={`${metrics.deliveredOrders} delivered`} icon={TrendingUp} color="text-emerald-600" bg="bg-emerald-50" border="border-emerald-200" trend={metrics.successRate > 80 ? 5 : -2} />
        <KPICard label="Active Shipments" value={metrics.inTransitOrders + metrics.outForDeliveryOrders} sub="In transit + out for delivery" icon={Truck} color="text-sky-600" bg="bg-sky-50" border="border-sky-100" />
        <KPICard label="Pending Queue" value={metrics.pendingOrders} sub="Awaiting assignment" icon={Clock} color="text-amber-600" bg="bg-amber-50" border="border-amber-200" />
      </div>

      {/* Secondary KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Fleet Available" value={`${metrics.availableAgents}/${metrics.totalAgents}`} sub="Agents ready to dispatch" icon={Users} color="text-purple-700" bg="bg-purple-50" border="border-purple-200" />
        <KPICard label="Delivered Today" value={metrics.deliveredOrders} sub="Successfully completed" icon={CheckCircle2} color="text-emerald-700" bg="bg-emerald-50" border="border-emerald-200" />
        <KPICard label="Failed Attempts" value={metrics.failedOrders} sub="Require admin attention" icon={AlertTriangle} color="text-rose-600" bg="bg-rose-50" border="border-rose-200" />
        <KPICard label="Out for Delivery" value={metrics.outForDeliveryOrders} sub="Final delivery leg" icon={Zap} color="text-orange-600" bg="bg-orange-50" border="border-orange-200" />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Status Bar Chart */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Order Status Distribution</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.ordersByStatus || []} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tick={{ fill: '#64748b' }} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: 12, fontSize: 12 }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {(charts?.ordersByStatus || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-2">
            {(charts?.ordersByStatus || []).map((item) => (
              <span key={item.status} className="flex items-center gap-1 text-[10px] font-semibold text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[item.status] || '#94a3b8' }} />
                {item.name} ({item.count})
              </span>
            ))}
          </div>
        </div>

        {/* Zone Pie + Fleet Ring */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Orders by Pickup Zone</h3>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts?.ordersByZone || []}
                    dataKey="count"
                    nameKey="zone"
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    labelLine={false}
                    label={CustomDonutLabel}
                  >
                    {(charts?.ordersByZone || []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: 12, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <FleetUtilizationRing available={metrics.availableAgents} total={metrics.totalAgents} />
        </div>
      </div>

      {/* Bottom Row: B2B/B2C, Payment breakdown, Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Order Type Breakdown */}
        <div className="lg:col-span-3 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">B2B vs B2C</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={charts?.orderTypeBreakdown || []} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={55} label>
                  {(charts?.orderTypeBreakdown || []).map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#0284c7' : '#a855f7'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: 12, fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {(charts?.orderTypeBreakdown || []).map((item, i) => (
              <div key={item.name} className={`p-3 rounded-xl text-center ${i === 0 ? 'bg-sky-50 border border-sky-200' : 'bg-purple-50 border border-purple-200'}`}>
                <p className={`text-2xl font-extrabold ${i === 0 ? 'text-sky-700' : 'text-purple-700'}`}>{item.count}</p>
                <p className="text-[10px] font-bold text-slate-500">{item.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <div className="lg:col-span-3 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Payment Split</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={charts?.paymentTypeBreakdown || []} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={55} label>
                  {(charts?.paymentTypeBreakdown || []).map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#10b981' : '#f59e0b'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: 12, fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {(charts?.paymentTypeBreakdown || []).map((item, i) => (
              <div key={item.name} className={`p-3 rounded-xl text-center ${i === 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                <p className={`text-2xl font-extrabold ${i === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>{item.count}</p>
                <p className="text-[10px] font-bold text-slate-500">{item.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="lg:col-span-6">
          <LiveActivityFeed orders={recentOrders} />
        </div>
      </div>
    </div>
  );
}
