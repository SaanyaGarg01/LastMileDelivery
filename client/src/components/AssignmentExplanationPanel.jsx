import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Bot, CheckCircle, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';

export default function AssignmentExplanationPanel({ orderId }) {
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) fetchExplanation();
  }, [orderId]);

  const fetchExplanation = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/orders/${orderId}/assignment-explanation`);
      if (res.data.success) {
        setExplanation(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-xs text-slate-400 flex items-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-sky-600" /> Calculating smart assignment score factors...
      </div>
    );
  }

  if (!explanation || !explanation.assigned) {
    return (
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
        🤖 Order is currently in the dispatch assignment queue.
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-sky-600" />
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            SMART ASSIGNMENT EXPLANATION <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          </h3>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs">
          SCORE: {explanation.totalScore} / 100
        </span>
      </div>

      <div className="text-xs text-slate-700 bg-sky-50/70 border border-sky-100 p-3 rounded-xl space-y-1">
        <div className="font-bold text-sky-950">WHY {explanation.agent?.name?.toUpperCase()} WAS SELECTED:</div>
        <p className="text-slate-600 leading-relaxed">{explanation.recommendationReason}</p>
      </div>

      <div className="space-y-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SCORE FACTOR BREAKDOWN</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {explanation.factors.map((f, idx) => (
            <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> {f.name}
                </span>
                <span className="font-mono font-extrabold text-sky-700">{f.score}/{f.max}</span>
              </div>
              <p className="text-[11px] text-slate-500">{f.explanation}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
