import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Activity, ShieldCheck, Zap, Radio, RefreshCw, AlertTriangle, ArrowUpRight, Bot } from 'lucide-react';
import toast from 'react-hot-toast';
import OperationsCopilotWidget from '../../components/OperationsCopilotWidget';

export default function AdminMissionControlPage() {
  const [health, setHealth] = useState(null);
  const [radar, setRadar] = useState(null);
  const [events, setEvents] = useState([]);
  const [autoPilotMode, setAutoPilotMode] = useState('RECOMMENDATION_ONLY');
  const [loading, setLoading] = useState(true);
  const [showCopilot, setShowCopilot] = useState(false);

  useEffect(() => {
    fetchMissionControlData();
    const interval = setInterval(fetchMissionControlData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchMissionControlData = async () => {
    try {
      const [healthRes, radarRes, eventsRes] = await Promise.all([
        api.get('/admin/operations-health'),
        api.get('/admin/risk-radar'),
        api.get('/admin/autopilot/events'),
      ]);

      if (healthRes.data.success) setHealth(healthRes.data.health);
      if (radarRes.data.success) setRadar(radarRes.data);
      if (eventsRes.data.success) setEvents(eventsRes.data.events);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutoPilot = async (newMode) => {
    try {
      const res = await api.post('/admin/autopilot/toggle', { mode: newMode });
      if (res.data.success) {
        setAutoPilotMode(newMode);
        toast.success(`AutoPilot mode set to ${newMode}`);
        fetchMissionControlData();
      }
    } catch (err) {
      toast.error('Failed to toggle AutoPilot mode');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin text-sky-600 mx-auto mb-2" />
        Connecting to Live Operations Command Center stream...
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-slate-950 p-6 rounded-3xl text-white shadow-2xl border border-slate-800">
      {/* Top Mission Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white tracking-widest uppercase flex items-center gap-2">
              <Radio className="w-5 h-5 text-emerald-400" /> LIVE OPERATIONS MISSION CONTROL
            </h1>
            <p className="text-xs text-slate-400">Real-time autonomous dispatch & operational intelligence center</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* AutoPilot Mode Buttons */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => handleToggleAutoPilot('OFF')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${autoPilotMode === 'OFF' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              OFF
            </button>
            <button
              type="button"
              onClick={() => handleToggleAutoPilot('RECOMMENDATION_ONLY')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${autoPilotMode === 'RECOMMENDATION_ONLY' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              REC ONLY
            </button>
            <button
              type="button"
              onClick={() => handleToggleAutoPilot('FULL_AUTO')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${autoPilotMode === 'FULL_AUTO' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              FULL AUTO
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowCopilot(true)}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <Bot className="w-4 h-4" /> Ask Copilot
          </button>
        </div>
      </div>

      {/* KPI Command Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">LOGISTICS HEALTH SCORE</span>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono">{health?.overallScore || 92} / 100</div>
          <span className="text-[10px] text-slate-500 font-semibold">{health?.statusLabel || 'EXCELLENT'} OPERATIONAL STATE</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">ACTIVE SHIPMENTS</span>
          <div className="text-3xl font-extrabold text-sky-400 font-mono">{radar?.summary?.totalActive || 0}</div>
          <span className="text-[10px] text-slate-500 font-semibold">IN TRANSIT / OUT FOR DELIVERY</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">CRITICAL SLA RISKS</span>
          <div className="text-3xl font-extrabold text-rose-400 font-mono">{radar?.summary?.criticalCount || 0}</div>
          <span className="text-[10px] text-slate-500 font-semibold">REQUIRING ACTION</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">AUTOPILOT MODE</span>
          <div className="text-lg font-extrabold text-amber-400 font-mono mt-1">{autoPilotMode}</div>
          <span className="text-[10px] text-slate-500 font-semibold">DECISION ENGINE STREAM</span>
        </div>
      </div>

      {/* Grid Layout: Live Event Stream & Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Stream */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" /> AUTONOMOUS DECISION STREAM
          </h3>
          <div className="divide-y divide-slate-800 max-h-80 overflow-y-auto font-mono text-xs space-y-2">
            {events.map((ev) => (
              <div key={ev.id} className="pt-2 flex items-start justify-between gap-3 text-slate-300">
                <div>
                  <div className="font-bold text-sky-400">{ev.eventTitle}</div>
                  <div className="text-[11px] text-slate-400">{ev.details}</div>
                </div>
                <span className="text-[10px] text-slate-500 shrink-0">
                  {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Health Pillars */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" /> LOGISTICS HEALTH PILLARS
          </h3>
          <div className="space-y-3 text-xs">
            {health?.pillars?.map((p, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between font-bold text-slate-300">
                  <span>{p.name}</span>
                  <span className="font-mono text-emerald-400">{p.scorePct}% ({p.weight})</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${p.scorePct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Copilot Slide-over */}
      <OperationsCopilotWidget isOpen={showCopilot} onClose={() => setShowCopilot(false)} />
    </div>
  );
}
