import React from 'react';
import { 
  Check, 
  Clock, 
  AlertTriangle, 
  User, 
  ShieldCheck, 
  Cpu, 
  Truck 
} from 'lucide-react';

const ACTOR_BADGES = {
  CUSTOMER: { label: 'Customer', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: User },
  AGENT: { label: 'Delivery Agent', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Truck },
  ADMIN: { label: 'System Admin', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: ShieldCheck },
  SYSTEM: { label: 'Automated System', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Cpu },
};

export default function TrackingTimeline({ tracking = [] }) {
  if (!tracking || tracking.length === 0) {
    return (
      <div className="p-6 text-center text-slate-400 text-xs">
        No tracking history recorded yet.
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {tracking.map((item, index) => {
        const isLatest = index === tracking.length - 1;
        const isFailed = item.status === 'FAILED';
        const actorConfig = ACTOR_BADGES[item.actorRole] || ACTOR_BADGES.SYSTEM;
        const ActorIcon = actorConfig.icon;

        return (
          <div key={item.id || index} className="relative group">
            {/* Timeline node icon */}
            <div
              className={`absolute -left-[23px] top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                isFailed
                  ? 'bg-rose-600 border-rose-500 text-white shadow-md shadow-rose-500/30'
                  : isLatest
                  ? 'bg-sky-600 border-sky-500 text-white shadow-md shadow-sky-600/30 ring-4 ring-sky-100'
                  : 'bg-emerald-600 border-emerald-500 text-white'
              }`}
            >
              {isFailed ? (
                <AlertTriangle className="w-3 h-3 text-white" />
              ) : isLatest ? (
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              ) : (
                <Check className="w-3 h-3 text-white" />
              )}
            </div>

            {/* Event Card */}
            <div className={`p-4 rounded-xl transition-all border text-xs ${
              isFailed
                ? 'bg-rose-50/60 border-rose-200 shadow-xs'
                : isLatest
                ? 'bg-sky-50/60 border-sky-200 shadow-xs'
                : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className={`font-extrabold ${isFailed ? 'text-rose-900' : 'text-slate-900'}`}>
                    {item.status.replace('_', ' ')}
                  </span>
                  
                  {/* Actor Badge */}
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${actorConfig.color}`}>
                    <ActorIcon className="w-2.5 h-2.5" />
                    {actorConfig.label}
                  </span>
                </div>

                <span className="text-[11px] text-slate-500 font-mono">
                  {new Date(item.timestamp).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {item.remarks && (
                <p className={`mt-1 leading-relaxed ${isFailed ? 'text-rose-800 font-medium' : 'text-slate-600'}`}>
                  {item.remarks}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
