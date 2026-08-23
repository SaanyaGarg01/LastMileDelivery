import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { TrendingUp, RefreshCw, CheckCircle2, ArrowRight, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminOptimizationPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await api.post('/admin/optimization/simulation');
      if (res.data.success) {
        setData(res.data);
        toast.success('Optimization simulation completed successfully!');
      }
    } catch (err) {
      toast.error('Failed to run optimization simulation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" /> BEFORE VS AFTER OPTIMIZATION DASHBOARD
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quantify the business impact of intelligent multi-factor assignment vs static assignment.
          </p>
        </div>
        <button
          type="button"
          onClick={runSimulation}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Run Optimization Simulation
        </button>
      </div>

      {data && (
        <div className="space-y-6">
          {/* Summary Box */}
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
            <div className="font-extrabold text-sm flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" /> OPTIMIZATION IMPACT SUMMARY
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">{data.summary}</p>
          </div>

          {/* Metric Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(data.metrics).map(([key, val]) => (
              <div key={key} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  {key.replace(/([A-Z])/g, ' $1').toUpperCase()}
                </span>
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-slate-400 text-xs block">Baseline</span>
                    <span className="text-lg font-bold text-slate-600 font-mono">{val.baseline} {val.unit}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                  <div className="text-right">
                    <span className="text-emerald-600 text-xs block font-bold">Smart System</span>
                    <span className="text-2xl font-extrabold text-emerald-600 font-mono">{val.smart} {val.unit}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700 bg-emerald-50/50 p-2 rounded-xl">
                  <span>IMPROVEMENT</span>
                  <span>+{val.improvementPct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
