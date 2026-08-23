import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';
import AutoAssignExplanationModal from '../../components/AutoAssignExplanationModal';
import AdminCreateOrderModal from '../../components/AdminCreateOrderModal';
import AdminMapAssignmentModal from '../../components/AdminMapAssignmentModal';
import { 
  Package, Search, Sparkles, Eye, RefreshCw, X, Download, Filter,
  ChevronDown, Calendar, ArrowUpDown, Tag, Check, SlidersHorizontal,
  User, Truck, MapPin, DollarSign, Clock, ShieldCheck, Plus
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_LIST = [
  'CREATED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT',
  'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RESCHEDULED'
];

const DATE_PRESETS = [
  { label: 'All Time', value: '' },
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Admin Order Creation Modal State
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);

  // Filters State
  const [statusFilter, setStatusFilter] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [datePreset, setDatePreset] = useState('');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Filter Drawer Open state
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Modals & Explanation State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('');

  // Interactive Map Assignment Modal State
  const [showMapAssignModal, setShowMapAssignModal] = useState(false);
  const [mapAssignOrder, setMapAssignOrder] = useState(null);

  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState('');
  const [overrideRemarks, setOverrideRemarks] = useState('');

  // Auto-Assign Explanation Modal
  const [explanationOrder, setExplanationOrder] = useState(null);
  const [explanationAgent, setExplanationAgent] = useState(null);

  useEffect(() => {
    fetchOrders();
    fetchAgentsAndZones();
  }, [statusFilter, zoneFilter, agentFilter, typeFilter, paymentFilter, datePreset, customDateFrom, customDateTo, sortBy]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (zoneFilter) params.zoneId = zoneFilter;
      if (agentFilter) params.agentId = agentFilter;
      if (typeFilter) params.orderType = typeFilter;
      if (paymentFilter) params.paymentType = paymentFilter;
      if (search) params.search = search;

      // Handle Date Presets
      if (datePreset === 'today') {
        const d = new Date(); d.setHours(0, 0, 0, 0);
        params.dateFrom = d.toISOString();
      } else if (datePreset === 'yesterday') {
        const d1 = new Date(Date.now() - 86400000); d1.setHours(0, 0, 0, 0);
        const d2 = new Date(Date.now() - 86400000); d2.setHours(23, 59, 59, 999);
        params.dateFrom = d1.toISOString();
        params.dateTo = d2.toISOString();
      } else if (datePreset === '7d') {
        params.dateFrom = new Date(Date.now() - 7 * 86400000).toISOString();
      } else if (datePreset === '30d') {
        params.dateFrom = new Date(Date.now() - 30 * 86400000).toISOString();
      } else if (customDateFrom || customDateTo) {
        if (customDateFrom) params.dateFrom = customDateFrom;
        if (customDateTo) params.dateTo = customDateTo;
      }

      const res = await api.get('/orders', { params });
      if (res.data.success) {
        let list = res.data.orders || [];
        // Apply sorting
        if (sortBy === 'oldest') {
          list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else if (sortBy === 'amount_desc') {
          list.sort((a, b) => b.totalAmount - a.totalAmount);
        } else if (sortBy === 'amount_asc') {
          list.sort((a, b) => a.totalAmount - b.totalAmount);
        } else if (sortBy === 'status') {
          list.sort((a, b) => a.status.localeCompare(b.status));
        }
        setOrders(list);
      }
    } catch {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentsAndZones = async () => {
    try {
      const [agentRes, zoneRes] = await Promise.all([api.get('/agents'), api.get('/admin/zones')]);
      if (agentRes.data.success) setAgents(agentRes.data.agents);
      if (zoneRes.data.success) setZones(zoneRes.data.zones);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleClearAllFilters = () => {
    setStatusFilter('');
    setZoneFilter('');
    setAgentFilter('');
    setTypeFilter('');
    setPaymentFilter('');
    setDatePreset('');
    setCustomDateFrom('');
    setCustomDateTo('');
    setSearch('');
    setSortBy('newest');
  };

  const handleExportCSV = () => {
    const rows = [['Order #', 'Customer', 'Pickup Zone', 'Drop Zone', 'Agent', 'Weight (kg)', 'Amount (₹)', 'Type', 'Payment', 'Status', 'Date']];
    orders.forEach((o) => rows.push([
      o.orderNumber, o.customer?.name,
      o.pickupZone?.code, o.dropZone?.code,
      o.assignedAgent?.user?.name || 'Unassigned',
      o.chargeableWeight, o.totalAmount,
      o.orderType, o.paymentType, o.status,
      new Date(o.createdAt).toLocaleDateString()
    ]));
    const csv = rows.map((r) => r.map((c) => `"${c || ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'orders-export.csv'; a.click();
    toast.success(`Exported ${orders.length} orders to CSV`);
  };

  // Actions
  const handleAutoAssign = async (orderId) => {
    try {
      const res = await api.post(`/orders/${orderId}/auto-assign`);
      if (res.data.success) {
        toast.success(res.data.message);
        if (res.data.assignment) {
          setExplanationOrder(res.data.order);
          setExplanationAgent(res.data.assignment);
        }
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Auto-assign failed');
    }
  };

  const handleManualAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder || !selectedAgentId) return;
    try {
      const res = await api.post(`/orders/${selectedOrder.id}/assign`, { agentId: selectedAgentId });
      if (res.data.success) {
        toast.success(`Agent assigned to ${selectedOrder.orderNumber}`);
        setShowAssignModal(false);
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assignment failed');
    }
  };

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder || !overrideStatus) return;
    try {
      const res = await api.patch(`/orders/${selectedOrder.id}/status`, {
        status: overrideStatus,
        remarks: overrideRemarks || 'Admin status override',
      });
      if (res.data.success) {
        toast.success(`Status updated to ${overrideStatus}`);
        setShowOverrideModal(false);
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Override failed');
    }
  };

  // Active filter count
  const activeFiltersCount = [
    statusFilter, zoneFilter, agentFilter, typeFilter, paymentFilter, datePreset, customDateFrom, customDateTo, search
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-sky-600" /> Orders Control Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {orders.length} orders found • Full lifecycle shipment management & multi-field filtering
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateOrderModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all"
          >
            <Plus className="w-4 h-4" /> Create Order (For Customer)
          </button>
          <button
            onClick={handleExportCSV}
            disabled={orders.length === 0}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
          </button>
          <button
            onClick={fetchOrders}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search & Main Filter Controls Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Order ID, customer name, phone, email, address..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-300"
            />
          </form>

          {/* Quick Date Presets */}
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 text-xs">
            {DATE_PRESETS.map((dp) => (
              <button
                key={dp.value}
                onClick={() => setDatePreset(dp.value)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  datePreset === dp.value ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {dp.label}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="amount_desc">Amount: High → Low</option>
            <option value="amount_asc">Amount: Low → High</option>
            <option value="status">Sort by Status</option>
          </select>

          {/* Advanced Filter Drawer Trigger */}
          <button
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all ${
              activeFiltersCount > 0 ? 'bg-sky-50 border-sky-300 text-sky-700' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters {activeFiltersCount > 0 && <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-bold text-[10px] flex items-center justify-center">{activeFiltersCount}</span>}
          </button>
        </div>

        {/* Filter Chips Bar */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Active Filters:</span>
            {search && (
              <span className="inline-flex items-center gap-1 bg-sky-50 border border-sky-200 text-sky-800 px-2.5 py-1 rounded-lg text-xs font-semibold">
                Search: "{search}" <button onClick={() => setSearch('')}><X className="w-3 h-3 hover:text-sky-900" /></button>
              </span>
            )}
            {statusFilter && (
              <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-lg text-xs font-semibold">
                Status: {statusFilter} <button onClick={() => setStatusFilter('')}><X className="w-3 h-3 hover:text-emerald-900" /></button>
              </span>
            )}
            {zoneFilter && (
              <span className="inline-flex items-center gap-1 bg-purple-50 border border-purple-200 text-purple-800 px-2.5 py-1 rounded-lg text-xs font-semibold">
                Zone: {zones.find((z) => z.id === zoneFilter)?.name || zoneFilter} <button onClick={() => setZoneFilter('')}><X className="w-3 h-3 hover:text-purple-900" /></button>
              </span>
            )}
            {agentFilter && (
              <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1 rounded-lg text-xs font-semibold">
                Agent: {agents.find((a) => a.id === agentFilter)?.user?.name || agentFilter} <button onClick={() => setAgentFilter('')}><X className="w-3 h-3 hover:text-amber-900" /></button>
              </span>
            )}
            {typeFilter && (
              <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-800 px-2.5 py-1 rounded-lg text-xs font-semibold">
                Type: {typeFilter} <button onClick={() => setTypeFilter('')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {paymentFilter && (
              <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-800 px-2.5 py-1 rounded-lg text-xs font-semibold">
                Payment: {paymentFilter} <button onClick={() => setPaymentFilter('')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {datePreset && (
              <span className="inline-flex items-center gap-1 bg-cyan-50 border border-cyan-200 text-cyan-800 px-2.5 py-1 rounded-lg text-xs font-semibold">
                Date: {DATE_PRESETS.find((d) => d.value === datePreset)?.label} <button onClick={() => setDatePreset('')}><X className="w-3 h-3 hover:text-cyan-900" /></button>
              </span>
            )}
            <button onClick={handleClearAllFilters} className="text-rose-600 hover:text-rose-800 text-xs font-bold ml-auto hover:underline">
              Clear All
            </button>
          </div>
        )}

        {/* Filter Drawer Content (Togglable) */}
        {showFilterDrawer && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none"
              >
                <option value="">All Statuses</option>
                {STATUS_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Zone Route</label>
              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none"
              >
                <option value="">All Zones</option>
                {zones.map((z) => <option key={z.id} value={z.id}>{z.name} ({z.code})</option>)}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Assigned Agent</label>
              <select
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none"
              >
                <option value="">All Agents</option>
                {agents.map((a) => <option key={a.id} value={a.id}>{a.user?.name} ({a.status})</option>)}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Order Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none"
              >
                <option value="">All Types</option>
                <option value="B2C">B2C Retail</option>
                <option value="B2B">B2B Corporate</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs animate-pulse">Filtering orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700 text-sm">No orders match filter criteria</p>
            <button onClick={handleClearAllFilters} className="text-sky-600 text-xs font-bold hover:underline">Clear all filters</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-4">Order #</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Route (Pickup → Drop)</th>
                  <th className="p-4">Billable Wt</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Agent</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-extrabold text-slate-900">
                      <Link to={`/customer/orders/${order.id}`} className="hover:text-sky-600 hover:underline">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="p-4 font-bold text-slate-800">
                      {order.customer?.name}
                      <span className="block text-[10px] font-normal text-slate-400">{order.customer?.phone || order.customer?.email}</span>
                    </td>
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <p className="text-slate-800 truncate max-w-[160px]">From: <strong>{order.pickupAddress}</strong></p>
                        <p className="text-slate-600 truncate max-w-[160px]">To: <strong>{order.dropAddress}</strong></p>
                        <span className="text-[9px] font-extrabold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                          {order.pickupZone?.code} → {order.dropZone?.code} ({order.zoneType})
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-extrabold text-slate-700">
                      {order.chargeableWeight} kg
                    </td>
                    <td className="p-4 font-extrabold text-slate-900">
                      ₹{order.totalAmount}
                      <span className={`block text-[10px] ${order.paymentType === 'COD' ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {order.paymentType}
                      </span>
                    </td>
                    <td className="p-4">
                      {order.assignedAgent ? (
                        <div className="flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                          <span className="font-bold text-slate-800">{order.assignedAgent.user?.name}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAutoAssign(order.id)}
                          className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-[10px] border border-sky-200 flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3 text-sky-600" /> Auto-Assign
                        </button>
                      )}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end items-center gap-1.5">
                        <button
                          onClick={() => {
                            setMapAssignOrder(order);
                            setShowMapAssignModal(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-extrabold text-[10px] border border-sky-200 flex items-center gap-1 shadow-2xs"
                        >
                          🗺️ Map Assign
                        </button>
                        <Link
                          to={`/customer/orders/${order.id}`}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => { setSelectedOrder(order); setShowOverrideModal(true); }}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px]"
                        >
                          Override
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Auto-Assign Explanation Modal */}
      {explanationOrder && explanationAgent && (
        <AutoAssignExplanationModal
          order={explanationOrder}
          assignment={explanationAgent}
          onClose={() => { setExplanationOrder(null); setExplanationAgent(null); }}
        />
      )}

      {/* Override Modal */}
      {showOverrideModal && selectedOrder && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-base font-extrabold text-slate-900">Admin Status Override</h3>
            <p className="text-xs text-slate-500">Order #{selectedOrder.orderNumber} — Current: <strong>{selectedOrder.status}</strong></p>
            <form onSubmit={handleOverrideSubmit} className="space-y-3 text-xs">
              <select
                value={overrideStatus}
                onChange={(e) => setOverrideStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold"
                required
              >
                <option value="">Select Target Status</option>
                {STATUS_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <textarea
                value={overrideRemarks}
                onChange={(e) => setOverrideRemarks(e.target.value)}
                placeholder="Reason for admin status override..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 resize-none"
              />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowOverrideModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold">
                  Apply Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Order Creation Modal */}
      <AdminCreateOrderModal
        isOpen={showCreateOrderModal}
        onClose={() => setShowCreateOrderModal(false)}
        onOrderCreated={() => fetchOrders()}
      />

      {/* Admin Map Assignment Modal */}
      <AdminMapAssignmentModal
        isOpen={showMapAssignModal}
        order={mapAssignOrder}
        onClose={() => setShowMapAssignModal(false)}
        onAssigned={() => fetchOrders()}
      />
    </div>
  );
}
