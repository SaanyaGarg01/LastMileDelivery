import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';
import TrackingTimeline from '../../components/TrackingTimeline';
import {
  Play, RefreshCw, Package, Truck, Navigation, CheckCircle2,
  AlertTriangle, RotateCcw, ShieldCheck, Zap, User, MapPin,
  Clock, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const SIMULATION_STEPS = [
  { next: 'PICKED_UP', label: 'Simulate Pickup', color: 'bg-purple-600 hover:bg-purple-500', icon: Package },
  { next: 'IN_TRANSIT', label: 'Simulate In Transit', color: 'bg-sky-600 hover:bg-sky-500', icon: Truck },
  { next: 'OUT_FOR_DELIVERY', label: 'Simulate Out for Delivery', color: 'bg-amber-500 hover:bg-amber-400', icon: Navigation },
  { next: 'DELIVERED', label: 'Simulate Delivered', color: 'bg-emerald-600 hover:bg-emerald-500', icon: CheckCircle2 },
];

export default function AdminSimulationPage() {
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  // Failure simulation modal
  const [showFailModal, setShowFailModal] = useState(false);
  const [failReason, setFailReason] = useState('Customer unreachable / door locked');
  const [failRemarks, setFailRemarks] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (selectedOrderId) {
      fetchOrderDetails(selectedOrderId);
    }
  }, [selectedOrderId]);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      if (res.data.success) {
        setOrders(res.data.orders);
        if (res.data.orders.length > 0 && !selectedOrderId) {
          setSelectedOrderId(res.data.orders[0].id);
        }
      }
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (id) => {
    try {
      const res = await api.get(`/orders/${id}`);
      if (res.data.success) setSelectedOrderDetails(res.data.order);
    } catch {
      toast.error('Failed to load order details');
    }
  };

  const handleSimulateStep = async (nextStatus, failureReason = '', remarks = '') => {
    if (!selectedOrderId) return;
    setSimulating(true);
    try {
      const res = await api.post('/admin/simulation/step', {
        orderId: selectedOrderId,
        nextStatus,
        failureReason,
        remarks,
      });

      if (res.data.success) {
        toast.success(`⚙️ STATUS UPDATED: Shipment status changed to ${nextStatus}!`);
        setShowFailModal(false);
        fetchOrderDetails(selectedOrderId);
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  const order = selectedOrderDetails;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-900 to-slate-900 text-white shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider">
              OPERATIONS TESTING MODE
            </span>
          </div>
          <h1 className="text-xl font-extrabold mt-1 flex items-center gap-2">
            <Play className="w-5 h-5 text-amber-400" /> Delivery Lifecycle Testing Tool
          </h1>
          <p className="text-xs text-white/70 mt-0.5">
            Controlled operations testing tool. Triggers real workflow status changes, tracking logs, agent release, and notifications.
          </p>
        </div>

        <button onClick={fetchOrders} className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Select Order Selector */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
        <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
          Select Shipment Order to Simulate
        </label>
        <select
          value={selectedOrderId}
          onChange={(e) => setSelectedOrderId(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-300"
        >
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              {o.orderNumber} — {o.customer?.name} ({o.status}) — ₹{o.totalAmount}
            </option>
          ))}
        </select>
      </div>

      {order && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls & Details Left Column */}
          <div className="lg:col-span-7 space-y-4">
            {/* Simulation Control Panel */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">SELECTED SHIPMENT</span>
                  <h3 className="text-base font-extrabold text-slate-900 font-mono">{order.orderNumber}</h3>
                </div>
                <StatusBadge status={order.status} />
              </div>

              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs space-y-1">
                <p className="font-bold text-purple-900">⚡ Live Simulation Controls</p>
                <p className="text-purple-700">
                  Click a step to trigger real status matrix transitions. All status updates emit notifications and audit events.
                </p>
              </div>

              {/* Simulation Step Buttons */}
              <div className="space-y-2">
                {SIMULATION_STEPS.map((step) => (
                  <button
                    key={step.next}
                    onClick={() => handleSimulateStep(step.next)}
                    disabled={simulating || order.status === 'DELIVERED'}
                    className={`w-full py-3 px-4 rounded-xl text-white font-extrabold text-xs flex items-center justify-between transition-all disabled:opacity-50 ${step.color}`}
                  >
                    <span className="flex items-center gap-2">
                      <step.icon className="w-4 h-4" /> {step.label}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ))}

                {/* Simulate Failure */}
                <button
                  onClick={() => setShowFailModal(true)}
                  disabled={simulating || order.status === 'DELIVERED'}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-extrabold text-xs flex items-center justify-between disabled:opacity-50 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" /> Simulate Delivery Failure
                  </span>
                  <ArrowRight className="w-4 h-4 text-rose-600" />
                </button>
              </div>

              {order.status === 'FAILED' && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-2">
                  <p className="font-bold text-rose-800">Order is currently FAILED</p>
                  <p className="text-rose-600">Simulate customer rescheduling from the customer order details page.</p>
                </div>
              )}
            </div>

            {/* Shipment Summary */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2 text-xs">
              <h4 className="font-extrabold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">Shipment Summary</h4>
              <p><strong>Customer:</strong> {order.customer?.name}</p>
              <p><strong>Pickup:</strong> {order.pickupAddress} ({order.pickupPincode})</p>
              <p><strong>Drop:</strong> {order.dropAddress} ({order.dropPincode})</p>
              <p><strong>Assigned Agent:</strong> {order.assignedAgent?.user?.name || 'Unassigned'}</p>
              <p><strong>Payment:</strong> {order.paymentType} (₹{order.totalAmount})</p>
            </div>
          </div>

          {/* Tracking Timeline Right Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-600" /> Simulated Tracking Log
              </h3>
              <TrackingTimeline tracking={order.tracking || []} currentStatus={order.status} />
            </div>
          </div>
        </div>
      )}

      {/* Failure Simulation Modal */}
      {showFailModal && order && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Simulate Delivery Failure
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Failure Reason</label>
                <select
                  value={failReason}
                  onChange={(e) => setFailReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                >
                  <option value="Customer unavailable / door locked">Customer unavailable / door locked</option>
                  <option value="Wrong or incomplete address">Wrong or incomplete address</option>
                  <option value="Customer refused package">Customer refused package</option>
                  <option value="Customer refused COD payment">Customer refused COD payment</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Remarks</label>
                <textarea
                  value={failRemarks}
                  onChange={(e) => setFailRemarks(e.target.value)}
                  placeholder="Simulation remarks..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowFailModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold">
                  Cancel
                </button>
                <button
                  onClick={() => handleSimulateStep('FAILED', failReason, failRemarks)}
                  disabled={simulating}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
                >
                  {simulating ? 'Simulating...' : 'Simulate Failure'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
