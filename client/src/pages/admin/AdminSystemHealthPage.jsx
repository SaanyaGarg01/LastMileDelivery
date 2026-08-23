import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Activity, Database, Server, Mail, Bell, Map, RefreshCw, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSystemHealthPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/system-health');
      if (res.data.success) {
        setHealth(res.data);
      }
    } catch {
      toast.error('Failed to load system health metrics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" /> System Health & Operational Infrastructure
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time status indicators for database latency, email services, notification queues, and API responsiveness.
          </p>
        </div>
        <button
          onClick={fetchHealth}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Status
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs animate-pulse">Checking system health metrics...</div>
      ) : health ? (
        <div className="space-y-6">
          {/* Main Status Badge */}
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <div>
                <h3 className="font-extrabold text-sm text-emerald-900">SYSTEM HEALTH: {health.status}</h3>
                <p className="text-xs text-emerald-700">All core logistics microservices and database engines are responding normally.</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-800">
              Checked: {new Date(health.timestamp).toLocaleTimeString()}
            </span>
          </div>

          {/* Service Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-sky-600" /> Express REST API
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                  {health.services?.backendApi?.status}
                </span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{health.services?.backendApi?.latencyMs} ms</div>
              <span className="text-[10px] text-slate-400 block">Response latency</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-purple-600" /> Prisma ORM Database
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                  {health.services?.database?.status}
                </span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{health.services?.database?.latencyMs} ms</div>
              <span className="text-[10px] text-slate-400 block">{health.services?.database?.engine} database engine</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-amber-600" /> Email Service
                </span>
                <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-bold text-[10px]">Configured</span>
              </div>
              <div className="text-sm font-bold text-slate-900 line-clamp-1">{health.services?.emailService?.status}</div>
              <span className="text-[10px] text-slate-400 block">Mode: {health.services?.emailService?.mode}</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-blue-600" /> Notification Queue
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                  {health.services?.notificationQueue?.status}
                </span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{health.services?.notificationQueue?.totalProcessed}</div>
              <span className="text-[10px] text-slate-400 block">Total notifications processed</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Map className="w-4 h-4 text-emerald-600" /> Map Tile Service
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                  Operational
                </span>
              </div>
              <div className="text-sm font-bold text-slate-900">{health.services?.mapService?.provider}</div>
              <span className="text-[10px] text-slate-400 block">Leaflet JS map rendering engine</span>
            </div>
          </div>

          {/* Operational Metrics */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Operational Metrics Today</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Orders Created Today</span>
                <span className="font-mono font-extrabold text-slate-900 text-lg">{health.metrics?.totalOrdersToday}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Active Available Agents</span>
                <span className="font-mono font-extrabold text-emerald-600 text-lg">{health.metrics?.activeAgentsCount}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Active In-Transit Deliveries</span>
                <span className="font-mono font-extrabold text-sky-600 text-lg">{health.metrics?.activeDeliveriesCount}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Error Rate</span>
                <span className="font-mono font-extrabold text-slate-900 text-lg">{health.metrics?.errorRate}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
