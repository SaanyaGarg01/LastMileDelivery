import React from 'react';
import { ShieldCheck, AlertCircle, AlertTriangle, Clock } from 'lucide-react';

export default function DeliveryHealthCard({ order }) {
  if (!order) return null;

  const { status, tracking, updatedAt } = order;

  // Transparent rule-based health assessment logic
  let healthState = 'ON_TRACK';
  let title = 'ON TRACK';
  let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
  let icon = ShieldCheck;
  let iconColor = 'text-emerald-600';
  let message = 'Shipment is progressing normally along the scheduled delivery route.';

  if (status === 'FAILED') {
    healthState = 'ATTENTION_REQUIRED';
    title = 'ATTENTION REQUIRED';
    badgeColor = 'bg-rose-100 text-rose-800 border-rose-200';
    icon = AlertTriangle;
    iconColor = 'text-rose-600';
    message = 'Delivery attempt failed. Action required: Please reschedule a new delivery date.';
  } else if (status === 'IN_TRANSIT') {
    // Check if in transit for longer than 2 hours
    const hoursInState = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60);
    if (hoursInState > 2) {
      healthState = 'POTENTIAL_DELAY';
      title = 'POTENTIAL DELAY';
      badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
      icon = AlertCircle;
      iconColor = 'text-amber-600';
      message = 'Shipment has remained in transit longer than standard estimated window due to transit traffic.';
    }
  } else if (status === 'RESCHEDULED') {
    healthState = 'ON_TRACK';
    title = 'RESCHEDULED - ON TRACK';
    badgeColor = 'bg-sky-100 text-sky-800 border-sky-200';
    icon = Clock;
    iconColor = 'text-sky-600';
    message = 'Delivery successfully rescheduled. Awaiting agent assignment for next attempt.';
  }

  const IconComponent = icon;

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
          DELIVERY HEALTH STATUS
        </span>
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${badgeColor} flex items-center gap-1`}>
          <IconComponent className={`w-3.5 h-3.5 ${iconColor}`} /> {title}
        </span>
      </div>

      <div className="text-xs text-slate-700 space-y-2">
        <p className="font-semibold text-slate-900 leading-relaxed">{message}</p>

        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <div>
            <span className="font-bold text-slate-400 block">Current Status:</span>
            <span className="font-bold text-slate-900">{status.replace('_', ' ')}</span>
          </div>

          <div>
            <span className="font-bold text-slate-400 block">Last Health Check:</span>
            <span className="font-mono">{new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
