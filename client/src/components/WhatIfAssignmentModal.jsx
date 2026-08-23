import React, { useState } from 'react';
import api from '../api/axios';
import { Users, CheckCircle, RefreshCw, X, ArrowRight, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WhatIfAssignmentModal({ orderId, isOpen, onClose, onAgentAssigned }) {
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assigningId, setAssigningId] = useState(null);

  const fetchSimulation = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/orders/${orderId}/assignment-simulation`);
      if (res.data.success) {
        setSimulation(res.data);
      }
    } catch (err) {
      toast.error('Candidate simulation failed');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && orderId) {
      fetchSimulation();
    }
  }, [isOpen, orderId]);

  const handleConfirmAssignment = async (agentId) => {
    setAssigningId(agentId);
    try {
      const res = await api.post(`/admin/orders/${orderId}/reassign`, { agentId, reason: 'What-If Simulation Manual Assignment' });
      if (res.data.success) {
        toast.success('Agent assigned successfully!');
        if (onAgentAssigned) onAgentAssigned();
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assignment failed');
    } finally {
      setAssigningId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-600" /> WHAT-IF ASSIGNMENT SIMULATOR
            </h2>
            <p className="text-xs text-slate-400">Order #{simulation?.orderNumber || orderId} • Side-by-side agent comparison</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-sky-600 mx-auto" />
            <p>Evaluating candidate agents across distance, workload, ETA, and SLA risk factors...</p>
          </div>
        ) : (
          simulation && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <span className="font-extrabold uppercase">RECOMMENDED CANDIDATE:</span>
                <p className="text-emerald-800 leading-relaxed">{simulation.recommendationReason}</p>
              </div>

              <div className="divide-y divide-slate-100 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="p-2.5">Agent</th>
                      <th className="p-2.5">Distance</th>
                      <th className="p-2.5">Workload</th>
                      <th className="p-2.5">Est. ETA</th>
                      <th className="p-2.5">Risk Level</th>
                      <th className="p-2.5 text-right">Score</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {simulation.candidates.map((c) => (
                      <tr key={c.agentId} className={`hover:bg-slate-50 ${c.agentId === simulation.recommendedCandidate?.agentId ? 'bg-sky-50/40' : ''}`}>
                        <td className="p-2.5 font-bold text-slate-900">
                          {c.agentName}
                          {c.agentId === simulation.recommendedCandidate?.agentId && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-extrabold">REC</span>
                          )}
                        </td>
                        <td className="p-2.5 font-mono text-slate-600">{c.distanceKm} km</td>
                        <td className="p-2.5 font-mono text-slate-600">{c.workload}</td>
                        <td className="p-2.5 font-mono text-slate-600">{c.predictedETA}</td>
                        <td className="p-2.5 text-[11px] font-bold">{c.riskCategory}</td>
                        <td className="p-2.5 text-right font-mono font-extrabold text-sky-700">{c.totalScore}</td>
                        <td className="p-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleConfirmAssignment(c.agentId)}
                            disabled={!c.isEligible || assigningId === c.agentId}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-[11px] transition-all"
                          >
                            {assigningId === c.agentId ? 'Assigning...' : 'Assign'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
