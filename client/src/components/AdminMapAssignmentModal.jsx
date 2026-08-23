import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import InteractiveLogisticsMap from './InteractiveLogisticsMap';
import { X, Sparkles, CheckCircle2, User, MapPin, Truck, ShieldCheck, ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminMapAssignmentModal({ isOpen, order, onClose, onAssigned }) {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [recommendedAgent, setRecommendedAgent] = useState(null);

  useEffect(() => {
    if (isOpen && order?.id) {
      fetchEligibleAgents();
    }
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const fetchEligibleAgents = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/orders/${order.id}/eligible-agents`).catch(() => {
        // Fallback agent query
        return api.get('/agents');
      });

      if (res.data.success) {
        let list = res.data.agents || [];

        // Calculate Haversine distance for ranking if pickup coordinates exist
        const pickupLat = order.pickupLat || 28.6139;
        const pickupLng = order.pickupLng || 77.2090;

        list = list.map((ag) => {
          const lat = ag.currentLat || 28.6139;
          const lng = ag.currentLng || 77.2090;

          // Haversine formula
          const R = 6371; // km
          const dLat = (lat - pickupLat) * (Math.PI / 180);
          const dLng = (lng - pickupLng) * (Math.PI / 180);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(pickupLat * (Math.PI / 180)) *
              Math.cos(lat * (Math.PI / 180)) *
              Math.sin(dLng / 2) *
              Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distKm = R * c;

          return {
            ...ag,
            distKm,
            estimatedEtaMin: Math.max(3, Math.round(distKm * 3.5)),
          };
        });

        // Sort by availability and proximity distance
        list.sort((a, b) => {
          if (a.status === 'AVAILABLE' && b.status !== 'AVAILABLE') return -1;
          if (a.status !== 'AVAILABLE' && b.status === 'AVAILABLE') return 1;
          return a.distKm - b.distKm;
        });

        setAgents(list);

        const topAvailable = list.find((a) => a.status === 'AVAILABLE');
        if (topAvailable) {
          setRecommendedAgent(topAvailable);
          setSelectedAgent(topAvailable);
        }
      }
    } catch {
      toast.error('Failed to load eligible agents');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignAgent = async (agentToAssign) => {
    if (!agentToAssign) return;
    setAssigning(true);
    try {
      const res = await api.put(`/orders/${order.id}/assign`, {
        agentId: agentToAssign.id,
      });

      if (res.data.success) {
        toast.success(`Assigned shipment #${order.orderNumber} to ${agentToAssign.user?.name || agentToAssign.name}!`);
        if (onAssigned) onAssigned(res.data.order);
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assignment failed. Refreshing available agents...');
      fetchEligibleAgents();
    } finally {
      setAssigning(false);
    }
  };

  const handleAutoAssign = async () => {
    setAssigning(true);
    try {
      const res = await api.post(`/orders/${order.id}/auto-assign`);
      if (res.data.success) {
        const assignedName = res.data.order?.assignedAgent?.user?.name || 'Nearest Agent';
        toast.success(`Auto-Assigned shipment #${order.orderNumber} to ${assignedName}!`);
        if (onAssigned) onAssigned(res.data.order);
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Auto-assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  const pickupObj = {
    address: order.pickupAddress,
    pincode: order.pickupPincode,
    lat: order.pickupLat || 28.6139,
    lng: order.pickupLng || 77.2090,
  };

  const dropObj = {
    address: order.dropAddress,
    pincode: order.dropPincode,
    lat: order.dropLat || 28.6320,
    lng: order.dropLng || 77.2190,
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400 font-bold block">OPERATIONS MAP DISPATCH</span>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-sky-400" /> Assign Delivery Agent — #{order.orderNumber}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Two-Panel Layout (Part 8 & Part 41 Reference) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-y-auto flex-1">
          {/* LEFT PANEL — Order Summary & Recommended Agent */}
          <div className="lg:col-span-5 p-5 space-y-5 bg-slate-50 border-r border-slate-200 overflow-y-auto text-xs">
            {/* Order Details Card */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <span className="font-extrabold text-slate-400 uppercase text-[10px] tracking-wider block">SHIPMENT DETAILS</span>
              <div className="font-extrabold text-slate-900 text-sm">Customer: {order.customer?.name || 'Aarav Sharma'}</div>
              <div className="text-slate-600 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" /> <strong>Pickup:</strong> {order.pickupAddress}</div>
              <div className="text-slate-600 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> <strong>Drop:</strong> {order.dropAddress}</div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-slate-700">
                <span>Total Amount: <strong className="text-emerald-700 font-mono text-xs">₹{order.totalAmount}</strong> ({order.paymentType})</span>
                <span>Type: <strong className="text-slate-900">{order.orderType}</strong></span>
              </div>
            </div>

            {/* AUTO ASSIGNMENT RECOMMENDATION CARD */}
            {recommendedAgent ? (
              <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-lg space-y-3 border border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> ⭐ RECOMMENDED NEAREST AGENT
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                    AVAILABLE
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center font-extrabold text-white text-base shadow-md">
                    {recommendedAgent.user?.name ? recommendedAgent.user.name[0] : 'A'}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-white">{recommendedAgent.user?.name || recommendedAgent.name}</h4>
                    <p className="text-[11px] text-slate-300">Vehicle: {recommendedAgent.vehicleType || 'EV Bike'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-800/80 p-2.5 rounded-xl text-[11px] border border-slate-700">
                  <div>📍 Proximity: <strong className="text-sky-400 font-mono">{recommendedAgent.distKm.toFixed(1)} km</strong></div>
                  <div>⏱️ Travel ETA: <strong className="text-emerald-400 font-mono">{recommendedAgent.estimatedEtaMin} min</strong></div>
                </div>

                <button
                  type="button"
                  disabled={assigning}
                  onClick={() => handleAssignAgent(recommendedAgent)}
                  className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  {assigning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {assigning ? 'Assigning...' : 'CONFIRM AUTO ASSIGNMENT'}
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2">
                <div className="font-bold text-xs flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-rose-600" /> No Available Nearby Agents</div>
                <p className="text-[11px] text-rose-600">All fleet agents are currently BUSY or OFFLINE.</p>
              </div>
            )}

            {/* OTHER ELIGIBLE AGENTS LIST */}
            <div className="space-y-2">
              <span className="font-extrabold text-slate-400 uppercase text-[10px] tracking-wider block">ALL FLEET AGENTS ({agents.length})</span>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {agents.map((ag) => {
                  const isSel = selectedAgent?.id === ag.id;
                  const isAvail = ag.status === 'AVAILABLE';
                  return (
                    <div
                      key={ag.id}
                      onClick={() => setSelectedAgent(ag)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                        isSel ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-100' : 'bg-white border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isAvail ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {ag.user?.name ? ag.user.name[0] : 'A'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            {ag.user?.name || ag.name}
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                              isAvail ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {ag.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">{ag.distKm ? ag.distKm.toFixed(1) : '1.2'} km away • {ag.vehicleType || 'EV Bike'}</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={!isAvail || assigning}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAssignAgent(ag);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[11px] disabled:opacity-40"
                      >
                        Assign
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL — Large Interactive Map */}
          <div className="lg:col-span-7 p-4 bg-slate-900 flex flex-col min-h-[400px]">
            <InteractiveLogisticsMap
              pickup={pickupObj}
              drop={dropObj}
              agents={agents}
              recommendedAgentId={recommendedAgent?.id}
              selectedAgentId={selectedAgent?.id}
              onSelectAgent={(ag) => {
                setSelectedAgent(ag);
                handleAssignAgent(ag);
              }}
              height="100%"
              showRoute={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
