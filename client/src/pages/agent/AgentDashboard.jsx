import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import { 
  Truck, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Navigation, 
  Phone,
  Power,
  RefreshCw,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AgentDashboard() {
  const { user } = useAuth();
  const agentId = user?.agentProfile?.id;

  const [availability, setAvailability] = useState(user?.agentProfile?.status || 'AVAILABLE');
  const [deliveries, setDeliveries] = useState({
    activeOrders: [],
    todayDeliveries: [],
    failedDeliveries: [],
    completedDeliveries: [],
  });
  const [loading, setLoading] = useState(true);

  // Failure Modal State
  const [showFailModal, setShowFailModal] = useState(false);
  const [failOrderId, setFailOrderId] = useState(null);
  const [failureReason, setFailureReason] = useState('');
  const [failLoading, setFailLoading] = useState(false);

  useEffect(() => {
    if (agentId) {
      fetchAgentDeliveries();
    }
  }, [agentId]);

  const fetchAgentDeliveries = async () => {
    try {
      const res = await api.get(`/agents/${agentId}/deliveries`);
      if (res.data.success) {
        setDeliveries(res.data);
      }
    } catch (err) {
      toast.error('Failed to load agent deliveries');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (newStatus) => {
    try {
      const res = await api.patch(`/agents/${agentId}/availability`, { status: newStatus });
      if (res.data.success) {
        setAvailability(newStatus);
        toast.success(`Availability status updated to ${newStatus}`);
      }
    } catch (err) {
      toast.error('Failed to update availability status');
    }
  };

  const handleUpdateStatus = async (orderId, nextStatus, remarks = '') => {
    try {
      const res = await api.patch(`/orders/${orderId}/status`, {
        status: nextStatus,
        remarks,
      });

      if (res.data.success) {
        toast.success(`Order status updated to ${nextStatus.replace('_', ' ')}`);
        fetchAgentDeliveries();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleFailSubmit = async (e) => {
    e.preventDefault();
    if (!failureReason) {
      toast.error('Please enter failure reason');
      return;
    }

    setFailLoading(true);
    try {
      const res = await api.patch(`/orders/${failOrderId}/status`, {
        status: 'FAILED',
        failureReason,
      });

      if (res.data.success) {
        toast.error(`Order marked as FAILED`);
        setShowFailModal(false);
        setFailureReason('');
        fetchAgentDeliveries();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit failure');
    } finally {
      setFailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Availability Header */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white">Agent Command Center</h1>
          <p className="text-xs text-slate-400 mt-1">
            Logged in as <span className="text-sky-400 font-bold">{user?.name}</span> ({user?.agentProfile?.vehicleType})
          </p>
        </div>

        {/* Availability Toggle Pill */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800">
          {['AVAILABLE', 'BUSY', 'OFFLINE'].map((status) => (
            <button
              key={status}
              onClick={() => handleToggleAvailability(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                availability === status
                  ? status === 'AVAILABLE'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : status === 'BUSY'
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                    : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Active Orders List */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-sky-400" /> Active Deliveries Assigned ({deliveries.activeOrders.length})
          </h2>
          <button onClick={fetchAgentDeliveries} className="text-slate-400 hover:text-white p-1">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 animate-pulse">Loading active deliveries...</div>
        ) : deliveries.activeOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No active deliveries assigned at the moment. Status set to {availability}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deliveries.activeOrders.map((order) => (
              <div key={order.id} className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sky-400 text-sm">{order.orderNumber}</span>
                  <StatusBadge status={order.status} />
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">PICKUP LOCATION</span>
                    <span className="text-slate-200 font-semibold">{order.pickupAddress} ({order.pickupPincode})</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">DROP DESTINATION</span>
                    <span className="text-slate-200 font-semibold">{order.dropAddress} ({order.dropPincode})</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400 pt-1">
                    <span>Customer: {order.customer?.name} ({order.customer?.phone || 'N/A'})</span>
                    <span className="font-bold text-white">₹{order.totalAmount}</span>
                  </div>
                </div>

                {/* Valid Next Transition Action Buttons */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap gap-2">
                  {order.status === 'ASSIGNED' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'PICKED_UP', 'Agent picked up package from origin')}
                      className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20"
                    >
                      Mark Picked Up
                    </button>
                  )}

                  {order.status === 'PICKED_UP' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'IN_TRANSIT', 'Agent in transit to destination zone')}
                      className="flex-1 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-500/20"
                    >
                      Mark In Transit
                    </button>
                  )}

                  {order.status === 'IN_TRANSIT' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'OUT_FOR_DELIVERY', 'Agent out for delivery at customer address')}
                      className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-500/20"
                    >
                      Mark Out for Delivery
                    </button>
                  )}

                  {order.status === 'OUT_FOR_DELIVERY' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'DELIVERED', 'Delivered successfully to customer')}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20"
                    >
                      Mark Delivered
                    </button>
                  )}

                  {/* Failure action button */}
                  {['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(order.status) && (
                    <button
                      onClick={() => {
                        setFailOrderId(order.id);
                        setShowFailModal(true);
                      }}
                      className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs"
                    >
                      Mark Failed
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Failure Reason Modal */}
      {showFailModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Record Delivery Failure
              </h3>
              <button onClick={() => setShowFailModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFailSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Failure Reason (Required)</label>
                <select
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 mb-2 focus:border-rose-500"
                  required
                >
                  <option value="">Select Failure Reason</option>
                  <option value="Customer unreachable / door locked">Customer unreachable / door locked</option>
                  <option value="Incorrect address / pincode">Incorrect address / pincode</option>
                  <option value="Customer refused package / payment">Customer refused package / payment</option>
                  <option value="Weather / transit obstruction">Weather / transit obstruction</option>
                </select>

                <textarea
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  placeholder="Or enter custom failure notes..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:border-rose-500 h-20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFailModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={failLoading}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20"
                >
                  {failLoading ? 'Submitting...' : 'Submit Failure Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
