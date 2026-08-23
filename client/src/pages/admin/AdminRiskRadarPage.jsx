import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { AlertOctagon, AlertTriangle, CheckCircle2, ShieldAlert, ArrowRight, RefreshCw, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import WhatIfAssignmentModal from '../../components/WhatIfAssignmentModal';

export default function AdminRiskRadarPage() {
  const [radar, setRadar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showWhatIfModal, setShowWhatIfModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRiskRadar();
  }, []);

  const fetchRiskRadar = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/risk-radar');
      if (res.data.success) {
        setRadar(res.data);
      }
    } catch (err) {
      toast.error('Failed to load delivery risk radar');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin text-sky-600 mx-auto mb-2" />
        Calculating live SLA risk scores, remaining distances, and agent workload exposures...
      </div>
    );
  }

  if (!radar) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        No active risk radar data available.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" /> DELIVERY RISK RADAR
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Identify SLA exposure, agent capacity limits, and delayed shipments before delivery window breaches occur.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchRiskRadar}
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Risk Radar
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase">ACTIVE SHIPMENTS</span>
          <div className="text-2xl font-extrabold text-slate-900">{radar?.summary?.totalActive || 0}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-rose-200 bg-rose-50/40 shadow-xs space-y-1">
          <span className="text-xs font-bold text-rose-700 uppercase flex items-center gap-1">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" /> CRITICAL (SLA RISK)
          </span>
          <div className="text-2xl font-extrabold text-rose-600">{radar?.summary?.criticalCount || 0}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-amber-200 bg-amber-50/40 shadow-xs space-y-1">
          <span className="text-xs font-bold text-amber-700 uppercase flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> AT RISK
          </span>
          <div className="text-2xl font-extrabold text-amber-600">{radar?.summary?.atRiskCount || 0}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-emerald-200 bg-emerald-50/40 shadow-xs space-y-1">
          <span className="text-xs font-bold text-emerald-700 uppercase flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ON TRACK
          </span>
          <div className="text-2xl font-extrabold text-emerald-600">{radar?.summary?.onTrackCount || 0}</div>
        </div>
      </div>

      {/* Critical Orders Table */}
      {radar?.criticalOrders?.length > 0 && (
        <div className="p-6 rounded-2xl bg-white border border-rose-200 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-rose-900 uppercase tracking-wider flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-600" /> Critical Severity Shipments ({radar.criticalOrders.length})
          </h3>
          <div className="divide-y divide-rose-100 overflow-x-auto text-xs">
            {radar.criticalOrders.map((o) => (
              <div key={o.orderId} className="py-3 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>#{o.orderNumber}</span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold">
                      RISK SCORE: {o.riskScore}/100
                    </span>
                  </div>
                  <div className="text-slate-500">
                    Customer: {o.customerName} • Agent: {o.assignedAgentName} • Route: {o.pickupZone || 'Zone'} ➔ {o.dropZone || 'Zone'}
                  </div>
                  <div className="text-rose-700 font-medium">{(o.factors || []).join(' • ') || 'SLA Exposure & Workload Risk'}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOrderId(o.orderId);
                      setShowWhatIfModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs transition-all flex items-center gap-1"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> What-If Reassign
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/orders/${o.orderId}`)}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1"
                  >
                    Inspect Order <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Active Orders Radar Grid */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
          Active Fleet Delivery Radar List ({radar?.allOrders?.length || 0})
        </h3>
        <div className="divide-y divide-slate-100 text-xs">
          {(radar?.allOrders || []).map((o) => (
            <div key={o.orderId} className="py-3 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span>#{o.orderNumber}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      o.radarCategory === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-800'
                        : o.radarCategory === 'AT_RISK'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {o.radarCategory}
                  </span>
                </div>
                <div className="text-slate-500">Agent: {o.assignedAgentName} • Status: {o.status}</div>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/orders/${o.orderId}`)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
              >
                View
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* What-If Simulation Modal */}
      {selectedOrderId && (
        <WhatIfAssignmentModal
          orderId={selectedOrderId}
          isOpen={showWhatIfModal}
          onClose={() => {
            setShowWhatIfModal(false);
            setSelectedOrderId(null);
          }}
          onAgentAssigned={fetchRiskRadar}
        />
      )}
    </div>
  );
}
