import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { User, Truck, ShieldCheck, CheckCircle2, AlertTriangle, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AgentProfilePage() {
  const { user } = useAuth();
  const agentProfile = user?.agentProfile;

  const [availability, setAvailability] = useState(agentProfile?.status || 'AVAILABLE');
  const [metrics, setMetrics] = useState({
    completedDeliveries: [],
    failedDeliveries: [],
    activeOrders: [],
  });

  useEffect(() => {
    if (agentProfile?.id) {
      fetchAgentMetrics();
    }
  }, [agentProfile?.id]);

  const fetchAgentMetrics = async () => {
    try {
      const res = await api.get(`/agents/${agentProfile.id}/deliveries`);
      if (res.data.success) {
        setMetrics(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggle = async (newStatus) => {
    try {
      const res = await api.patch(`/agents/${agentProfile.id}/availability`, { status: newStatus });
      if (res.data.success) {
        setAvailability(newStatus);
        toast.success(`Availability status set to ${newStatus}`);
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const total = metrics.completedDeliveries.length + metrics.failedDeliveries.length;
  const successRate = total > 0 ? Math.round((metrics.completedDeliveries.length / total) * 100) : 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">Agent Profile</h1>
        <p className="text-xs text-slate-500">Manage your operational availability, vehicle details, and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 text-xs">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center font-extrabold text-base">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">{user?.name}</h2>
              <p className="text-slate-500">{user?.email}</p>
              <span className="text-[10px] font-bold text-purple-700 uppercase bg-purple-50 px-2 py-0.5 rounded">
                Vehicle: {agentProfile?.vehicleType || 'EV BIKE'}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-slate-700">
            <p><strong>Phone Number:</strong> {user?.phone || '+91 9711100001'}</p>
            <p><strong>Current Zone:</strong> Delhi NCR Central Zone</p>
            <p><strong>Current GPS:</strong> {agentProfile?.currentLat?.toFixed(4)}, {agentProfile?.currentLng?.toFixed(4)}</p>
          </div>

          {/* Availability Control */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block font-bold text-slate-700 mb-1.5">Duty Status Toggle</label>
            <div className="grid grid-cols-3 gap-2">
              {['AVAILABLE', 'BUSY', 'OFFLINE'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleToggle(status)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    availability === status
                      ? status === 'AVAILABLE'
                        ? 'bg-emerald-600 text-white'
                        : status === 'BUSY'
                        ? 'bg-amber-500 text-white'
                        : 'bg-rose-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
            DELIVERY PERFORMANCE METRICS
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 space-y-1">
              <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Successful
              </span>
              <span className="text-2xl font-extrabold text-emerald-900">{metrics.completedDeliveries.length}</span>
            </div>

            <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 space-y-1">
              <span className="text-xs font-semibold text-rose-800 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-rose-600" /> Failed
              </span>
              <span className="text-2xl font-extrabold text-rose-900">{metrics.failedDeliveries.length}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700">Delivery Success Score</span>
            <span className="text-lg font-extrabold text-sky-700">{successRate}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
