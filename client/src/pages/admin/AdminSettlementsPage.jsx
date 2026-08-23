import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { DollarSign, CheckCircle2, Clock, Filter, ArrowUpRight, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettlementsPage() {
  const [earnings, setEarnings] = useState([]);
  const [summary, setSummary] = useState({ pendingTotal: 0, paidTotal: 0 });
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettlements();
  }, [filterStatus]);

  const fetchSettlements = async () => {
    try {
      const query = filterStatus ? `?status=${filterStatus}` : '';
      const res = await api.get(`/admin/settlements${query}`);
      if (res.data.success) {
        setEarnings(res.data.earnings || []);
        setSummary(res.data.summary || { pendingTotal: 0, paidTotal: 0 });
      }
    } catch {
      toast.error('Failed to load settlement records');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (nextStatus) => {
    if (selectedIds.length === 0) {
      toast.error('Select at least one payout record');
      return;
    }
    try {
      const res = await api.patch('/admin/settlements', {
        earningIds: selectedIds,
        status: nextStatus,
      });
      if (res.data.success) {
        toast.success(`Settlement status updated to ${nextStatus}`);
        setSelectedIds([]);
        fetchSettlements();
      }
    } catch {
      toast.error('Failed to update settlement status');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" /> Agent Delivery Settlements & Earnings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Approve and settle delivery agent payouts based on base rates, distance incentives, and SLA bonuses.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleStatusUpdate('APPROVED')}
            disabled={selectedIds.length === 0}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1"
          >
            Approve Selected ({selectedIds.length})
          </button>
          <button
            onClick={() => handleStatusUpdate('PAID')}
            disabled={selectedIds.length === 0}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1"
          >
            Mark Paid ({selectedIds.length})
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>TOTAL EARNINGS RECORDS</span>
            <DollarSign className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{earnings.length}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-amber-200 bg-amber-50/40 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-700 font-semibold">
            <span>PENDING SETTLEMENT</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600">₹{summary.pendingTotal.toFixed(2)}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-200 bg-emerald-50/40 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
            <span>PAID SETTLEMENTS</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">₹{summary.paidTotal.toFixed(2)}</div>
        </div>
      </div>

      {/* Data Table */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase">FILTER STATUS:</span>
            {['', 'PENDING', 'APPROVED', 'PAID'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  filterStatus === st ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st || 'ALL'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs animate-pulse">Loading settlement records...</div>
        ) : earnings.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No settlement records found.</div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto text-xs">
            {earnings.map((e) => (
              <div key={e.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(e.id)}
                    onChange={() => toggleSelect(e.id)}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                  />
                  <div>
                    <div className="font-bold text-slate-900">{e.agent?.user?.name || 'Agent'}</div>
                    <div className="text-slate-500 text-[11px]">
                      Order #{e.order?.orderNumber} • Base: ₹{e.basePayout} + Distance: ₹{e.distanceIncentive} + SLA Bonus: ₹{e.deliveryBonus}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-mono font-extrabold text-slate-900 text-sm">₹{e.totalEarning}</span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      e.settlementStatus === 'PAID'
                        ? 'bg-emerald-100 text-emerald-700'
                        : e.settlementStatus === 'APPROVED'
                        ? 'bg-sky-100 text-sky-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {e.settlementStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
