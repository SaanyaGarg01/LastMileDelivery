import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Settings, Save, ShieldCheck, DollarSign, Sliders, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/admin/settings');
      if (res.data.success) {
        setSettings(res.data.settings || []);
      }
    } catch {
      toast.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (key, value) => {
    setSavingKey(key);
    try {
      const res = await api.patch('/admin/settings', { key, value });
      if (res.data.success) {
        toast.success(`Updated ${key} setting and logged audit event`);
        fetchSettings();
      }
    } catch {
      toast.error('Failed to update setting');
    } finally {
      setSavingKey(null);
    }
  };

  const categories = ['DELIVERY', 'PRICING', 'AGENT', 'NOTIFICATION', 'RISK', 'SYSTEM'];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Sliders className="w-5 h-5 text-sky-600" /> Global Logistics Settings & Configuration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized operational rules for pricing divisors, agent capacities, SLA thresholds, and system preferences.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs animate-pulse">Loading system configuration...</div>
      ) : (
        <div className="space-y-6">
          {categories.map((cat) => {
            const catSettings = settings.filter((s) => s.category === cat);
            if (catSettings.length === 0) return null;

            return (
              <div key={cat} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                  {cat} CONFIGURATION
                </h2>

                <div className="space-y-4">
                  {catSettings.map((s) => (
                    <SettingItem key={s.key} setting={s} onSave={handleUpdate} isSaving={savingKey === s.key} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SettingItem({ setting, onSave, isSaving }) {
  const [val, setVal] = useState(setting.value);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs">
      <div className="space-y-0.5 max-w-md">
        <span className="font-mono font-bold text-slate-900 block">{setting.key}</span>
        <span className="text-slate-500">{setting.description || 'Logistics configuration setting'}</span>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="p-2 rounded-xl border border-slate-200 font-mono font-bold bg-white text-slate-900 text-xs w-48 focus:ring-2 focus:ring-sky-500 outline-hidden"
        />
        <button
          onClick={() => onSave(setting.key, val)}
          disabled={isSaving || val === setting.value}
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs transition-all flex items-center gap-1 shrink-0"
        >
          {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
        </button>
      </div>
    </div>
  );
}
