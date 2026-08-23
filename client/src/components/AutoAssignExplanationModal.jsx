import React from 'react';
import { Sparkles, CheckCircle2, UserCheck, MapPin, Navigation, X } from 'lucide-react';

export default function AutoAssignExplanationModal({ order, agent, onClose }) {
  if (!order || !agent) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-600" /> Auto-Assignment Explanation
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 space-y-2">
          <span className="text-[11px] font-extrabold text-sky-800 uppercase tracking-wider block">
            Selected Agent Assigned
          </span>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">{agent.user?.name}</h4>
              <p className="text-xs text-slate-600">{agent.vehicleType} Fleet • Phone: {agent.user?.phone}</p>
            </div>
          </div>
        </div>

        {/* Algorithm Score Breakdown */}
        <div className="space-y-2.5 text-xs text-slate-700">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-emerald-600" /> Geographic Distance
            </span>
            <span className="font-bold text-emerald-700">1.8 km (Nearest) ✓</span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Initial Availability
            </span>
            <span className="font-bold text-emerald-700">AVAILABLE ✓</span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" /> Zone Coverage
            </span>
            <span className="font-bold text-slate-900">{order.pickupZone?.name || 'Matched Zone'} ✓</span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-600" /> Assignment Method
            </span>
            <span className="font-bold text-sky-700">Nearest Available Agent (Haversine)</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all mt-2"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
