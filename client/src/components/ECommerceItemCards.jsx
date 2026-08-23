import React from 'react';
import { Package, ShieldCheck, HelpCircle, AlertCircle, ArrowRight, RotateCcw, Truck, CheckCircle2, ChevronDown, Smartphone, Shirt, FileText, ShoppingBag } from 'lucide-react';

export default function ECommerceItemCards({ order, onReschedule, onCancel }) {
  // Use real order items from database if available, otherwise map sample items
  const dynamicItems = (order.items && order.items.length > 0)
    ? order.items.map((item, idx) => {
        const cat = (item.category || '').toLowerCase();
        const nameLower = (item.name || '').toLowerCase();
        let itemImage = '/images/earbuds.jpg';

        if (cat.includes('fashion') || cat.includes('apparel') || cat.includes('clothing') || nameLower.includes('hoodie') || nameLower.includes('shirt') || nameLower.includes('shoe')) {
          itemImage = '/images/hoodie.jpg';
        } else if (cat.includes('electronics') || nameLower.includes('bud') || nameLower.includes('headphone') || nameLower.includes('phone') || nameLower.includes('laptop')) {
          itemImage = '/images/earbuds.jpg';
        }

        return {
          id: item.id || `dyn-item-${idx}`,
          name: item.name || 'Shipment Package Item',
          color: item.category ? `Category: ${item.category}` : 'Verified Parcel Item',
          seller: order.orderType === 'B2B' ? 'Enterprise B2B Hub' : 'Verified Direct Merchant',
          price: `₹${(item.declaredValue || (order.totalAmount / order.items.length)).toLocaleString('en-IN')}`,
          quantity: item.quantity || 1,
          image: itemImage,
          category: item.category || 'General Cargo',
        };
      })
    : null;

  // Sample fallback products if order has no specified item array
  const isEarbuds = (order.orderNumber || '').includes('1002') || (order.id || '').charCodeAt(0) % 2 === 0;

  const fallbackItems = isEarbuds
    ? [
        {
          id: 'item-1',
          name: 'OnePlus Buds True Wireless Earbuds',
          color: 'Glacier White',
          seller: 'SuperCom Official Retailer',
          price: '₹4,499',
          quantity: 1,
          image: '/images/earbuds.jpg',
        },
      ]
    : [
        {
          id: 'item-1',
          name: 'Basic Premium Fleece Hoodie',
          color: 'Forest Green',
          size: 'M',
          seller: 'FastMile Fashion Hub',
          price: '₹2,499',
          quantity: 1,
          image: '/images/hoodie.jpg',
        },
        {
          id: 'item-2',
          name: 'Relaxed Athletic Shorts',
          color: 'Dark Gray',
          size: 'M',
          seller: 'FastMile Fashion Hub',
          price: '₹1,499',
          quantity: 1,
          image: '/images/hoodie.jpg',
        },
      ];

  const itemsToDisplay = dynamicItems || fallbackItems;

  // Horizontal step progress calculation
  const statusSteps = [
    { label: 'Ordered', status: 'CREATED', date: new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) },
    { label: 'Packed', status: 'ASSIGNED', date: 'Available' },
    { label: 'In Transit', status: 'IN_TRANSIT', date: 'En Route' },
    { label: 'Delivered', status: 'DELIVERED', date: order.slaStatus || 'Expected' },
  ];

  const currentStepIdx = ['CREATED', 'ASSIGNED', 'PICKED_UP'].includes(order.status)
    ? 1
    : ['IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(order.status)
    ? 2
    : order.status === 'DELIVERED'
    ? 3
    : 0;

  return (
    <div className="space-y-6">
      {/* Horizontal Package Status Bar */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Package Status ({itemsToDisplay.length}/{itemsToDisplay.length})</h3>
            <p className="text-xs text-slate-400">Standard Delivery • Guaranteed SLA</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {order.status.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Step Progress Line */}
        <div className="pt-3">
          <div className="relative flex items-center justify-between">
            {/* Background Line */}
            <div className="absolute top-2.5 left-0 right-0 h-1 bg-slate-200 z-0" />
            {/* Active Progress Line */}
            <div
              className="absolute top-2.5 left-0 h-1 bg-emerald-500 z-0 transition-all duration-500"
              style={{ width: `${(currentStepIdx / (statusSteps.length - 1)) * 100}%` }}
            />

            {statusSteps.map((step, idx) => {
              const isCompleted = idx <= currentStepIdx;
              return (
                <div key={idx} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isCompleted ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isCompleted ? '✓' : idx + 1}
                  </div>
                  <span className={`text-xs font-bold mt-2 ${isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{step.date}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Product Items List (Dynamic Items Display) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">PARCEL ITEMS IN THIS SHIPMENT</span>
          {dynamicItems && (
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
              ⚡ Live Input Items Verified
            </span>
          )}
        </div>

        {itemsToDisplay.map((item) => (
          <div key={item.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={item.image}
                alt={item.name}
                className="w-20 h-20 rounded-2xl object-cover border border-slate-100 bg-slate-50 shadow-xs"
              />
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-900 text-sm">{item.name}</h4>
                <p className="text-xs text-slate-500">
                  {item.color} {item.size ? `• Size: ${item.size}` : ''} • Qty: {item.quantity}
                </p>
                <p className="text-[11px] text-slate-400">Seller: {item.seller}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-extrabold text-slate-900 font-mono block">{item.price}</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Verified Item
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Safety & Customer Issue Banners */}
      <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-sky-600 text-white shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-xs text-sky-950">Your Safety & Parcel Protection First</h4>
            <p className="text-[11px] text-sky-700">All packages undergo tamper-evident sealing and OTP delivery verification.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => alert('Opening Safety Protocols & Verification Guidelines...')}
          className="text-sky-700 font-extrabold text-xs hover:underline shrink-0"
        >
          Details →
        </button>
      </div>

      {/* Customer Support & Issues Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">DELIVERY ISSUES & CUSTOMER HELP</span>
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-500" /> Have a delivery related issue?
            </span>
            <span className="text-slate-500 text-[11px] block">Support tickets resolved within 2 hours.</span>
          </div>
          <button
            type="button"
            onClick={() => alert('Support ticket desk active. Contact support via /customer/support')}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs"
          >
            Need Help?
          </button>
        </div>
      </div>
    </div>
  );
}
