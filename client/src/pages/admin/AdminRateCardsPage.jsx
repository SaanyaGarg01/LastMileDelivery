import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import AdminPriceSimulatorModal from '../../components/AdminPriceSimulatorModal';
import { CreditCard, Plus, Edit3, X, Calculator } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminRateCardsPage() {
  const [rateCards, setRateCards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [orderType, setOrderType] = useState('B2C');
  const [zoneType, setZoneType] = useState('INTRA');
  const [weightFrom, setWeightFrom] = useState(0);
  const [weightTo, setWeightTo] = useState(1);
  const [rate, setRate] = useState(50);
  const [codSurcharge, setCodSurcharge] = useState(30);

  useEffect(() => {
    fetchRateCards();
  }, []);

  const fetchRateCards = async () => {
    try {
      const res = await api.get('/admin/rate-cards');
      if (res.data.success) {
        setRateCards(res.data.rateCards);
      }
    } catch (err) {
      toast.error('Failed to load rate cards');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const res = await api.patch(`/admin/rate-cards/${editingId}`, {
          orderType,
          zoneType,
          weightFrom: Number(weightFrom),
          weightTo: Number(weightTo),
          rate: Number(rate),
          codSurcharge: Number(codSurcharge),
        });
        if (res.data.success) toast.success('Rate card updated');
      } else {
        const res = await api.post('/admin/rate-cards', {
          orderType,
          zoneType,
          weightFrom: Number(weightFrom),
          weightTo: Number(weightTo),
          rate: Number(rate),
          codSurcharge: Number(codSurcharge),
        });
        if (res.data.success) toast.success('Rate card created');
      }
      setShowModal(false);
      resetForm();
      fetchRateCards();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setOrderType('B2C');
    setZoneType('INTRA');
    setWeightFrom(0);
    setWeightTo(1);
    setRate(50);
    setCodSurcharge(30);
  };

  const openEditModal = (card) => {
    setEditingId(card.id);
    setOrderType(card.orderType);
    setZoneType(card.zoneType);
    setWeightFrom(card.weightFrom);
    setWeightTo(card.weightTo);
    setRate(card.rate);
    setCodSurcharge(card.codSurcharge);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Dynamic Rate Card Engine</h1>
          <p className="text-xs text-slate-500">Configure B2B/B2C weight slab rates and COD surcharges dynamically</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowSimulator(true)}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
          >
            <Calculator className="w-4 h-4 text-sky-400" /> Rate Calculator & Simulator
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" /> Add Rate Slab
          </button>
        </div>
      </div>

      {/* Rate Cards Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs animate-pulse">Loading rate cards...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Order Type</th>
                  <th className="p-4">Zone Type</th>
                  <th className="p-4">Weight Slab (kg)</th>
                  <th className="p-4">Base Rate (₹)</th>
                  <th className="p-4">COD Surcharge (₹)</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {rateCards.map((card) => (
                  <tr key={card.id} className="hover:bg-slate-50/80">
                    <td className="p-4 font-bold text-slate-900">{card.orderType}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        card.zoneType === 'INTRA' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {card.zoneType}-ZONE
                      </span>
                    </td>
                    <td className="p-4 font-mono">{card.weightFrom} kg – {card.weightTo} kg</td>
                    <td className="p-4 font-bold text-sky-700">₹{card.rate}</td>
                    <td className="p-4 font-semibold text-amber-700">₹{card.codSurcharge}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                        ACTIVE
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => openEditModal(card)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Simulator Modal */}
      {showSimulator && <AdminPriceSimulatorModal onClose={() => setShowSimulator(false)} />}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingId ? 'Edit Rate Card Slab' : 'Create New Rate Card Slab'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Order Type</label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  >
                    <option value="B2C">B2C Retail</option>
                    <option value="B2B">B2B Corporate</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Zone Type</label>
                  <select
                    value={zoneType}
                    onChange={(e) => setZoneType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  >
                    <option value="INTRA">INTRA-ZONE</option>
                    <option value="INTER">INTER-ZONE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Weight From (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightFrom}
                    onChange={(e) => setWeightFrom(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Weight To (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightTo}
                    onChange={(e) => setWeightTo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-sky-700 mb-1">Base Rate (₹)</label>
                  <input
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="w-full bg-slate-50 border border-sky-300 rounded-xl px-3 py-2 text-sky-900 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-amber-700 mb-1">COD Surcharge (₹)</label>
                  <input
                    type="number"
                    value={codSurcharge}
                    onChange={(e) => setCodSurcharge(e.target.value)}
                    className="w-full bg-slate-50 border border-amber-300 rounded-xl px-3 py-2 text-amber-900 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold">
                  Save Rate Slab
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
