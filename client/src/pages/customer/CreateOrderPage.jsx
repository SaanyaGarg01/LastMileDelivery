import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import PriceBreakdownCard from '../../components/PriceBreakdownCard';
import { Package, MapPin, Box, CreditCard, ShieldCheck, ArrowLeft, Check, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreateOrderPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  const [pickupAddress, setPickupAddress] = useState('Connaught Place, Block C');
  const [pickupPincode, setPickupPincode] = useState('110001');
  const [dropAddress, setDropAddress] = useState('Sector 18 Market');
  const [dropPincode, setDropPincode] = useState('201301');

  const [length, setLength] = useState(40);
  const [breadth, setBreadth] = useState(30);
  const [height, setHeight] = useState(20);
  const [actualWeight, setActualWeight] = useState(8);

  const [orderType, setOrderType] = useState('B2C');
  const [paymentType, setPaymentType] = useState('COD');

  const [pricing, setPricing] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [serviceability, setServiceability] = useState(null);
  const [checkingService, setCheckingService] = useState(false);

  useEffect(() => {
    if (pickupPincode && dropPincode && length > 0 && breadth > 0 && height > 0 && actualWeight > 0) {
      calculatePreview();
    }
  }, [pickupPincode, dropPincode, length, breadth, height, actualWeight, orderType, paymentType]);

  const handleCheckServiceability = async () => {
    setCheckingService(true);
    try {
      const res = await api.post('/serviceability/check', { pickupPincode, dropPincode });
      if (res.data.success) {
        setServiceability(res.data);
        if (res.data.isServiceable) {
          toast.success('✓ Both pincodes are serviceable!');
        } else {
          toast.error(res.data.message);
        }
      }
    } catch {
      toast.error('Serviceability check failed');
    } finally {
      setCheckingService(false);
    }
  };

  const calculatePreview = async () => {
    setCalcLoading(true);
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
      }
    } catch (err) {
      console.error(err);
      setPricing(null);
    } finally {
      setCalcLoading(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!pricing) {
      toast.error('Please complete all steps first');
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await api.post('/orders', {
        pickupAddress,
        pickupPincode,
        dropAddress,
        dropPincode,
        length: Number(length),
        breadth: Number(breadth),
        height: Number(height),
        actualWeight: Number(actualWeight),
        orderType,
        paymentType,
      });

      if (res.data.success) {
        toast.success(`Order ${res.data.order.orderNumber} placed & agent assigned!`);
        navigate(`/customer/orders/${res.data.order.id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setSubmitLoading(false);
    }
  };

  const steps = [
    { id: 1, label: 'Pickup & Drop' },
    { id: 2, label: 'Package' },
    { id: 3, label: 'Order & Payment' },
    { id: 4, label: 'Price Review' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/customer')}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 shadow-xs"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Create New Shipment Order</h1>
          <p className="text-xs text-slate-500">Configure shipment route, package dimensions, and rate preview</p>
        </div>
      </div>

      {/* Multi-Step Indicator Header */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
        {steps.map((step, idx) => {
          const isDone = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <React.Fragment key={step.id}>
              <div
                onClick={() => setCurrentStep(step.id)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-sky-600 text-white ring-4 ring-sky-100'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" /> : step.id}
                </div>
                <span className={`text-xs font-bold ${isCurrent ? 'text-sky-700' : 'text-slate-600'}`}>
                  {step.label}
                </span>
              </div>

              {idx < steps.length - 1 && (
                <div className="h-0.5 flex-1 bg-slate-200 mx-2 hidden sm:block" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Wizard Form Section */}
        <div className="lg:col-span-7 space-y-6">
          {/* STEP 1: PICKUP & DROP */}
          {currentStep === 1 && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-600" /> STEP 1 — PICKUP & DROP ADDRESSES
              </h2>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pickup Address</label>
                  <input
                    type="text"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pickup Pincode</label>
                  <input
                    type="text"
                    value={pickupPincode}
                    onChange={(e) => setPickupPincode(e.target.value)}
                    placeholder="110001 (Delhi)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-sky-700 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Drop Address</label>
                  <input
                    type="text"
                    value={dropAddress}
                    onChange={(e) => setDropAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Drop Pincode</label>
                  <input
                    type="text"
                    value={dropPincode}
                    onChange={(e) => setDropPincode(e.target.value)}
                    placeholder="201301 (Noida)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-sky-700 font-bold"
                    required
                  />
                </div>

                <div className="pt-2 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={handleCheckServiceability}
                    disabled={checkingService || !pickupPincode || !dropPincode}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all"
                  >
                    {checkingService ? 'Checking...' : '🔍 Check Serviceability'}
                  </button>

                  {serviceability && (
                    <span className={`text-xs font-bold ${serviceability.isServiceable ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {serviceability.isServiceable ? `✓ ${serviceability.routeType}-Zone Serviceable (${serviceability.estimatedDeliveryTime})` : '✗ Outside Service Network'}
                    </span>
                  )}
                </div>

                {/* Zone Resolution Preview */}
                {pricing && (
                  <div className="p-3 rounded-xl bg-sky-50 border border-sky-100 text-xs space-y-1">
                    <span className="font-bold text-sky-900 block">Detected Zone Route:</span>
                    <div className="text-slate-700 flex justify-between">
                      <span>Pickup Zone: <strong>{pricing.pickupZone?.name}</strong></span>
                      <span>Drop Zone: <strong>{pricing.dropZone?.name}</strong></span>
                      <span className="font-bold text-sky-700">{pricing.zoneType}-ZONE</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setCurrentStep(2)}
                  className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
                >
                  Next Step: Package Details <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PACKAGE DETAILS */}
          {currentStep === 2 && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Box className="w-4 h-4 text-purple-600" /> STEP 2 — PACKAGE DIMENSIONS & WEIGHT
              </h2>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Length (cm)</label>
                    <input
                      type="number"
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Breadth (cm)</label>
                    <input
                      type="number"
                      value={breadth}
                      onChange={(e) => setBreadth(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Height (cm)</label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Actual Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={actualWeight}
                    onChange={(e) => setActualWeight(e.target.value)}
                    className="w-full bg-slate-50 border border-sky-300 rounded-xl px-3 py-2 text-sky-900 font-bold"
                    required
                  />
                </div>

                {pricing && (
                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 space-y-1 text-slate-800">
                    <div className="flex justify-between font-mono">
                      <span>Volumetric Weight (L×B×H / 5000):</span>
                      <strong className="text-purple-900">{pricing.volumetricWeight} kg</strong>
                    </div>
                    <div className="flex justify-between font-bold text-purple-950 border-t border-purple-200/60 pt-1">
                      <span>Chargeable Weight max({actualWeight}, {pricing.volumetricWeight}):</span>
                      <span>{pricing.chargeableWeight} kg</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    Next Step: Order & Payment <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ORDER & PAYMENT */}
          {currentStep === 3 && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" /> STEP 3 — ORDER & PAYMENT CONFIGURATION
              </h2>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Order Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setOrderType('B2C')}
                      className={`py-2.5 rounded-xl text-xs font-extrabold border transition-all ${
                        orderType === 'B2C'
                          ? 'bg-sky-50 border-sky-500 text-sky-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      B2C Retail
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType('B2B')}
                      className={`py-2.5 rounded-xl text-xs font-extrabold border transition-all ${
                        orderType === 'B2B'
                          ? 'bg-purple-50 border-purple-500 text-purple-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      B2B Corporate
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Payment Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentType('PREPAID')}
                      className={`py-2.5 rounded-xl text-xs font-extrabold border transition-all ${
                        paymentType === 'PREPAID'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      Prepaid
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentType('COD')}
                      className={`py-2.5 rounded-xl text-xs font-extrabold border transition-all ${
                        paymentType === 'COD'
                          ? 'bg-amber-50 border-amber-500 text-amber-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      COD Cash
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setCurrentStep(4)}
                    className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    Proceed to Price Review <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PRICE REVIEW & CONFIRMATION */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <PriceBreakdownCard
                pricing={pricing}
                loading={calcLoading}
                showConfirmButton={true}
                onConfirm={handleConfirmOrder}
              />
              <button
                onClick={() => setCurrentStep(3)}
                className="w-full py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Back to Edit Configuration
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Pricing Preview Side Panel */}
        <div className="lg:col-span-5 space-y-4">
          <PriceBreakdownCard
            pricing={pricing}
            loading={calcLoading}
            showConfirmButton={currentStep === 4}
            onConfirm={handleConfirmOrder}
          />
        </div>
      </div>
    </div>
  );
}
