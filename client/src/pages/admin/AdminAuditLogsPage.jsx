import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
  ShieldCheck, RefreshCw, Search, Filter, Download, User,
  FileText, Clock, ArrowRight, Tag, Activity, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const ACTION_COLORS = {
  UPDATE_RATE_CARD: 'bg-amber-50 text-amber-800 border-amber-200',
  ASSIGN_ORDER: 'bg-sky-50 text-sky-800 border-sky-200',
  OVERRIDE_STATUS: 'bg-purple-50 text-purple-800 border-purple-200',
  STATUS_CHANGE: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  CREATE_ZONE: 'bg-teal-50 text-teal-800 border-teal-200',
  UPDATE_ZONE: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  SET_CAPACITY: 'bg-pink-50 text-pink-800 border-pink-200',
  SIMULATE_STEP: 'bg-rose-50 text-rose-800 border-rose-200',
};

function AuditLogRow({ log }) {
  const badgeStyle = ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-700 border-slate-200';
  let prevText = null;
  let newText = null;

  try {
    if (log.previousValue) {
      const parsed = typeof log.previousValue === 'string' ? JSON.parse(log.previousValue) : log.previousValue;
      prevText = typeof parsed === 'object' ? JSON.stringify(parsed) : String(parsed);
    }
    if (log.newValue) {
      const parsed = typeof log.newValue === 'string' ? JSON.parse(log.newValue) : log.newValue;
      newText = typeof parsed === 'object' ? JSON.stringify(parsed) : String(parsed);
    }
  } catch {
    prevText = log.previousValue;
    newText = log.newValue;
  }

  return (
    <tr className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0">
      <td className="p-3 whitespace-nowrap text-[11px] text-slate-400 font-mono">
        {new Date(log.timestamp).toLocaleString()}
      </td>
      <td className="p-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-extrabold text-[10px] flex items-center justify-center">
            {log.actorName?.charAt(0) || 'A'}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-xs">{log.actorName || log.actorId}</p>
            <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
              log.actorRole === 'ADMIN' ? 'bg-sky-100 text-sky-700' : log.actorRole === 'AGENT' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
            }`}>{log.actorRole}</span>
          </div>
        </div>
      </td>
      <td className="p-3">
        <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase border ${badgeStyle}`}>
          {log.action?.replace(/_/g, ' ')}
        </span>
      </td>
      <td className="p-3 text-xs">
        <span className="font-bold text-slate-700">{log.entityType}</span>
        {log.entityId && <span className="text-[10px] font-mono text-slate-400 block">ID: {log.entityId.slice(-8)}</span>}
      </td>
      <td className="p-3 text-xs">
        <p className="font-semibold text-slate-800">{log.details}</p>
        {(prevText || newText) && (
          <div className="text-[10px] font-mono text-slate-500 mt-1 flex items-center gap-1 bg-slate-50 p-1.5 rounded border border-slate-200">
            <span className="text-slate-400 truncate max-w-[150px]">{prevText || 'Initial'}</span>
            <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="text-emerald-700 font-bold truncate max-w-[150px]">{newText}</span>
          </div>
        )}
      </td>
    </tr>
  );
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => { fetchLogs(); }, [roleFilter, actionFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter) params.actorRole = roleFilter;
      if (actionFilter) params.action = actionFilter;
      if (search) params.search = search;

      const res = await api.get('/admin/audit-logs', { params });
      if (res.data.success) setLogs(res.data.logs);
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const rows = [['Timestamp', 'Actor', 'Role', 'Action', 'Entity', 'Entity ID', 'Details']];
    logs.forEach((l) => rows.push([
      new Date(l.timestamp).toLocaleString(), l.actorName || l.actorId, l.actorRole,
      l.action, l.entityType, l.entityId, l.details
    ]));
    const csv = rows.map((r) => r.map((c) => `"${String(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'audit-logs.csv'; a.click();
    toast.success(`Exported ${logs.length} audit logs`);
  };

  const actionsList = [...new Set(logs.map((l) => l.action).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-600" /> Admin Audit Logs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            System-wide audit trail recording who changed what (rate cards, assignments, overrides, capacity)
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} disabled={logs.length === 0}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button onClick={fetchLogs} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit logs by actor, entity, or action..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-300"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
        >
          <option value="">All Roles</option>
          <option value="ADMIN">ADMIN</option>
          <option value="AGENT">AGENT</option>
          <option value="CUSTOMER">CUSTOMER</option>
          <option value="SYSTEM">SYSTEM</option>
        </select>

        {actionsList.length > 0 && (
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="">All Actions</option>
            {actionsList.map((a) => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
          </select>
        )}

        <span className="text-xs text-slate-400 self-center font-medium">{logs.length} logs</span>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs text-slate-400 animate-pulse">Loading audit trail...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheck className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400">No audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Actor</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Entity</th>
                  <th className="p-3">Audit Details & Value Diff</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => <AuditLogRow key={log.id} log={log} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
