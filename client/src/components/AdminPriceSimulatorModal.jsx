import React, { useState } from 'react';
import api from '../api/axios';
import PriceBreakdownCard from './PriceBreakdownCard';
import { Calculator, X, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPriceSimulatorModal({ onClose }) {
  const [pickupPincode, setPickupPincode] = useState('110001');
  const [dropPincode, setDropPincode] = useState('201301');
  const [length, setLength] = useState(40);
  const [breadth, setBreadth] = useState(30);
  const [height, setHeight] = useState(20);
  const [actualWeight, setActualWeight] = useState(8);
  const [orderType, setOrderType] = useState('B2C');
  const [paymentType, setPaymentType] = useState('COD');

  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/orders/preview-price', {
        pickupPincode,
        dropPincode,
        length: Number(length),
        breadth: Number(breadth),
        height: Number(height),
        actualWeight: Number(actualWeight),
        orderType,
        paymentType,
      });

      if (res.data.success) {
        setPricing(res.data.pricing);
        toast.success('Rate calculated via live pricing engine');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Price calculation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-sky-600" /> Admin Rate Calculator & Pricing Simulator
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Simulate rates directly against the active database rate card rules and pricing engine service.
        </p>

        <form onSubmit={handleSimulate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pickup Pincode</label>
            <input
              type="text"
              value={pickupPincode}
              onChange={(e) => setPickupPincode(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Drop Pincode</label>
            <input
              type="text"
              value={dropPincode}
              onChange={(e) => setDropPincode(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500">L (cm)</label>
              <input
                type="number"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500">B (cm)</label>
              <input
                type="number"
                value={breadth}
                onChange={(e) => setBreadth(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500">H (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Actual Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              value={actualWeight}
              onChange={(e) => setActualWeight(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Order Type</label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
            >
              <option value="B2C">B2C Retail</option>
              <option value="B2B">B2B Corporate</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
            >
              <option value="PREPAID">PREPAID</option>
              <option value="COD">COD Cash</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
            >
              <Sparkles className="w-4 h-4" /> {loading ? 'Calculating...' : 'Run Pricing Engine Simulation'}
            </button>
          </div>
        </form>

        {pricing && (
          <div className="pt-2">
            <PriceBreakdownCard pricing={pricing} loading={false} />
          </div>
        )}
      </div>
    </div>
  );
}
