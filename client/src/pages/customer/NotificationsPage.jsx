import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import {
  Bell, CheckCircle2, AlertTriangle, Truck, Package,
  Clock, Check, Navigation, MapPin, Star, RefreshCw, X
} from 'lucide-react';
import toast from 'react-hot-toast';

const TYPE_CONFIG = {
  SUCCESS:  { icon: CheckCircle2, bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' },
  ALERT:    { icon: AlertTriangle, bg: 'bg-rose-100', text: 'text-rose-600', border: 'border-rose-200' },
  WARNING:  { icon: AlertTriangle, bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' },
  INFO:     { icon: Truck, bg: 'bg-sky-100', text: 'text-sky-600', border: 'border-sky-200' },
  UPDATE:   { icon: Package, bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
};

const formatRelative = (ts) => {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  if (hrs < 24) return `${hrs} hr ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

// Smart icon from title text
const getIconFromTitle = (title = '') => {
  const t = title.toLowerCase();
  if (t.includes('out for delivery') || t.includes('deliver')) return { icon: Navigation, bg: 'bg-sky-100', text: 'text-sky-600' };
  if (t.includes('km away') || t.includes('agent')) return { icon: Truck, bg: 'bg-blue-100', text: 'text-blue-600' };
  if (t.includes('picked up') || t.includes('pickup')) return { icon: Package, bg: 'bg-indigo-100', text: 'text-indigo-600' };
  if (t.includes('delivered') || t.includes('payment')) return { icon: CheckCircle2, bg: 'bg-emerald-100', text: 'text-emerald-600' };
  if (t.includes('fail') || t.includes('cancel')) return { icon: AlertTriangle, bg: 'bg-rose-100', text: 'text-rose-600' };
  return { icon: Bell, bg: 'bg-slate-100', text: 'text-slate-600' };
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setUnreadCount(0);
      setNotifications(n => n.map(x => ({ ...x, isRead: true })));
      toast.success('All notifications marked as read');
    } catch { toast.error('Failed to update notifications'); }
  };

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(n => n.map(x => x.id === id ? { ...x, isRead: true } : x));
      if (unreadCount > 0) setUnreadCount(c => c - 1);
    } catch {}
  };

  const filtered = filter === 'ALL' ? notifications
    : filter === 'UNREAD' ? notifications.filter(n => !n.isRead)
    : notifications.filter(n => n.type === filter);

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-sky-600" /> Notifications
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-sky-600 text-white text-[11px] font-extrabold">{unreadCount}</span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Stay updated on your shipment status and delivery alerts</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
          >
            <Check className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {['ALL', 'UNREAD', 'INFO', 'SUCCESS', 'ALERT'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-colors border
              ${filter === f
                ? 'bg-sky-600 text-white border-sky-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300 hover:text-sky-600'
              }`}
          >
            {f === 'ALL' ? 'All' : f === 'UNREAD' ? `Unread (${unreadCount})` : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}

        <button onClick={fetchNotifications} className="ml-auto p-2 rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin text-sky-500 mx-auto mb-2" /> Loading notifications...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Bell className="w-10 h-10 text-slate-200 mx-auto" />
            <p className="font-bold text-slate-500 text-sm">No notifications</p>
            <p className="text-xs text-slate-400">You're all caught up! 🎉</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((n) => {
              const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.INFO;
              const smartIcon = getIconFromTitle(n.title);
              const IconComp = smartIcon.icon;

              return (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && markRead(n.id)}
                  className={`p-4 flex items-start gap-3.5 cursor-pointer transition-colors hover:bg-slate-50/60
                    ${!n.isRead ? 'bg-sky-50/30' : 'bg-white'}`}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${smartIcon.bg}`}>
                    <IconComp className={`w-5 h-5 ${smartIcon.text}`} />
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-tight ${!n.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap shrink-0">
                        {formatRelative(n.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">{n.message}</p>

                    {n.orderId && (
                      <Link
                        to={`/customer/orders/${n.orderId}`}
                        onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[11px] text-sky-600 font-bold hover:underline mt-1"
                      >
                        View Order Details →
                      </Link>
                    )}
                  </div>

                  {/* Unread dot */}
                  {!n.isRead && (
                    <div className="w-2 h-2 rounded-full bg-sky-500 shrink-0 mt-2" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

