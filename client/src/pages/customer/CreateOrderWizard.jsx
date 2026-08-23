import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import RateExplainerModal from '../../components/RateExplainerModal';
import { ItemImage, getAutoIcon } from '../../utils/itemIcons';
import {
  Package, MapPin, Box, DollarSign, CheckCircle2,
  ArrowRight, ArrowLeft, Upload, Trash2, Plus, AlertCircle,
  RefreshCw, Check, Calculator, ShieldCheck, Truck, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

const ITEM_CATEGORIES = [
  'Electronics', 'Clothing', 'Documents', 'Food & Pantry',
  'Gifts & Toys', 'Personal Care', 'Fragile Goods', 'Other'
];

export default function CreateOrderWizard() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Package Items
  const [items, setItems] = useState([]);
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('Electronics');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [declaredValue, setDeclaredValue] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [isFragile, setIsFragile] = useState(false);
  const [handleWithCare, setHandleWithCare] = useState(false);
  const [keepUpright, setKeepUpright] = useState(false);
  const [itemImage, setItemImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Step 2 & 3: Addresses
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupPincode, setPickupPincode] = useState('110001');
  const [dropAddress, setDropAddress] = useState('');
  const [dropPincode, setDropPincode] = useState('400001');

  // Step 4: Dimensions & Weight
  const [length, setLength] = useState(30);
  const [breadth, setBreadth] = useState(20);
  const [height, setHeight] = useState(15);
  const [actualWeight, setActualWeight] = useState(3.2);

  // Step 5: Serviceability, Rate & Payment
  const [orderType, setOrderType] = useState('B2C');
  const [paymentType, setPaymentType] = useState('COD');
  const [pricePreview, setPricePreview] = useState(null);
  const [checkingPrice, setCheckingPrice] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);

  // Step 6: Dispatch Animation state
  const [dispatching, setDispatching] = useState(false);
  const [dispatchStepIdx, setDispatchStepIdx] = useState(0);
  const [createdOrder, setCreatedOrder] = useState(null);

  useEffect(() => {
    fetchSavedAddresses();
  }, []);

  const fetchSavedAddresses = async () => {
    try {
      const res = await api.get('/customer/addresses');
      if (res.data.success) {
        setSavedAddresses(res.data.addresses || []);
        const defaultAddr = (res.data.addresses || []).find((a) => a.isDefault);
        if (defaultAddr) {
          setPickupAddress(defaultAddr.addressLine);
          setPickupPincode(defaultAddr.pincode);
        }
      }
    } catch {
      // Non-blocking
    }
  };

  // Image Upload Handler
  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be under 5MB');
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await api.post('/customer/upload-item-image', { imageBase64: reader.result });
        if (res.data.success) {
          setItemImage(res.data.imageUrl);
          toast.success('Item photo uploaded successfully');
        }
      } catch {
        toast.error('Failed to process image upload');
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Add Item
  const handleAddItem = (e) => {
    e.preventDefault();
    if (!itemName.trim() || !declaredValue) {
      toast.error('Please enter item name and declared value');
      return;
    }

    const newItem = {
      id: `item-${Date.now()}`,
      name: itemName.trim(),
      category: itemCategory,
      quantity: parseInt(itemQuantity) || 1,
      declaredValue: parseFloat(declaredValue),
      description: itemDescription.trim(),
      imageUrl: itemImage,
      isFragile,
      handleWithCare,
      keepUpright,
    };

    setItems([...items, newItem]);
    // Reset item form
    setItemName('');
    setDeclaredValue('');
    setItemDescription('');
    setItemImage(null);
    setIsFragile(false);
    setHandleWithCare(false);
    setKeepUpright(false);
    toast.success('Item added to package!');
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter((it) => it.id !== id));
  };

  const totalDeclaredValue = items.reduce((sum, it) => sum + (it.declaredValue * it.quantity), 0);

  // Volumetric Calculation
  const volumetricWeight = ((parseFloat(length) || 0) * (parseFloat(breadth) || 0) * (parseFloat(height) || 0)) / 5000;

  // Price Calculation Trigger
  const handleCalculatePrice = async () => {
    setCheckingPrice(true);
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
        setPricePreview(res.data.pricing);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Price preview calculation failed');
    } finally {
      setCheckingPrice(false);
    }
  };

  // Step 5 Continue -> Trigger Price preview
  const goToStep5 = () => {
    handleCalculatePrice();
    setCurrentStep(5);
  };

  // Dispatch Animation & Order Creation
  const handleConfirmShipment = async () => {
    setDispatching(true);
    setDispatchStepIdx(0);

    const dispatchSteps = [
      'Validating shipment parameters...',
      'Detecting pickup & drop logistics zones...',
      'Calculating dynamic rate cards & volumetric weight...',
      'Finding available nearby fleet agents...',
      'Optimizing multi-factor assignment score...',
      'Calculating promised SLA deadline...',
      'Dispatching shipment to live fleet network...',
    ];

    for (let i = 0; i < dispatchSteps.length; i++) {
      setDispatchStepIdx(i);
      await new Promise((r) => setTimeout(r, 450));
    }

    try {
      const payload = {
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
        items: items.map(({ name, category, quantity, declaredValue, description, imageUrl, isFragile, handleWithCare, keepUpright }) => ({
          name,
          category,
          quantity: Number(quantity) || 1,
          declaredValue: Number(declaredValue),
          description: description || undefined,
          imageUrl: imageUrl || undefined,
          isFragile: Boolean(isFragile),
          handleWithCare: Boolean(handleWithCare),
          keepUpright: Boolean(keepUpright),
        })),
      };

      const res = await api.post('/orders', payload);
      if (res.data.success) {
        setCreatedOrder(res.data.order);
        toast.success(`Shipment #${res.data.order.orderNumber} Dispatched!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
      setDispatching(false);
    }
  };

  // 6 Steps Steps Bar
  const stepsList = [
    { num: 1, name: 'Package' },
    { num: 2, name: 'Pickup' },
    { num: 3, name: 'Delivery' },
    { num: 4, name: 'Details' },
    { num: 5, name: 'Price' },
    { num: 6, name: 'Confirm' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Step Progress Bar (Modules 2-7 Reference) */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">CREATE SHIPMENT</h1>
            <p className="text-xs text-slate-400">Step {currentStep} of 6 — {stepsList[currentStep - 1].name}</p>
          </div>
          <span className="text-xs font-mono font-extrabold text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
            {Math.round((currentStep / 6) * 100)}% COMPLETE
          </span>
        </div>

        {/* Step Nodes Line */}
        <div className="relative flex items-center justify-between">
          <div className="absolute top-3 left-0 right-0 h-1 bg-slate-200 z-0" />
          <div
            className="absolute top-3 left-0 h-1 bg-sky-600 z-0 transition-all duration-300"
            style={{ width: `${((currentStep - 1) / 5) * 100}%` }}
          />

          {stepsList.map((step) => {
            const isCompleted = step.num < currentStep;
            const isCurrent = step.num === currentStep;
            return (
              <div key={step.num} className="relative z-10 flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => step.num < currentStep && setCurrentStep(step.num)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isCurrent
                      ? 'bg-sky-600 text-white ring-4 ring-sky-100 scale-110 shadow-md'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isCompleted ? '✓' : step.num}
                </button>
                <span className={`text-[11px] font-bold mt-1.5 ${isCurrent ? 'text-sky-700' : isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>


      {/* STEP 1: PACKAGE / WHAT'S INSIDE — split-panel layout matching reference section 3 */}
      {currentStep === 1 && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-sky-600" /> Package / What's Inside
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Add all items you want to ship in this package</p>
          </div>

          {/* SPLIT PANEL */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-5">

            {/* LEFT: Add Item Form */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Add Items</h3>
              <form onSubmit={handleAddItem} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Item Name *</label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g. Wireless Headphones"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Category</label>
                    <select
                      value={itemCategory}
                      onChange={(e) => setItemCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-300"
                    >
                      {ITEM_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Quantity</label>
                    <input
                      type="number" min="1" value={itemQuantity}
                      onChange={(e) => setItemQuantity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Declared Value (₹) *</label>
                  <input
                    type="number" value={declaredValue}
                    onChange={(e) => setDeclaredValue(e.target.value)}
                    placeholder="e.g. 8999"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-bold font-mono focus:outline-none focus:ring-2 focus:ring-sky-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Description (optional)</label>
                  <input
                    type="text" value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    placeholder="e.g. Black noise-cancelling headphones"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-300"
                  />
                </div>

                {/* Photo upload + auto icon */}
                <div className="flex items-center gap-3 pt-1">
                  {/* Live auto-icon preview */}
                  <div className="relative shrink-0">
                    {uploadingImage ? (
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border-2 border-dashed border-sky-300 flex items-center justify-center">
                        <RefreshCw className="w-4 h-4 animate-spin text-sky-500" />
                      </div>
                    ) : itemImage ? (
                      <img src={itemImage} alt="preview" className="w-12 h-12 rounded-xl object-cover border-2 border-sky-400 shadow" />
                    ) : (
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border-2 border-dashed border-slate-200 ${getAutoIcon(itemName, itemCategory).bg}`}>
                        {getAutoIcon(itemName, itemCategory).emoji}
                      </div>
                    )}
                    {!itemImage && (
                      <span className="absolute -top-1.5 -right-1.5 text-[8px] font-extrabold bg-sky-600 text-white px-1 py-0.5 rounded-full leading-none">AUTO</span>
                    )}
                  </div>

                  <label className="flex-1 cursor-pointer px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 font-bold text-slate-700 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-sky-600" />
                    {uploadingImage ? 'Uploading...' : itemImage ? 'Change Photo ✓' : 'Upload Photo'}
                    <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                  </label>

                  {itemImage && (
                    <button type="button" onClick={() => setItemImage(null)} className="text-xs text-rose-600 font-bold hover:underline">
                      Remove
                    </button>
                  )}
                </div>

                {/* Handling checkboxes */}
                <div className="flex items-center gap-4 font-bold text-slate-700 flex-wrap">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={isFragile} onChange={e => setIsFragile(e.target.checked)} className="rounded text-sky-600" />
                    <span>⚠ Fragile</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={handleWithCare} onChange={e => setHandleWithCare(e.target.checked)} className="rounded text-sky-600" />
                    <span>Handle with care</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={keepUpright} onChange={e => setKeepUpright(e.target.checked)} className="rounded text-sky-600" />
                    <span>Keep upright</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 mt-2"
                >
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </form>
            </div>

            {/* RIGHT: Items in this shipment */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Items in this shipment
                  {items.length > 0 && <span className="ml-2 text-sky-600">({items.length})</span>}
                </h3>
                {items.length > 0 && (
                  <span className="text-xs font-bold text-emerald-700">
                    Total: ₹{totalDeclaredValue.toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              {items.length === 0 ? (
                <div className="h-48 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
                  <Package className="w-8 h-8 text-slate-300" />
                  <p>No items added yet</p>
                  <p className="text-[11px] text-slate-300">Items you add will appear here</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                  {items.map((it) => (
                    <div key={it.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 group">
                      <ItemImage item={it} size="lg" className="shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-slate-900 text-sm truncate">{it.name}</p>
                        <div className="flex flex-wrap gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-500">Qty: <strong>{it.quantity}</strong></span>
                          <span className="text-[11px] font-mono font-bold text-slate-700">₹{Number(it.declaredValue).toLocaleString('en-IN')}</span>
                          {it.isFragile && (
                            <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">🔴 Fragile</span>
                          )}
                          {it.handleWithCare && (
                            <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Handle with care</span>
                          )}
                        </div>
                        {it.description && (
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate">{it.description}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(it.id)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {/* Total declared value summary */}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-xs font-bold text-slate-700">
                    <span>Total Declared Value</span>
                    <span className="font-mono text-base text-slate-900">₹{totalDeclaredValue.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                if (items.length === 0) { toast.error('Please add at least one item'); return; }
                setCurrentStep(2);
              }}
              className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}



      {/* STEP 2: PICKUP ADDRESS (Module 4 Reference) */}
      {currentStep === 2 && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="space-y-1 border-b border-slate-100 pb-3">
            <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-sky-600" /> PICKUP ADDRESS
            </h2>
            <p className="text-xs text-slate-500">Select a saved address or enter a new pickup origin location.</p>
          </div>

          {savedAddresses.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">SAVED ADDRESSES</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {savedAddresses.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setPickupAddress(a.addressLine);
                      setPickupPincode(a.pincode);
                      toast.success(`Selected ${a.label} as pickup address`);
                    }}
                    className={`p-3.5 rounded-2xl border text-left text-xs transition-all ${
                      pickupAddress === a.addressLine ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-100' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-extrabold text-slate-900 block">{a.label}</span>
                    <span className="text-slate-500 text-[11px] block truncate">{a.addressLine}</span>
                    <span className="text-[10px] font-mono text-sky-700 font-bold block mt-1">{a.pincode}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4 text-xs pt-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Pickup Address *</label>
              <textarea
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="Full pickup street address, building, floor..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-300 resize-none font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Pickup Pincode *</label>
              <input
                type="text"
                value={pickupPincode}
                onChange={(e) => setPickupPincode(e.target.value)}
                placeholder="6-digit pincode (e.g. 110001)"
                className="w-full sm:w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-300"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              onClick={() => {
                if (!pickupAddress.trim() || !pickupPincode.trim()) {
                  toast.error('Please enter pickup address and pincode');
                  return;
                }
                setCurrentStep(3);
              }}
              className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2"
            >
              Continue to Delivery <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: DELIVERY ADDRESS (Module 4 Reference) */}
      {currentStep === 3 && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="space-y-1 border-b border-slate-100 pb-3">
            <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" /> DELIVERY ADDRESS
            </h2>
            <p className="text-xs text-slate-500">Enter recipient address and destination pincode.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Destination Address *</label>
              <textarea
                value={dropAddress}
                onChange={(e) => setDropAddress(e.target.value)}
                placeholder="Full delivery street address, recipient name, phone..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-300 resize-none font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Destination Pincode *</label>
              <input
                type="text"
                value={dropPincode}
                onChange={(e) => setDropPincode(e.target.value)}
                placeholder="6-digit pincode (e.g. 400001)"
                className="w-full sm:w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-300"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              onClick={() => {
                if (!dropAddress.trim() || !dropPincode.trim()) {
                  toast.error('Please enter delivery address and pincode');
                  return;
                }
                setCurrentStep(4);
              }}
              className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2"
            >
              Continue to Dimensions <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: PACKAGE DIMENSIONS + WEIGHT (Module 4 Reference) */}
      {currentStep === 4 && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="space-y-1 border-b border-slate-100 pb-3">
            <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Box className="w-5 h-5 text-purple-600" /> PACKAGE DIMENSIONS & WEIGHT
            </h2>
            <p className="text-xs text-slate-500">Provide length, breadth, height, and actual weight. Volumetric weight is calculated automatically.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Length (cm) *</label>
              <input
                type="number"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Breadth (cm) *</label>
              <input
                type="number"
                value={breadth}
                onChange={(e) => setBreadth(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Height (cm) *</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Actual Weight (kg) *</label>
              <input
                type="number"
                step="0.1"
                value={actualWeight}
                onChange={(e) => setActualWeight(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold"
              />
            </div>
          </div>

          {/* Volumetric Weight Formula Readout */}
          <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-1 text-xs">
            <span className="font-extrabold text-purple-900 uppercase tracking-wider block">VOLUMETRIC WEIGHT CALCULATION</span>
            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              <span className="font-mono text-slate-700 font-bold">
                Formula: ({length || 0} × {breadth || 0} × {height || 0}) ÷ 5000 = <strong className="text-purple-900">{volumetricWeight.toFixed(2)} kg</strong>
              </span>
              <span className="font-extrabold text-purple-900 bg-white px-3 py-1 rounded-xl border border-purple-200">
                Billable Weight: {Math.max(parseFloat(actualWeight) || 0, volumetricWeight).toFixed(2)} kg
              </span>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              onClick={goToStep5}
              className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2"
            >
              Continue to Price Preview <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: SERVICEABILITY & PRICE PREVIEW (Modules 5, 6, 7 Reference) */}
      {currentStep === 5 && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="space-y-1 border-b border-slate-100 pb-3">
            <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" /> SERVICEABILITY & PRICE PREVIEW
            </h2>
            <p className="text-xs text-slate-500">Backend zone detection and dynamic rate card breakdown.</p>
          </div>

          {/* Serviceability Banner (Module 5 Reference) */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-extrabold text-sm text-emerald-950">✓ DELIVERY AVAILABLE</h4>
                <p className="text-xs text-emerald-700">Route: {pricePreview?.zoneType || 'INTRA'}-ZONE • Pickup Zone: {pricePreview?.pickupZone?.name || pickupPincode} ➔ Drop Zone: {pricePreview?.dropZone?.name || dropPincode}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-white px-3 py-1 rounded-xl border border-emerald-200">
              Est: 1–2 Days
            </span>
          </div>

          {/* B2B/B2C and Prepaid/COD Toggles (Modules 7, 8 Reference) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-extrabold text-slate-700 uppercase tracking-wider block">ORDER TYPE</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setOrderType('B2C'); handleCalculatePrice(); }}
                  className={`py-2 rounded-xl font-extrabold transition-all ${orderType === 'B2C' ? 'bg-sky-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200'}`}
                >
                  B2C (Retail)
                </button>
                <button
                  type="button"
                  onClick={() => { setOrderType('B2B'); handleCalculatePrice(); }}
                  className={`py-2 rounded-xl font-extrabold transition-all ${orderType === 'B2B' ? 'bg-purple-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200'}`}
                >
                  B2B (Enterprise)
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-extrabold text-slate-700 uppercase tracking-wider block">PAYMENT MODE</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setPaymentType('PREPAID'); handleCalculatePrice(); }}
                  className={`py-2 rounded-xl font-extrabold transition-all ${paymentType === 'PREPAID' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200'}`}
                >
                  PREPAID
                </button>
                <button
                  type="button"
                  onClick={() => { setPaymentType('COD'); handleCalculatePrice(); }}
                  className={`py-2 rounded-xl font-extrabold transition-all ${paymentType === 'COD' ? 'bg-amber-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200'}`}
                >
                  COD (Cash)
                </button>
              </div>
            </div>
          </div>

          {/* Price Calculation Card (Module 6 Reference) */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-xl space-y-4 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">ESTIMATED PRICE BREAKDOWN</span>
              {checkingPrice && <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Base Delivery Rate</span>
                <span className="font-mono font-bold">₹{pricePreview?.deliveryCharge || 0}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Inter-Zone Route Charge</span>
                <span className="font-mono font-bold">₹{pricePreview?.zoneType === 'INTER' ? 30 : 0}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>COD Payment Surcharge</span>
                <span className="font-mono font-bold">₹{pricePreview?.codSurcharge || 0}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm">
                <span className="font-extrabold">TOTAL AMOUNT PAYABLE</span>
                <span className="font-mono font-extrabold text-emerald-400 text-lg">₹{pricePreview?.totalAmount || 0}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowRateModal(true)}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-xs transition-all flex items-center justify-center gap-1.5 border border-slate-700"
            >
              <Calculator className="w-3.5 h-3.5" /> HOW WAS THIS CALCULATED?
            </button>
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(6)}
              className="px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2"
            >
              Review & Confirm <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: CONFIRMATION & DISPATCH ANIMATION (Module 7 Reference) */}
      {currentStep === 6 && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          {!dispatching && !createdOrder ? (
            <>
              <div className="space-y-1 border-b border-slate-100 pb-3">
                <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" /> CONFIRM SHIPMENT
                </h2>
                <p className="text-xs text-slate-500">Review complete shipment parameters before dispatching.</p>
              </div>

              {/* Summary Review Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-extrabold text-slate-400 uppercase text-[10px]">PACKAGE</span>
                  <div className="font-bold text-slate-900">{items.length} items • {actualWeight} kg</div>
                  <div className="text-slate-500">{length} × {breadth} × {height} cm</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-extrabold text-slate-400 uppercase text-[10px]">ROUTE</span>
                  <div className="font-bold text-slate-900">{pickupAddress} ➔ {dropAddress}</div>
                  <div className="text-slate-500">Pincodes: {pickupPincode} ➔ {dropPincode}</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-extrabold text-slate-400 uppercase text-[10px]">ORDER TYPE</span>
                  <div className="font-bold text-slate-900">{orderType} • {paymentType}</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-extrabold text-slate-400 uppercase text-[10px]">FINAL PRICE</span>
                  <div className="font-extrabold text-emerald-700 text-sm font-mono">₹{pricePreview?.totalAmount || 150}</div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Edit Details
                </button>
                <button
                  type="button"
                  onClick={handleConfirmShipment}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl transition-all flex items-center gap-2 transform hover:scale-[1.02]"
                >
                  <Zap className="w-5 h-5" /> CONFIRM SHIPMENT
                </button>
              </div>
            </>
          ) : (
            /* Dispatch Animation (Module 7 Reference) */
            <div className="p-8 rounded-3xl bg-slate-900 text-white shadow-2xl space-y-6 text-center border border-slate-800">
              {!createdOrder ? (
                <div className="space-y-6 py-6">
                  <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-sky-500/20 border-t-sky-400 animate-spin" />
                    <Truck className="w-10 h-10 text-sky-400 absolute inset-0 m-auto animate-pulse" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-extrabold text-white">Processing your shipment...</h3>
                    <p className="text-xs text-sky-400 font-mono font-bold">
                      Step {dispatchStepIdx + 1} of 7 — {['Validating shipment', 'Detecting zones', 'Calculating price', 'Finding available agents', 'Optimizing assignment', 'Calculating ETA', 'Dispatching shipment'][dispatchStepIdx]}
                    </p>
                  </div>
                </div>
              ) : (
                /* Success Dispatched Screen */
                <div className="space-y-6 py-6 animate-in fade-in">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-2xl font-extrabold text-white tracking-tight">🚚 SHIPMENT DISPATCHED</h2>
                    <p className="text-xs text-slate-300 font-mono">Order Number: #{createdOrder.orderNumber}</p>
                  </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 max-w-sm mx-auto text-xs space-y-2">
                    <div className="flex justify-between text-slate-300">
                      <span>Assigned Agent:</span>
                      <strong className="text-white">{createdOrder?.assignedAgent?.user?.name || 'Fleet Agent (Auto-Assigned)'}</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Estimated Arrival:</span>
                      <strong className="text-emerald-400">18-25 minutes</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const targetId = createdOrder?.id || createdOrder?.orderNumber;
                      if (targetId) navigate(`/customer/orders/${targetId}`);
                      else navigate('/customer/shipments');
                    }}
                    className="px-8 py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs shadow-lg transition-all inline-flex items-center gap-2"
                  >
                    <Truck className="w-4 h-4" /> TRACK SHIPMENT LIVE
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )}

      {/* Rate Explainer Modal */}
      {pricePreview && (
        <RateExplainerModal
          isOpen={showRateModal}
          onClose={() => setShowRateModal(false)}
          customPricing={pricePreview}
        />
      )}
    </div>
  );
}
