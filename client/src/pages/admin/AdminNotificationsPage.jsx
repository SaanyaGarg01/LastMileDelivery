import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
  Bell, CheckCircle2, AlertTriangle, Info, Zap, RefreshCw,
  Search, Package, User, Mail, Clock, Filter, Download
} from 'lucide-react';
import toast from 'react-hot-toast';

const TYPE_CONFIG = {
  INFO: { label: 'Info', color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200', icon: Info },
  SUCCESS: { label: 'Success', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
  ALERT: { label: 'Alert', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', icon: AlertTriangle },
  WARNING: { label: 'Warning', color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-200', icon: AlertTriangle },
};

function NotificationRow({ notif }) {
  const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.INFO;
  const Icon = cfg.icon;
  return (
    <tr className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0">
      <td className="p-3">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
          <Icon className="w-3 h-3" /> {cfg.label}
        </span>
      </td>
      <td className="p-3">
        <p className="font-bold text-slate-900 text-xs">{notif.title}</p>
        <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs truncate">{notif.message}</p>
      </td>
      <td className="p-3">
        {notif.user ? (
          <div>
            <p className="font-bold text-slate-800 text-xs">{notif.user.name}</p>
            <p className="text-[10px] text-slate-400">{notif.user.email}</p>
            <span className={`text-[10px] font-bold uppercase ${
              notif.user.role === 'ADMIN' ? 'text-sky-600' : notif.user.role === 'AGENT' ? 'text-purple-600' : 'text-emerald-600'
            }`}>{notif.user.role}</span>
          </div>
        ) : <span className="text-[10px] text-slate-400">—</span>}
      </td>
      <td className="p-3">
        {notif.order ? (
          <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
            {notif.order.orderNumber}
          </span>
        ) : <span className="text-[10px] text-slate-400">—</span>}
      </td>
      <td className="p-3">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${notif.isRead ? 'bg-slate-100 text-slate-400' : 'bg-sky-100 text-sky-700'}`}>
          {notif.isRead ? 'Read' : 'Unread'}
        </span>
      </td>
      <td className="p-3 text-[10px] text-slate-400">
        {new Date(notif.createdAt).toLocaleString()}
      </td>
    </tr>
  );
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/admin/notification-log', { params: { limit: 200 } });
      if (res.data.success) setNotifications(res.data.notifications);
    } catch {
      toast.error('Failed to load notification log');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const rows = [['Type', 'Title', 'Message', 'Recipient', 'Order', 'Read', 'Date']];
    notifications.forEach((n) => rows.push([
      n.type, n.title, n.message, n.user?.name || '', n.order?.orderNumber || '', n.isRead ? 'Yes' : 'No',
      new Date(n.createdAt).toLocaleString()
    ]));
    const csv = rows.map((r) => r.map((c) => `"${String(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'notifications-log.csv'; a.click();
    toast.success(`Exported ${notifications.length} notifications`);
  };

  const filtered = notifications.filter((n) => {
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return n.title?.toLowerCase().includes(q) || n.message?.toLowerCase().includes(q) ||
        n.user?.name?.toLowerCase().includes(q) || n.order?.orderNumber?.toLowerCase().includes(q);
    }
    return true;
  });

  const countByType = notifications.reduce((acc, n) => { acc[n.type] = (acc[n.type] || 0) + 1; return acc; }, {});
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500" /> Notification Log
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            All system notifications sent to customers, agents, and admins
            {unreadCount > 0 && <span className="ml-2 px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-bold text-[10px]">{unreadCount} unread</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} disabled={notifications.length === 0}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs text-xs font-bold flex items-center gap-1.5 disabled:opacity-50">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button onClick={fetchNotifications} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Type Summary */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setTypeFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${typeFilter === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
        >
          All ({notifications.length})
        </button>
        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
          const Icon = cfg.icon;
          const count = countByType[type] || 0;
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
                typeFilter === type ? `${cfg.bg} ${cfg.color} ${cfg.border}` : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {cfg.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notifications..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-300"
        />
      </div>

      {/* Notification Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs text-slate-400 animate-pulse">Loading notification log...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400">No notifications found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3">Title / Message</th>
                  <th className="p-3">Recipient</th>
                  <th className="p-3">Order</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Sent At</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((notif) => <NotificationRow key={notif.id} notif={notif} />)}
              </tbody>
            </table>
            <div className="p-3 border-t border-slate-100 text-xs text-slate-400 text-center">
              Showing {filtered.length} of {notifications.length} notifications
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
