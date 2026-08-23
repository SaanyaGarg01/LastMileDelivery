import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Calculator, CheckCircle2, DollarSign, Package, Route, X, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RateExplainerModal({ orderId, isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchRateExplanation();
    }
  }, [isOpen, orderId]);

  const fetchRateExplanation = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/orders/${orderId}/rate-explanation`);
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      toast.error('Could not load rate calculation explainer');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-sky-600" /> HOW WAS THIS PRICE CALCULATED?
            </h2>
            <p className="text-xs text-slate-400">Order #{data?.orderNumber || orderId} • Rate Engine Breakdown</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-6 text-center text-xs text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin text-sky-600 mx-auto mb-2" /> Decomposing volumetric formula and rate card rules...
          </div>
        ) : (
          data && (
            <div className="space-y-4 text-xs">
              {/* Package Dimensions Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                  <Package className="w-4 h-4 text-sky-600" /> PACKAGE DIMENSIONS & WEIGHT
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>Actual Weight: <span className="font-bold text-slate-900">{data.packageDimensions.actualWeight} kg</span></div>
                  <div>Volumetric: <span className="font-bold text-slate-900">{data.packageDimensions.volumetricWeight} kg</span></div>
                </div>
                <div className="text-[11px] font-mono bg-white p-2 rounded-xl border border-slate-200 text-slate-700">
                  Formula: {data.packageDimensions.volumetricFormula}
                </div>
                <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                  ✓ {data.packageDimensions.comparisonExplanation}
                </div>
              </div>

              {/* Zone Route Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                  <Route className="w-4 h-4 text-sky-600" /> ZONE & ROUTE EVALUATION
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span>{data.zoneRoute.pickupZoneName} ➔ {data.zoneRoute.dropZoneName}</span>
                  <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-extrabold text-[10px]">{data.zoneRoute.routeType}-ZONE</span>
                </div>
              </div>

              {/* Pricing Summary */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                <div className="font-extrabold uppercase tracking-wider text-[11px] text-amber-400 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-amber-400" /> FINAL BREAKDOWN
                </div>
                <div className="space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span>Base Delivery Charge ({data.pricingBreakdown.orderType}):</span>
                    <span className="font-mono font-bold">₹{data.pricingBreakdown.baseDeliveryCharge.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>COD Surcharge ({data.pricingBreakdown.paymentType}):</span>
                    <span className="font-mono font-bold">₹{data.pricingBreakdown.codSurcharge.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-800 font-extrabold text-sm text-white">
                    <span>Total Amount Payable:</span>
                    <span className="font-mono text-emerald-400">₹{data.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
