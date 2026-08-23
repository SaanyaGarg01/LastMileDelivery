import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { X, Search, UserPlus, CheckCircle2, Calculator, MapPin, Box, DollarSign, ArrowRight, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCreateOrderModal({ isOpen, onClose, onOrderCreated }) {
  const [step, setStep] = useState(1); // 1: Customer, 2: Details, 3: Pricing & Confirm
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // New Customer Form State
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [creatingCust, setCreatingCust] = useState(false);

  // Order Details Form State
  const [pickupAddress, setPickupAddress] = useState('123 MG Road, Connaught Place');
  const [pickupPincode, setPickupPincode] = useState('110001');
  const [dropAddress, setDropAddress] = useState('Sector 62, Noida Logistics Hub');
  const [dropPincode, setDropPincode] = useState('201301');

  const [length, setLength] = useState('30');
  const [breadth, setBreadth] = useState('20');
  const [height, setHeight] = useState('15');
  const [actualWeight, setActualWeight] = useState('3.5');
  const [orderType, setOrderType] = useState('B2C');
  const [paymentType, setPaymentType] = useState('PREPAID');

  // Items State
  const [itemName, setItemName] = useState('Laptop & Accessories');
  const [itemCategory, setItemCategory] = useState('ELECTRONICS');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [declaredValue, setDeclaredValue] = useState('45000');
  const [isFragile, setIsFragile] = useState(true);
  const [handleWithCare, setHandleWithCare] = useState(true);
  const [keepUpright, setKeepUpright] = useState(false);

  // Pricing preview
  const [pricing, setPricing] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && searchQuery.trim()) {
      handleSearchCustomers();
    }
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleSearchCustomers = async () => {
    setSearching(true);
    try {
      const res = await api.get('/admin/customers/search', { params: { q: searchQuery } });
      if (res.data.success) {
        setSearchResults(res.data.customers || []);
      }
    } catch {
      toast.error('Failed to search customers');
    } finally {
      setSearching(false);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustName || !newCustEmail || !newCustPhone) {
      toast.error('Please fill name, email and phone');
      return;
    }
    setCreatingCust(true);
    try {
      const res = await api.post('/admin/customers', {
        name: newCustName,
        email: newCustEmail,
        phone: newCustPhone,
      });
      if (res.data.success) {
        toast.success(`Registered customer ${res.data.user.name}`);
        setSelectedCustomer(res.data.user);
        setShowNewCustomer(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Customer registration failed');
    } finally {
      setCreatingCust(false);
    }
  };

  const calculateVolumetricWeight = () => {
    const l = parseFloat(length) || 0;
    const b = parseFloat(breadth) || 0;
    const h = parseFloat(height) || 0;
    return (l * b * h) / 5000;
  };

  const handleCalculatePrice = async () => {
    setCalculating(true);
    try {
      const res = await api.post('/orders/preview-price', {
        pickupPincode,
        dropPincode,
        length: parseFloat(length),
        breadth: parseFloat(breadth),
        height: parseFloat(height),
        actualWeight: parseFloat(actualWeight),
        orderType,
        paymentType,
      });
      if (res.data.success) {
        setPricing(res.data.pricing);
        setStep(3);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Price calculation failed');
    } finally {
      setCalculating(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!selectedCustomer) {
      toast.error('Please select a customer first');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        customerId: selectedCustomer.id,
        pickupAddress,
        pickupPincode,
        dropAddress,
        dropPincode,
        length: parseFloat(length),
        breadth: parseFloat(breadth),
        height: parseFloat(height),
        actualWeight: parseFloat(actualWeight),
        orderType,
        paymentType,
        items: [
          {
            name: itemName,
            category: itemCategory,
            quantity: Number(itemQuantity) || 1,
            declaredValue: Number(declaredValue) || 1000,
            isFragile,
            handleWithCare,
            keepUpright,
          },
        ],
      };

      const res = await api.post('/orders', payload);
      if (res.data.success) {
        toast.success(`Order #${res.data.order.orderNumber} created for ${selectedCustomer.name}!`);
        if (onOrderCreated) onOrderCreated(res.data.order);
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const volWeight = calculateVolumetricWeight();
  const billableWeight = Math.max(parseFloat(actualWeight) || 0, volWeight);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400 font-bold block">ADMIN ACTION</span>
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Box className="w-5 h-5 text-sky-400" /> Create Order on Behalf of Customer
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between text-xs font-bold">
          <span className={`px-3 py-1 rounded-full ${step === 1 ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
            1. Select Customer
          </span>
          <span className={`px-3 py-1 rounded-full ${step === 2 ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
            2. Shipment Details
          </span>
          <span className={`px-3 py-1 rounded-full ${step === 3 ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
            3. Price & Confirm
          </span>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* STEP 1: SELECT OR REGISTER CUSTOMER */}
          {step === 1 && (
            <div className="space-y-5">
              {!showNewCustomer ? (
                <>
                  <div className="space-y-2">
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                      Search Existing Customer (Name, Email, Phone, ID)
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Type customer name, email or phone..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-300 font-bold"
                      />
                    </div>
                  </div>

                  {/* Customer search results */}
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {searching ? (
                      <p className="text-xs text-slate-400 py-4 text-center">Searching customers...</p>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((cust) => (
                        <div
                          key={cust.id}
                          onClick={() => setSelectedCustomer(cust)}
                          className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between text-xs transition-all ${
                            selectedCustomer?.id === cust.id
                              ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-100'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div>
                            <div className="font-extrabold text-slate-900 flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-sky-600" /> {cust.name}
                            </div>
                            <div className="text-slate-500 text-[11px]">{cust.email} • {cust.phone || 'No Phone'}</div>
                          </div>
                          {selectedCustomer?.id === cust.id && (
                            <span className="text-sky-600 font-extrabold text-xs flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" /> Selected
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 py-4 text-center">No customers found. Try searching or create new customer.</p>
                    )}
                  </div>

                  <div className="pt-2 flex justify-between items-center border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowNewCustomer(true)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5"
                    >
                      <UserPlus className="w-4 h-4 text-emerald-600" /> + Register New Customer
                    </button>

                    <button
                      type="button"
                      disabled={!selectedCustomer}
                      onClick={() => setStep(2)}
                      className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
                    >
                      Continue to Details <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                /* Register new customer form */
                <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-emerald-600" /> Register Customer on the Fly
                  </h4>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      placeholder="e.g. Aarav Sharma"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      value={newCustEmail}
                      onChange={(e) => setNewCustEmail(e.target.value)}
                      placeholder="customer@example.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                    <input
                      type="text"
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold"
                    />
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setShowNewCustomer(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingCust}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md"
                    >
                      {creatingCust ? 'Registering...' : 'Register & Select Customer'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* STEP 2: SHIPMENT & PACKAGE DETAILS */}
          {step === 2 && (
            <div className="space-y-5 text-xs">
              {/* Pickup & Drop Addresses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="font-extrabold text-sky-700 uppercase tracking-wider block flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-sky-600" /> PICKUP ADDRESS
                  </span>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Pickup Address *</label>
                    <textarea
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      rows={2}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Pickup Pincode *</label>
                    <input
                      type="text"
                      value={pickupPincode}
                      onChange={(e) => setPickupPincode(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-900 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="font-extrabold text-emerald-700 uppercase tracking-wider block flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600" /> DROP ADDRESS
                  </span>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Delivery Address *</label>
                    <textarea
                      value={dropAddress}
                      onChange={(e) => setDropAddress(e.target.value)}
                      rows={2}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Destination Pincode *</label>
                    <input
                      type="text"
                      value={dropPincode}
                      onChange={(e) => setDropPincode(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-900 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Package Dimensions & Weight */}
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-3">
                <span className="font-extrabold text-purple-900 uppercase tracking-wider block flex items-center gap-1.5">
                  <Box className="w-4 h-4 text-purple-600" /> DIMENSIONS & WEIGHT
                </span>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">L (cm)</label>
                    <input type="number" value={length} onChange={(e) => setLength(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-mono font-bold" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">B (cm)</label>
                    <input type="number" value={breadth} onChange={(e) => setBreadth(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-mono font-bold" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">H (cm)</label>
                    <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-mono font-bold" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Actual (kg)</label>
                    <input type="number" step="0.1" value={actualWeight} onChange={(e) => setActualWeight(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-mono font-bold" />
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] pt-1 text-purple-900 font-bold border-t border-purple-200">
                  <span>Volumetric Weight: ({length || 0}×{breadth || 0}×{height || 0})/5000 = {volWeight.toFixed(2)} kg</span>
                  <span className="bg-white px-2.5 py-0.5 rounded-lg border border-purple-300 font-extrabold text-purple-900">
                    Billable Weight: {billableWeight.toFixed(2)} kg
                  </span>
                </div>
              </div>

              {/* Order Type & Payment */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Order Type</label>
                  <select value={orderType} onChange={(e) => setOrderType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900">
                    <option value="B2C">B2C (Retail)</option>
                    <option value="B2B">B2B (Enterprise)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900">
                    <option value="PREPAID">PREPAID</option>
                    <option value="COD">COD (Cash on Delivery)</option>
                  </select>
                </div>
              </div>

              {/* Item Specs */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-extrabold text-slate-700 uppercase tracking-wider block">ITEM SPECIFICATIONS</span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Item Description</label>
                    <input type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Declared Value (₹)</label>
                    <input type="number" value={declaredValue} onChange={(e) => setDeclaredValue(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-mono font-bold" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-1 font-bold text-slate-700">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={isFragile} onChange={(e) => setIsFragile(e.target.checked)} className="rounded text-sky-600" />
                    <span>Fragile</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={handleWithCare} onChange={(e) => setHandleWithCare(e.target.checked)} className="rounded text-sky-600" />
                    <span>Handle With Care</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={keepUpright} onChange={(e) => setKeepUpright(e.target.checked)} className="rounded text-sky-600" />
                    <span>Keep Upright</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-between pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setStep(1)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold">
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleCalculatePrice}
                  disabled={calculating}
                  className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold shadow-md flex items-center gap-1.5"
                >
                  {calculating ? 'Calculating...' : 'Calculate Price Breakdown'} <Calculator className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PRICE BREAKDOWN & CONFIRM */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <span className="font-extrabold text-slate-400 uppercase text-[10px]">SUMMARY REVIEW</span>
                <div className="grid grid-cols-2 gap-2 text-slate-800">
                  <div><strong>Customer:</strong> {selectedCustomer?.name}</div>
                  <div><strong>Order Type:</strong> {orderType} • {paymentType}</div>
                  <div><strong>Route:</strong> {pickupPincode} ➔ {dropPincode} ({pricing?.zoneType || 'INTRA'}-ZONE)</div>
                  <div><strong>Billable Wt:</strong> {billableWeight.toFixed(2)} kg</div>
                </div>
              </div>

              {/* Price Calculation Card */}
              <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest block">ADMIN PRICE BREAKDOWN</span>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Base Delivery Charge</span>
                    <span className="font-mono font-bold">₹{pricing?.deliveryCharge || 0}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Inter-Zone Route Surcharge</span>
                    <span className="font-mono font-bold">₹{pricing?.zoneType === 'INTER' ? 30 : 0}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>COD Payment Surcharge</span>
                    <span className="font-mono font-bold">₹{pricing?.codSurcharge || 0}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-base">
                    <span className="font-extrabold text-white">TOTAL PAYABLE AMOUNT</span>
                    <span className="font-mono font-extrabold text-emerald-400 text-xl">₹{pricing?.totalAmount || 0}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setStep(2)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">
                  Edit Details
                </button>
                <button
                  type="button"
                  onClick={handleConfirmOrder}
                  disabled={submitting}
                  className="px-8 py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl flex items-center gap-2"
                >
                  {submitting ? 'Creating Order...' : '✓ CONFIRM & CREATE ORDER'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
