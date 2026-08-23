import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import {
  Truck, MapPin, CheckCircle2, AlertTriangle, ShieldCheck,
  Search, RefreshCw, Users, Filter, Bike, Car, Package,
  Clock, BarChart2, Eye, X, Phone, Mail, Activity, Star,
  Sliders, ArrowUpRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  AVAILABLE: { label: 'Available', color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  BUSY: { label: 'On Delivery', color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-200', dot: 'bg-amber-500' },
  OFFLINE: { label: 'Offline', color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200', dot: 'bg-slate-400' },
};

const VEHICLE_ICONS = {
  BIKE: Bike,
  CAR: Car,
  VAN: Truck,
  TRUCK: Truck,
  DEFAULT: Truck,
};

function AgentStatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.OFFLINE;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${status === 'AVAILABLE' ? 'animate-pulse' : ''}`} />
      {cfg.label}
    </span>
  );
}

// Workload Progress Bar Component
function WorkloadBar({ activeCount, maxCapacity = 5 }) {
  const pct = Math.min(100, Math.round((activeCount / maxCapacity) * 100));
  const barColor = pct >= 100 ? 'bg-rose-500' : pct >= 60 ? 'bg-amber-500' : 'bg-emerald-500';
  const textColor = pct >= 100 ? 'text-rose-700' : pct >= 60 ? 'text-amber-700' : 'text-emerald-700';

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-[10px]">
        <span className={`font-bold ${textColor}`}>{activeCount} / {maxCapacity} ({pct}%)</span>
        {pct >= 100 && <span className="text-[9px] font-extrabold uppercase text-rose-600 bg-rose-50 px-1.5 rounded border border-rose-200">MAX LOAD</span>}
      </div>
      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// Agent Detail Drawer
function AgentDetailDrawer({ agent, onClose, onStatusChange }) {
  const [newStatus, setNewStatus] = useState(agent.status);
  const [maxCapacity, setMaxCapacity] = useState(agent.maxCapacity || 5);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingCap, setSavingCap] = useState(false);

  const completedOrders = agent._count?.assignedOrders || 0;
  const activeOrders = agent.assignedOrders?.filter(
    (o) => !['DELIVERED', 'FAILED'].includes(o.status)
  ).length || 0;

  const handleStatusChange = async () => {
    if (newStatus === agent.status) return;
    setSavingStatus(true);
    try {
      await api.patch(`/agents/${agent.id}/availability`, { status: newStatus });
      toast.success(`Agent status updated to ${newStatus}`);
      onStatusChange();
      onClose();
    } catch {
      toast.error('Failed to update agent status');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleCapacityChange = async (e) => {
    e.preventDefault();
    setSavingCap(true);
    try {
      await api.patch(`/admin/agents/${agent.id}/capacity`, { maxCapacity });
      toast.success(`Max delivery capacity updated to ${maxCapacity}`);
      onStatusChange();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update capacity');
    } finally {
      setSavingCap(false);
    }
  };

  const VehicleIcon = VEHICLE_ICONS[agent.vehicleType] || VEHICLE_ICONS.DEFAULT;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-purple-600 to-sky-600 text-white shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold">Agent Profile & Workload</h3>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <VehicleIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-extrabold text-lg">{agent.user?.name}</p>
              <p className="text-white/70 text-xs">{agent.vehicleType} • ID: {agent.id.slice(-8).toUpperCase()}</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto text-xs">
          {/* Contact Info */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            {agent.user?.email && (
              <div className="flex items-center gap-2 text-slate-700">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{agent.user.email}</span>
              </div>
            )}
            {agent.user?.phone && (
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <a href={`tel:${agent.user.phone}`} className="text-sky-600 font-bold hover:underline">{agent.user.phone}</a>
              </div>
            )}
          </div>

          {/* Workload Progress Card */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <p className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Current Workload Model</p>
            <WorkloadBar activeCount={activeOrders} maxCapacity={agent.maxCapacity || 5} />
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-center">
              <p className="text-lg font-extrabold text-sky-700">{completedOrders}</p>
              <p className="text-[10px] font-semibold text-slate-500">Completed</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
              <p className="text-lg font-extrabold text-amber-700">{activeOrders}</p>
              <p className="text-[10px] font-semibold text-slate-500">Active Load</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <p className="text-lg font-extrabold text-emerald-700">96%</p>
              <p className="text-[10px] font-semibold text-slate-500">Success Rate</p>
            </div>
          </div>

          {/* Max Capacity Configuration */}
          <form onSubmit={handleCapacityChange} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <label className="block font-bold text-slate-700">Configurable Max Delivery Capacity</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max="20"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none"
              />
              <button
                type="submit"
                disabled={savingCap}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shrink-0"
              >
                {savingCap ? 'Saving...' : 'Set Capacity'}
              </button>
            </div>
          </form>

          {/* Status Override */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <p className="font-bold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" /> Admin Status Override
            </p>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:outline-none"
            >
              <option value="AVAILABLE">🟢 AVAILABLE (Ready for assignment)</option>
              <option value="BUSY">🟠 BUSY (Handling deliveries)</option>
              <option value="OFFLINE">⚫ OFFLINE (Unavailable)</option>
            </select>
            <button
              onClick={handleStatusChange}
              disabled={savingStatus || newStatus === agent.status}
              className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs"
            >
              {savingStatus ? 'Updating...' : 'Apply Status Change'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAgent, setSelectedAgent] = useState(null);

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await api.get('/agents');
      if (res.data.success) setAgents(res.data.agents);
    } catch {
      toast.error('Failed to load fleet agents');
    } finally {
      setLoading(false);
    }
  };

  const filteredAgents = useMemo(() => {
    let list = agents;
    if (statusFilter !== 'all') list = list.filter((a) => a.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) => a.user?.name?.toLowerCase().includes(q) || a.user?.email?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [agents, statusFilter, search]);

  const availableCount = agents.filter((a) => a.status === 'AVAILABLE').length;
  const busyCount = agents.filter((a) => a.status === 'BUSY').length;
  const totalCapacity = agents.reduce((acc, a) => acc + (a.maxCapacity || 5), 0);
  const activeDeliveriesTotal = agents.reduce((acc, a) => acc + (a._count?.assignedOrders || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-purple-600" /> Fleet Workload & Capacity Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time agent delivery workload, maximum capacities, and status management</p>
        </div>
        <button onClick={fetchAgents} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Fleet KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Fleet Agents', value: agents.length, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200', icon: Users },
          { label: 'Available Agents', value: availableCount, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
          { label: 'Active Deliveries', value: activeDeliveriesTotal, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: Truck },
          { label: 'Network Capacity', value: `${activeDeliveriesTotal} / ${totalCapacity}`, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', icon: Activity },
        ].map(({ label, value, color, bg, border, icon: Icon }) => (
          <div key={label} className={`p-4 rounded-2xl ${bg} border ${border}`}>
            <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
              <Icon className={`w-3.5 h-3.5 ${color}`} /> {label}
            </span>
            <span className={`text-2xl font-extrabold block ${color}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>

        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 text-xs">
          {['all', 'AVAILABLE', 'BUSY', 'OFFLINE'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all ${
                statusFilter === s ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-400 text-xs animate-pulse">Loading fleet workload data...</div>
        ) : filteredAgents.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No agents match criteria</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-4">Agent</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 w-48">Workload (Active / Cap)</th>
                  <th className="p-4">Vehicle</th>
                  <th className="p-4">Success Rate</th>
                  <th className="p-4">Total Completed</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAgents.map((agent) => {
                  const VehicleIcon = VEHICLE_ICONS[agent.vehicleType] || VEHICLE_ICONS.DEFAULT;
                  const activeCount = agent._count?.assignedOrders || 0;

                  return (
                    <tr key={agent.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 font-extrabold flex items-center justify-center">
                            {agent.user?.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{agent.user?.name}</p>
                            <p className="text-[10px] text-slate-400">{agent.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <AgentStatusBadge status={agent.status} />
                      </td>
                      <td className="p-4">
                        <WorkloadBar activeCount={activeCount} maxCapacity={agent.maxCapacity || 5} />
                      </td>
                      <td className="p-4 font-bold text-purple-700">
                        {agent.vehicleType}
                      </td>
                      <td className="p-4">
                        <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                          96%
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-800">
                        {agent._count?.assignedOrders || 0} orders
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedAgent(agent)}
                          className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[11px] border border-purple-200 ml-auto"
                        >
                          View Workload
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer */}
      {selectedAgent && (
        <AgentDetailDrawer
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
          onStatusChange={fetchAgents}
        />
      )}
    </div>
  );
}
