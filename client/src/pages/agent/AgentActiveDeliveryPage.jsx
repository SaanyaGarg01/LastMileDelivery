import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import MapCard from '../../components/MapCard';
import TrackingTimeline from '../../components/TrackingTimeline';
import {
  Truck, MapPin, Phone, CheckCircle2, AlertTriangle, Navigation,
  RefreshCw, X, Package, DollarSign, ChevronRight, Camera,
  FileText, Clock, User
} from 'lucide-react';
import toast from 'react-hot-toast';

const FAILURE_REASONS = [
  'Customer unavailable / door locked',
  'Wrong or incomplete address provided',
  'Customer refused to accept the package',
  'Customer refused to pay (COD order)',
  'Vehicle breakdown or road blockage',
  'Unable to locate the delivery address',
  'Natural calamity / extreme weather',
  'Other (specify in remarks)',
];

// Status flow config
const STATUS_ACTIONS = {
  ASSIGNED: {
    next: 'PICKED_UP',
    label: 'Mark Picked Up',
    color: 'bg-purple-600 hover:bg-purple-500',
    remarks: 'Package picked up from sender at pickup origin.',
    icon: Package,
  },
  PICKED_UP: {
    next: 'IN_TRANSIT',
    label: 'Mark In Transit',
    color: 'bg-sky-600 hover:bg-sky-500',
    remarks: 'Shipment in transit towards destination.',
    icon: Truck,
  },
  IN_TRANSIT: {
    next: 'OUT_FOR_DELIVERY',
    label: 'Mark Out for Delivery',
    color: 'bg-amber-500 hover:bg-amber-400',
    remarks: 'Out for delivery — approaching customer doorstep.',
    icon: Navigation,
  },
  OUT_FOR_DELIVERY: {
    next: 'DELIVERED',
    label: '✓ Mark Delivered',
    color: 'bg-emerald-600 hover:bg-emerald-500',
    remarks: 'Successfully delivered to customer.',
    icon: CheckCircle2,
  },
};

// POD Confirmation Overlay (for DELIVERED)
// POD Confirmation Overlay (for DELIVERED with OTP Verification — Feature 26)
function PODConfirmModal({ order, onConfirm, onCancel, loading }) {
  const [recipientName, setRecipientName] = useState(order.customer?.name || '');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [generatingOtp, setGeneratingOtp] = useState(false);
  const [notes, setNotes] = useState('');

  const handleSendOtp = async () => {
    setGeneratingOtp(true);
    try {
      const res = await api.post(`/orders/${order.id}/pod/otp`);
      if (res.data.success) {
        setOtpSent(true);
        toast.success(`OTP generated and sent to ${order.customer?.name || 'customer'}!`);
      }
    } catch {
      toast.error('Failed to send OTP');
    } finally {
      setGeneratingOtp(false);
    }
  };

  const handleVerifySubmit = async () => {
    if (!recipientName.trim()) {
      toast.error('Recipient name is required');
      return;
    }
    if (order.deliveryOtp && !otp.trim()) {
      toast.error('OTP code is required for delivery verification');
      return;
    }
    try {
      const res = await api.post(`/orders/${order.id}/pod/verify`, {
        recipientName,
        otp,
        notes,
      });
      if (res.data.success) {
        toast.success('✓ Delivery verified via OTP and marked DELIVERED!');
        onConfirm();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
          <h3 className="text-base font-extrabold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Proof of Delivery (POD) & OTP
          </h3>
          <p className="text-xs text-white/70 mt-1">Verify customer 6-digit OTP before marking delivered</p>
        </div>
        <div className="p-5 space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <p><strong>Customer:</strong> {order.customer?.name}</p>
            <p><strong>Drop Address:</strong> {order.dropAddress}</p>
            <p><strong>Amount (COD):</strong> {order.paymentType === 'COD' ? `₹${order.totalAmount} cash to collect` : 'PREPAID'}</p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Recipient Name</label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold"
              placeholder="Full Name of Recipient"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700">6-Digit Customer Delivery OTP</label>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={generatingOtp}
                className="text-[11px] font-bold text-sky-600 hover:underline"
              >
                {generatingOtp ? 'Sending OTP...' : otpSent ? 'Resend OTP' : 'Generate & Send OTP'}
              </button>
            </div>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-center text-base tracking-widest text-sky-700 font-bold"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold">
              Cancel
            </button>
            <button
              onClick={handleVerifySubmit}
              disabled={loading || !recipientName.trim()}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Verify & Complete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Failure Report Modal
function FailureModal({ order, onSubmit, onCancel, loading }) {
  const [failureReason, setFailureReason] = useState('');
  const [remarks, setRemarks] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!failureReason) { toast.error('Please select a failure reason'); return; }
    onSubmit({ failureReason, remarks });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="p-5 bg-gradient-to-r from-rose-600 to-red-700 text-white">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Report Failed Delivery
            </h3>
            <button onClick={onCancel} className="text-white/80 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-white/70 mt-1">Order {order.orderNumber} — {order.customer?.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-2">Failure Reason *</label>
            <div className="space-y-2">
              {FAILURE_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    failureReason === reason
                      ? 'bg-rose-50 border-rose-400 text-rose-800'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="failureReason"
                    value={reason}
                    checked={failureReason === reason}
                    onChange={() => setFailureReason(reason)}
                    className="w-3.5 h-3.5 accent-rose-600"
                  />
                  <span className="font-semibold">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Additional Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Describe what happened in detail (optional)..."
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !failureReason}
              className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
              {loading ? 'Reporting...' : 'Submit Failure Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AgentActiveDeliveryPage() {
  const { user } = useAuth();
  const agentId = user?.agentProfile?.id;

  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [showFailModal, setShowFailModal] = useState(false);
  const [showPODModal, setShowPODModal] = useState(false);

  useEffect(() => {
    if (agentId) fetchActiveDelivery();
  }, [agentId]);

  const fetchActiveDelivery = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/agents/${agentId}/deliveries`);
      if (res.data.success && res.data.activeOrders.length > 0) {
        // Load full order details including tracking
        const detailRes = await api.get(`/orders/${res.data.activeOrders[0].id}`);
        setActiveOrder(detailRes.data.success ? detailRes.data.order : res.data.activeOrders[0]);
      } else {
        setActiveOrder(null);
      }
    } catch {
      toast.error('Failed to load active delivery');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (nextStatus, remarks = '') => {
    if (!activeOrder) return;
    setActionLoading(true);
    try {
      const res = await api.patch(`/orders/${activeOrder.id}/status`, { status: nextStatus, remarks });
      if (res.data.success) {
        toast.success(`✓ Status updated: ${nextStatus.replace(/_/g, ' ')}`);
        setShowPODModal(false);
        fetchActiveDelivery();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFailSubmit = async ({ failureReason, remarks }) => {
    setActionLoading(true);
    try {
      const res = await api.patch(`/orders/${activeOrder.id}/status`, {
        status: 'FAILED',
        failureReason,
        remarks,
      });
      if (res.data.success) {
        toast.error('Delivery marked as FAILED — customer has been notified');
        setShowFailModal(false);
        fetchActiveDelivery();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to report failure');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs animate-pulse">Loading active delivery...</div>;
  }

  if (!activeOrder) {
    return (
      <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
          <Truck className="w-8 h-8 text-slate-300" />
        </div>
        <p className="font-extrabold text-slate-800 text-base">No Active Delivery</p>
        <p className="text-slate-400 text-xs">
          Set your availability to <strong>AVAILABLE</strong> on the dashboard to start receiving delivery assignments.
        </p>
      </div>
    );
  }

  const actionConfig = STATUS_ACTIONS[activeOrder.status];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ACTIVE DELIVERY</span>
          <h1 className="text-xl font-extrabold text-slate-900 font-mono">{activeOrder.orderNumber}</h1>
          <p className="text-xs text-slate-500">{activeOrder.customer?.name} • {activeOrder.paymentType} ₹{activeOrder.totalAmount}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={activeOrder.status} />
          <button onClick={fetchActiveDelivery} className="p-2.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map */}
        <div className="lg:col-span-7 space-y-4">
          <MapCard
            pickup={{ address: activeOrder.pickupAddress }}
            drop={{ address: activeOrder.dropAddress }}
            agent={user?.agentProfile}
            currentStatus={activeOrder.status}
          />

          {/* Tracking Timeline */}
          {activeOrder.tracking && activeOrder.tracking.length > 0 && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-600" /> Delivery Timeline
              </h3>
              <TrackingTimeline tracking={activeOrder.tracking} currentStatus={activeOrder.status} />
            </div>
          )}
        </div>

        {/* Actions Column */}
        <div className="lg:col-span-5 space-y-4 text-xs">
          {/* Customer & Route Info */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
              DELIVERY DETAILS
            </h3>
            <div className="space-y-2 text-slate-700">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span><strong>Customer:</strong> {activeOrder.customer?.name}</span>
              </div>
              {activeOrder.customer?.phone && (
                <a href={`tel:${activeOrder.customer.phone}`} className="flex items-center gap-2 text-sky-600 font-bold hover:underline">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{activeOrder.customer.phone}</span>
                </a>
              )}
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Pickup:</strong> {activeOrder.pickupAddress} ({activeOrder.pickupPincode})</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span><strong>Drop:</strong> {activeOrder.dropAddress} ({activeOrder.dropPincode})</span>
              </div>
            </div>

            {/* Payment */}
            <div className={`p-3 rounded-xl flex items-center justify-between border ${
              activeOrder.paymentType === 'COD'
                ? 'bg-amber-50 border-amber-200'
                : 'bg-emerald-50 border-emerald-200'
            }`}>
              <div className="flex items-center gap-2">
                <DollarSign className={`w-4 h-4 ${activeOrder.paymentType === 'COD' ? 'text-amber-600' : 'text-emerald-600'}`} />
                <span className={`font-extrabold ${activeOrder.paymentType === 'COD' ? 'text-amber-800' : 'text-emerald-800'}`}>
                  {activeOrder.paymentType}
                </span>
              </div>
              <span className="font-extrabold text-slate-900">₹{activeOrder.totalAmount}</span>
            </div>
          </div>

          {/* Status Actions */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
              STATUS ACTIONS
            </h3>

            {/* Primary action */}
            {actionConfig && activeOrder.status !== 'DELIVERED' && (
              <button
                onClick={() => {
                  if (actionConfig.next === 'DELIVERED') {
                    setShowPODModal(true);
                  } else {
                    handleUpdateStatus(actionConfig.next, actionConfig.remarks);
                  }
                }}
                disabled={actionLoading}
                className={`w-full py-3 rounded-xl text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-60 ${actionConfig.color}`}
              >
                {actionLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <actionConfig.icon className="w-4 h-4" />
                )}
                {actionConfig.label}
                <ChevronRight className="w-3.5 h-3.5 ml-auto" />
              </button>
            )}

            {activeOrder.status === 'DELIVERED' && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-emerald-800">Delivery Completed!</span>
              </div>
            )}

            {/* Fail button — always visible unless delivered */}
            {activeOrder.status !== 'DELIVERED' && (
              <button
                onClick={() => setShowFailModal(true)}
                disabled={actionLoading}
                className="w-full py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              >
                <AlertTriangle className="w-4 h-4" /> Report Delivery Failure
              </button>
            )}
          </div>

          {/* Package Info */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
              PACKAGE INFO
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] text-slate-400">Dimensions</p>
                <p className="font-bold text-slate-800">{activeOrder.length}×{activeOrder.breadth}×{activeOrder.height} cm</p>
              </div>
              <div className="text-center p-2 rounded-xl bg-sky-50 border border-sky-200">
                <p className="text-[10px] text-slate-400">Billable Wt.</p>
                <p className="font-extrabold text-sky-700">{activeOrder.chargeableWeight} kg</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Failure Modal */}
      {showFailModal && (
        <FailureModal
          order={activeOrder}
          onSubmit={handleFailSubmit}
          onCancel={() => setShowFailModal(false)}
          loading={actionLoading}
        />
      )}

      {/* POD Confirmation Modal */}
      {showPODModal && (
        <PODConfirmModal
          order={activeOrder}
          onConfirm={() => handleUpdateStatus('DELIVERED', 'Successfully delivered to customer. Proof of delivery confirmed.')}
          onCancel={() => setShowPODModal(false)}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
