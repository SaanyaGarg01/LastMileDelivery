import React, { useState } from 'react';
import { Weight, Box, MapPin, CreditCard, ShieldCheck, Tag, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function PriceBreakdownCard({ pricing, loading = false, onConfirm, showConfirmButton = false }) {
  const [showExplanation, setShowExplanation] = useState(false);

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-white border border-slate-200 animate-pulse space-y-4 shadow-sm">
        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
        <div className="h-8 bg-slate-200 rounded w-2/3"></div>
        <div className="space-y-2 pt-4">
          <div className="h-3 bg-slate-200 rounded w-full"></div>
          <div className="h-3 bg-slate-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (!pricing) {
    return (
      <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center text-slate-500 text-xs shadow-sm">
        Fill package dimensions and pincodes to calculate price preview.
      </div>
    );
  }

  const {
    actualWeight,
    volumetricWeight,
    chargeableWeight,
    pickupZone,
    dropZone,
    zoneType,
    orderType,
    paymentType,
    deliveryCharge,
    codSurcharge,
    totalAmount,
  } = pricing;

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <Tag className="w-4 h-4 text-sky-600" /> PRICE BREAKDOWN
        </h3>
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
          zoneType === 'INTRA' 
            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
        }`}>
          {zoneType}-ZONE ({orderType})
        </span>
      </div>

      {/* Weight math grid */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] font-medium text-slate-500 block flex items-center gap-1">
            <Weight className="w-3 h-3 text-slate-400" /> Actual
          </span>
          <span className="text-xs font-bold text-slate-900">{actualWeight} kg</span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] font-medium text-slate-500 block flex items-center gap-1">
            <Box className="w-3 h-3 text-slate-400" /> Volumetric
          </span>
          <span className="text-xs font-bold text-slate-900">{volumetricWeight} kg</span>
        </div>

        <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200">
          <span className="text-[10px] font-bold text-sky-800 block">
            Chargeable
          </span>
          <span className="text-sm font-extrabold text-sky-900">{chargeableWeight} kg</span>
        </div>
      </div>

      {/* Zone detection */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-slate-500">Pickup Zone:</span>
          <span className="text-slate-900 font-bold">{pickupZone?.name || pickupZone?.code}</span>
        </div>

        <span className="text-slate-400 font-mono">➔</span>

        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-sky-600" />
          <span className="text-slate-500">Drop Zone:</span>
          <span className="text-slate-900 font-bold">{dropZone?.name || dropZone?.code}</span>
        </div>
      </div>

      {/* Price Itemization */}
      <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
        <div className="flex justify-between text-slate-600">
          <span>Base Delivery Charge</span>
          <span className="font-semibold text-slate-900">₹{deliveryCharge.toFixed(2)}</span>
        </div>

        {paymentType === 'COD' && (
          <div className="flex justify-between text-amber-700">
            <span className="flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-amber-600" /> COD Processing Surcharge
            </span>
            <span className="font-semibold">₹{codSurcharge.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
          <span>TOTAL</span>
          <span className="text-sky-700 text-lg">₹{totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* "How is this calculated?" Expandable Accordion */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowExplanation(!showExplanation)}
          className="w-full flex items-center justify-between text-xs font-bold text-sky-700 hover:text-sky-800 bg-sky-50 px-3 py-2 rounded-xl border border-sky-100 transition-all"
        >
          <span className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" /> How is this calculated?
          </span>
          {showExplanation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showExplanation && (
          <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1.5 animate-in fade-in">
            <p><strong>1. Volumetric Formula:</strong> L × B × H / 5000 = {volumetricWeight} kg</p>
            <p><strong>2. Chargeable Weight:</strong> max({actualWeight} kg actual, {volumetricWeight} kg volumetric) = {chargeableWeight} kg</p>
            <p><strong>3. Rate Card Applied:</strong> {orderType} {zoneType}-Zone rate card</p>
            {paymentType === 'COD' && <p><strong>4. COD Surcharge:</strong> ₹{codSurcharge} added for cash processing on delivery.</p>}
          </div>
        )}
      </div>

      {showConfirmButton && onConfirm && (
        <button
          onClick={onConfirm}
          className="w-full mt-4 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-extrabold shadow-md shadow-sky-600/20 transition-all flex items-center justify-center gap-2 text-sm"
        >
          <ShieldCheck className="w-5 h-5" /> Confirm & Place Order (₹{totalAmount.toFixed(2)})
        </button>
      )}
    </div>
  );
}
