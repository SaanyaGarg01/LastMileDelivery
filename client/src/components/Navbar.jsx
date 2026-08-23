import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Bell, 
  HelpCircle, 
  LogOut, 
  Menu, 
  Truck,
  ChevronRight
} from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (user.role === 'ADMIN') {
      navigate(`/admin/orders?search=${encodeURIComponent(searchQuery)}`);
    } else if (user.role === 'CUSTOMER') {
      navigate(`/customer/orders?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Resolve Page Title & Breadcrumb
  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path.startsWith('/customer/create-order')) return ['Shipments', 'Create New Shipment'];
    if (path.startsWith('/customer/orders/')) return ['Shipments', 'Shipment Details'];
    if (path.startsWith('/customer')) return ['Workspace', 'Customer Overview'];
    if (path.startsWith('/agent/deliveries')) return ['Operations', 'Delivery History'];
    if (path.startsWith('/agent')) return ['Operations', 'Agent Deliveries'];
    if (path.startsWith('/admin/orders')) return ['Operations', 'Orders Control Center'];
    if (path.startsWith('/admin/agents')) return ['Operations', 'Fleet Management'];
    if (path.startsWith('/admin/zones')) return ['Operations', 'Zone Management'];
    if (path.startsWith('/admin/rate-cards')) return ['Operations', 'Dynamic Rate Cards'];
    if (path.startsWith('/admin')) return ['Operations', 'Analytics Dashboard'];
    return ['Dashboard', 'Overview'];
  };

  const breadcrumbs = getBreadcrumb();

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between shadow-xs">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-semibold text-slate-400">{breadcrumbs[0]}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-bold text-slate-800">{breadcrumbs[1]}</span>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search shipments by Order ID, customer, phone..."
            className="w-full bg-slate-100/80 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 transition-all"
          />
        </div>
      </form>

      {/* Right: Notifications, Help, Profile, Logout */}
      <div className="flex items-center gap-2">
        {/* Help Icon */}
        <button
          title="Help & Support"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Notifications Icon & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Notifications ({notifications.length})
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] font-bold text-sky-600 hover:text-sky-700"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3.5 text-xs transition-colors ${
                        n.isRead ? 'bg-white text-slate-500' : 'bg-sky-50/50 text-slate-800'
                      }`}
                    >
                      <div className="font-bold text-slate-900 mb-0.5">{n.title}</div>
                      <p className="text-slate-600 leading-snug">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Logout */}
        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <button
              onClick={logout}
              title="Logout"
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
