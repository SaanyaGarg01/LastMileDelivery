import React from 'react';
import { RotateCcw, CheckCircle2, AlertTriangle, UserCheck, Clock } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function AttemptsHistoryCard({ assignments = [], reschedules = [] }) {
  if (!assignments || assignments.length === 0) {
    return null;
  }

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
        <RotateCcw className="w-4 h-4 text-sky-600" /> Delivery Attempts History ({assignments.length})
      </h3>

      <div className="space-y-3">
        {assignments.map((assignment, index) => {
          const isFailed = assignment.status === 'FAILED';
          const isCompleted = assignment.status === 'COMPLETED';
          const isReassigned = assignment.status === 'REASSIGNED';

          // Find corresponding reschedule reason if attempt failed
          const rescheduleRecord = reschedules[index] || reschedules[0];

          return (
            <div
              key={assignment.id || index}
              className={`p-3.5 rounded-xl border text-xs transition-all ${
                isFailed
                  ? 'bg-rose-50/50 border-rose-200 text-rose-900'
                  : isCompleted
                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span className="flex items-center gap-1.5">
                  <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                    isFailed ? 'bg-rose-600 text-white' : 'bg-slate-800 text-white'
                  }`}>
                    #{assignment.attemptNumber}
                  </span>
                  Attempt #{assignment.attemptNumber}
                </span>

                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-extrabold ${
                  isFailed ? 'bg-rose-200 text-rose-800' : isCompleted ? 'bg-emerald-200 text-emerald-800' : 'bg-sky-200 text-sky-800'
                }`}>
                  {assignment.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2 text-[11px] text-slate-600">
                <div>
                  <span className="font-semibold block text-slate-400">Assigned Agent:</span>
                  <span className="font-bold text-slate-800">
                    {assignment.agent?.user?.name || 'Rahul Sharma'}
                  </span>
                </div>

                <div>
                  <span className="font-semibold block text-slate-400">Assigned Date:</span>
                  <span>{new Date(assignment.assignedAt).toLocaleDateString()}</span>
                </div>
              </div>

              {isFailed && rescheduleRecord && (
                <div className="mt-2 pt-2 border-t border-rose-200/60 text-rose-700 text-[11px] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span><strong>Reason:</strong> {rescheduleRecord.reason || 'Customer unavailable during attempt.'}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
