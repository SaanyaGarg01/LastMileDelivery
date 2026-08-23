import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import { CheckCircle2, AlertTriangle, Package, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AgentHistoryPage() {
  const { user } = useAuth();
  const agentId = user?.agentProfile?.id;

  const [deliveries, setDeliveries] = useState({
    completedDeliveries: [],
    failedDeliveries: [],
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    if (agentId) {
      fetchHistory();
    }
  }, [agentId]);

  const fetchHistory = async () => {
    try {
      const res = await api.get(`/agents/${agentId}/deliveries`);
      if (res.data.success) {
        setDeliveries(res.data);
      }
    } catch (err) {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const allHistory = [
    ...deliveries.completedDeliveries,
    ...deliveries.failedDeliveries,
  ].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const filteredHistory = allHistory.filter((item) => {
    if (filter === 'COMPLETED') return item.status === 'DELIVERED';
    if (filter === 'FAILED') return item.status === 'FAILED';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Delivery History</h1>
          <p className="text-xs text-slate-500">View all your completed and failed delivery attempts</p>
        </div>

        <div className="flex gap-2">
          {['ALL', 'COMPLETED', 'FAILED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === f
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs animate-pulse">Loading history...</div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No delivery history records found.</div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {filteredHistory.map((o) => (
              <div key={o.id} className="p-4 hover:bg-slate-50 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-sky-700">{o.orderNumber}</span>
                    <StatusBadge status={o.status} />
                  </div>
                  <p className="text-slate-600 font-medium">
                    {o.pickupAddress} <span className="font-mono text-slate-400">➔</span> {o.dropAddress}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="font-mono text-slate-500 block">{new Date(o.updatedAt).toLocaleDateString()}</span>
                    <span className="font-bold text-slate-900">₹{o.totalAmount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
