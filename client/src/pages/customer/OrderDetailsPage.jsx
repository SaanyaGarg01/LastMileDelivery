import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';
import TrackingTimeline from '../../components/TrackingTimeline';
import RouteMapGraphic from '../../components/RouteMapGraphic';
import RateExplainerModal from '../../components/RateExplainerModal';
import QRTrackingModal from '../../components/QRTrackingModal';
import AssignmentExplanationPanel from '../../components/AssignmentExplanationPanel';
import ECommerceItemCards from '../../components/ECommerceItemCards';
import {
  ArrowLeft, MapPin, User, Phone, Mail, Truck, CalendarClock,
  RotateCcw, AlertTriangle, CheckCircle2, X, Package, Box,
  DollarSign, Activity, Navigation, RefreshCw, ChevronDown, ChevronUp,
  ShieldCheck, Clock, Zap, QrCode, Calculator, Share2, Star, MessageSquare,
  ShoppingBag, Undo2
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  CREATED: '#64748b', ASSIGNED: '#3b82f6', PICKED_UP: '#8b5cf6',
  IN_TRANSIT: '#f59e0b', OUT_FOR_DELIVERY: '#f97316', DELIVERED: '#10b981',
  FAILED: '#ef4444', RESCHEDULED: '#06b6d4',
};

const DELIVERY_SLOTS = [
  '9:00 AM – 12:00 PM (Morning)',
  '12:00 PM – 3:00 PM (Afternoon)',
  '3:00 PM – 6:00 PM (Evening)',
  '6:00 PM – 9:00 PM (Night)',
];

function SectionCard({ title, icon: Icon, iconColor = 'text-sky-600', children }) {
  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
      <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
        <Icon className={`w-3.5 h-3.5 ${iconColor}`} /> {title}
      </h3>
      {children}
    </div>
  );
}

function InfoRow({ label, value, mono = false, highlight = false }) {
  return (
    <div className="flex items-start justify-between gap-4 text-xs py-1.5 border-b border-slate-50 last:border-0">
      <span className="text-slate-400 font-medium shrink-0">{label}</span>
      <span className={`font-bold text-right ${mono ? 'font-mono' : ''} ${highlight ? 'text-sky-700' : 'text-slate-900'}`}>
        {value || '—'}
      </span>
    </div>
  );
}

export default function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPricing, setShowPricing] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  // Reschedule Modal state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // Rating & POD state (Screen 15)
  const [ratingVal, setRatingVal] = useState(5);
  const [fastDelivery, setFastDelivery] = useState(true);
  const [professionalAgent, setProfessionalAgent] = useState(true);
  const [easyTracking, setEasyTracking] = useState(true);
  const [goodCommunication, setGoodCommunication] = useState(true);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => { fetchOrderDetails(); }, [id]);

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    setSubmittingRating(true);
    try {
      const res = await api.post(`/orders/${id}/rate`, {
        rating: ratingVal,
        fastDelivery,
        professionalAgent,
        easyTracking,
        goodCommunication,
        feedback: feedbackText,
      });
      if (res.data.success) {
        toast.success('Thank you! Rating submitted successfully.');
        fetchOrderDetails();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  const fetchOrderDetails = async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      if (res.data.success) setOrder(res.data.order);
    } catch (err) {
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!newDate) { toast.error('Please select a new delivery date'); return; }

    const selected = new Date(newDate);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (selected < today) { toast.error('Please select a future date'); return; }

    setRescheduleLoading(true);
    try {
      const res = await api.post(`/orders/${id}/reschedule`, {
        newScheduledDate: newDate,
        deliverySlot: selectedSlot,
        reason: rescheduleReason || 'Customer rescheduled delivery',
      });
      if (res.data.success) {
        toast.success('Delivery rescheduled! A new agent will be assigned shortly.');
        setShowRescheduleModal(false);
        fetchOrderDetails();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reschedule failed');
    } finally {
      setRescheduleLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin text-sky-600 mx-auto mb-2" />
        Loading shipment tracking & live GPS route data...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-12 text-center">
        <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600 font-bold">Order not found</p>
        <button type="button" onClick={() => navigate(-1)} className="mt-4 text-sky-600 text-xs font-bold hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  const isAdmin = user?.role === 'ADMIN';
  const canReschedule = order.status === 'FAILED' && (user?.role === 'CUSTOMER' || isAdmin);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Banner (Matching Image 1 & Image 2 Style) */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate(-1)} className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">TRACK YOUR PACKAGE</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                  {order.slaStatus || 'ON TIME'}
                </span>
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">{order.orderNumber}</h1>
              <p className="text-xs text-slate-400 mt-0.5">Order Placed: {new Date(order.createdAt).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRateModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <Calculator className="w-3.5 h-3.5 text-sky-600" /> Price Explainer
            </button>
            <button
              type="button"
              onClick={() => setShowQRModal(true)}
              className="px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs transition-all flex items-center gap-1.5 border border-sky-200"
            >
              <QrCode className="w-3.5 h-3.5" /> QR Tracking
            </button>
            <StatusBadge status={order.status} />
            <button type="button" onClick={fetchOrderDetails} className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Action Pills (Matching Image 1: Price Pill & Return Items Pill) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-slate-900 font-mono">₹{order.totalAmount.toFixed(2)} Total</div>
                <div className="text-[11px] text-slate-500">{order.paymentType} Checkout • Verified</div>
              </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              ➔
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (canReschedule) setShowRescheduleModal(true);
              else alert('Reschedule / Return options active for your order.');
            }}
            className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between text-left transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
                <Undo2 className="w-4 h-4" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-slate-900">Return or Reschedule Items</div>
                <div className="text-[11px] text-slate-500">Initiate easy returns or change slot</div>
              </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
              ➔
            </div>
          </button>
        </div>
      </div>

      {/* E-Commerce Package Progress & Items (Matching Image 1 & Image 2) */}
      <ECommerceItemCards
        order={order}
        onReschedule={() => setShowRescheduleModal(true)}
        onCancel={() => alert('Order Cancellation request submitted.')}
      />

      {/* Live Map Graphic Container (Matching Image 1 & Image 3) */}
      <RouteMapGraphic order={order} />

      {/* Origin ➔ Destination Route Banner Card (Matching Image 2) */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">SHIPMENT ROUTE & CONSIGNEE</span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${
            order.zoneType === 'INTRA' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-purple-50 text-purple-700 border-purple-200'
          }`}>
            {order.zoneType}-ZONE ROUTE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          {/* Pickup / Origin */}
          <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-extrabold text-sky-600 uppercase tracking-wider block">ORIGIN (PICKUP)</span>
            <div className="font-extrabold text-slate-900 text-sm">{order.pickupAddress}</div>
            <div className="text-xs text-slate-500">Pincode: <span className="font-mono font-bold text-sky-700">{order.pickupPincode}</span> • {order.pickupZone?.name || 'Intra Zone'}</div>
            <div className="text-xs text-slate-400 pt-2 border-t border-slate-200/60 mt-2">
              Sender: <span className="font-bold text-slate-700">{order.customer?.name || 'Authorized Shipper'}</span>
            </div>
          </div>

          {/* Drop / Destination */}
          <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block">DESTINATION (DROP)</span>
            <div className="font-extrabold text-slate-900 text-sm">{order.dropAddress}</div>
            <div className="text-xs text-slate-500">Pincode: <span className="font-mono font-bold text-emerald-700">{order.dropPincode}</span> • {order.dropZone?.name || 'Drop Zone'}</div>
            <div className="text-xs text-slate-400 pt-2 border-t border-slate-200/60 mt-2">
              Consignee: <span className="font-bold text-slate-700">{order.customer?.name || 'Package Recipient'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Details & Live Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column — Package, Courier, Pricing */}
        <div className="lg:col-span-7 space-y-6">

          {/* Explainable Smart Assignment Panel */}
          {order.assignedAgentId && <AssignmentExplanationPanel orderId={order.id} />}

          {/* Courier Card (Image 1 Style) */}
          {order.assignedAgent && (
            <div className="p-5 rounded-3xl bg-slate-900 text-white shadow-xl space-y-4 border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center font-extrabold text-slate-950 text-lg shadow-md">
                    {order.assignedAgent.user?.name ? order.assignedAgent.user.name[0] : 'A'}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                      {order.assignedAgent.user?.name}
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">VERIFIED COURIER</span>
                    </h4>
                    <p className="text-xs text-slate-400">Vehicle: {order.assignedAgent.vehicleType} • Max Cap: {order.assignedAgent.maxCapacity}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-amber-400 font-extrabold text-xs">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> 5.0
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {order.assignedAgent.user?.phone ? (
                  <a
                    href={`tel:${order.assignedAgent.user.phone}`}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 border border-slate-700"
                  >
                    <Phone className="w-4 h-4 text-sky-400" /> Call Courier
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => alert('Agent phone: +91 98111 22334')}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 border border-slate-700"
                  >
                    <Phone className="w-4 h-4 text-sky-400" /> Call Courier
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => alert('Opening priority chat thread with courier...')}
                  className="py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <MessageSquare className="w-4 h-4" /> Send Message
                </button>
              </div>
            </div>
          )}

          {/* Parcel Details Grid (Image 2 Style) */}
          <SectionCard title="Parcel Details & Weight Calculations" icon={Box} iconColor="text-purple-600">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Length', value: `${order.length} cm` },
                { label: 'Breadth', value: `${order.breadth} cm` },
                { label: 'Height', value: `${order.height} cm` },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <p className="text-[10px] font-bold text-slate-400">{item.label}</p>
                  <p className="text-sm font-extrabold text-slate-900 font-mono">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 mt-1">
              {[
                { label: 'Actual Weight', value: `${order.actualWeight} kg`, color: 'text-slate-700' },
                { label: 'Volumetric Wt.', value: `${order.volumetricWeight} kg`, color: 'text-purple-700' },
                { label: 'Billable Wt.', value: `${order.chargeableWeight} kg`, color: 'text-sky-700', bg: 'bg-sky-50 border-sky-200' },
              ].map((item) => (
                <div key={item.label} className={`p-3 rounded-xl border text-center ${item.bg || 'bg-slate-50 border-slate-200'}`}>
                  <p className="text-[10px] font-bold text-slate-400">{item.label}</p>
                  <p className={`text-sm font-extrabold font-mono ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-between items-center text-xs">
              <span className="text-slate-400 text-[11px]">ⓘ Billable weight = max(actual, volumetric). Volumetric = (L×B×H) / 5000</span>
              <button
                type="button"
                onClick={() => setShowRateModal(true)}
                className="text-sky-600 font-extrabold hover:underline text-xs flex items-center gap-1 shrink-0"
              >
                <Calculator className="w-3.5 h-3.5" /> Rate Formula
              </button>
            </div>
          </SectionCard>

          {/* Pricing Breakdown Accordion */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setShowPricing(!showPricing)}
              className="w-full p-5 flex items-center justify-between text-left"
            >
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Financial Summary & Rate Breakdown
                <span className="text-sm font-extrabold text-emerald-700 ml-2">₹{order.totalAmount}</span>
              </h3>
              {showPricing ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {showPricing && (
              <div className="px-5 pb-5 border-t border-slate-100">
                <div className="pt-4 space-y-2">
                  <InfoRow label="Order Type" value={order.orderType} />
                  <InfoRow label="Payment Type" value={order.paymentType} />
                  <div className="h-0.5 bg-slate-100 my-2" />
                  <InfoRow label="Base Delivery Charge" value={`₹${order.deliveryCharge}`} highlight />
                  <InfoRow label="COD Surcharge" value={`₹${order.codSurcharge || 0}`} />
                  <div className="flex justify-between pt-2 border-t border-slate-200">
                    <span className="text-xs font-extrabold text-slate-900">TOTAL PAYABLE</span>
                    <span className="text-lg font-extrabold text-emerald-700">₹{order.totalAmount}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Reschedule CTA (for FAILED orders) */}
          {canReschedule && (
            <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-rose-800 text-sm">Delivery Attempt Failed</p>
                  <p className="text-xs text-rose-600 mt-0.5">
                    The delivery was unsuccessful. You can reschedule for another date and a new agent will be assigned.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRescheduleModal(true)}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Reschedule Delivery
              </button>
            </div>
          )}
        </div>

        {/* Right Column — Live Vertical Tracking Timeline (Image 1 & Image 2 Style) */}
        <div className="lg:col-span-5 space-y-6">
          <SectionCard title="Delivery Status Lifecycle Timeline" icon={Activity} iconColor="text-sky-600">
            <div className="text-xs space-y-1 pb-2 border-b border-slate-100">
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Created: {new Date(order.createdAt).toLocaleDateString()}</span>
                {order.scheduledDate && (
                  <span className="flex items-center gap-1 font-bold text-slate-800">
                    <CalendarClock className="w-3.5 h-3.5 text-sky-600" />
                    {new Date(order.scheduledDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <TrackingTimeline tracking={order.tracking || []} currentStatus={order.status} />
          </SectionCard>

          {/* Order Meta */}
          <SectionCard title="Order Specifications" icon={Package} iconColor="text-slate-600">
            <InfoRow label="Order Number" value={order.orderNumber} mono />
            <InfoRow label="Order Type" value={order.orderType} />
            <InfoRow label="Payment" value={order.paymentType} />
            <InfoRow label="Zone Route" value={`${order.zoneType}-ZONE`} highlight />
            <InfoRow label="Total Amount" value={`₹${order.totalAmount}`} highlight />
            <InfoRow label="Created At" value={new Date(order.createdAt).toLocaleString()} />
          </SectionCard>
        </div>
      </div>

      {/* Proof of Delivery & Rating Section (Matching Screen 15 in UI Specs) */}
      {(order.status === 'DELIVERED' || order.rating) && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" /> PROOF OF DELIVERY & RATING
            </h2>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-xs border border-emerald-200">
              OTP VERIFIED ✓
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Proof of Delivery Details Card */}
            <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs">
              <span className="font-extrabold text-slate-400 uppercase tracking-widest block">PROOF OF DELIVERY CERTIFICATE</span>
              <InfoRow label="Order Number" value={order.orderNumber} mono />
              <InfoRow label="Recipient Name" value={order.customer?.name || 'Aarav Sharma'} />
              <InfoRow label="Delivery Timestamp" value={order.actualDeliveryAt ? new Date(order.actualDeliveryAt).toLocaleString() : new Date().toLocaleString()} />
              <InfoRow label="Security Verification" value="OTP Verified ✓" highlight />
              <InfoRow label="Assigned Delivery Partner" value={order.assignedAgent?.user?.name || 'Amit Patel'} />

              {/* Photo Proof Box */}
              <div className="pt-2 space-y-1">
                <span className="font-bold text-slate-700 block">Package Photo Proof</span>
                <div className="h-36 rounded-xl bg-slate-200 border border-slate-300 flex flex-col items-center justify-center text-slate-500 overflow-hidden relative group">
                  <img
                    src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&auto=format&fit=crop&q=80"
                    alt="Proof of Delivery Package"
                    className="w-full h-full object-cover group-hover:scale-105 transition-all"
                  />
                  <div className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded-md font-mono">
                    POD Photo Verified
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => alert(`Downloading official Proof of Delivery document for shipment #${order.orderNumber}...`)}
                className="w-full py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold text-xs shadow-xs flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-sky-600" /> Download Official POD PDF
              </button>
            </div>

            {/* Rating & Feedback Form */}
            <form onSubmit={handleSubmitRating} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs">
              <span className="font-extrabold text-slate-400 uppercase tracking-widest block">HOW WAS YOUR EXPERIENCE?</span>

              {/* Star Rating Selector */}
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingVal(star)}
                    className="p-1 hover:scale-125 transition-transform"
                  >
                    <Star className={`w-7 h-7 ${star <= ratingVal ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                  </button>
                ))}
                <span className="font-extrabold text-slate-900 text-sm ml-2">{ratingVal}.0 / 5.0</span>
              </div>

              {/* Quick Tag Badges */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-700 block">What went well?</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Fast Delivery ✓', state: fastDelivery, set: setFastDelivery },
                    { label: 'Professional Agent ✓', state: professionalAgent, set: setProfessionalAgent },
                    { label: 'Easy Tracking ✓', state: easyTracking, set: setEasyTracking },
                    { label: 'Good Communication ✓', state: goodCommunication, set: setGoodCommunication },
                  ].map((tag) => (
                    <button
                      key={tag.label}
                      type="button"
                      onClick={() => tag.set(!tag.state)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                        tag.state ? 'bg-sky-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Feedback Textarea */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Additional Feedback (Optional)</label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Write your feedback about delivery speed, agent behavior..."
                  rows={3}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-300 resize-none font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={submittingRating}
                className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                {submittingRating ? 'Submitting...' : '✓ Submit Rating'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Rate Explainer Modal */}
      <RateExplainerModal
        orderId={order.id}
        isOpen={showRateModal}
        onClose={() => setShowRateModal(false)}
      />

      {/* QR Code Tracking Modal */}
      <QRTrackingModal
        orderId={order.id}
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
      />

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-cyan-600 to-sky-600 text-white">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" /> Reschedule Delivery
                </h3>
                <button type="button" onClick={() => setShowRescheduleModal(false)} className="text-white/80 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-white/70 mt-1">Order {order.orderNumber} — New Delivery Date</p>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">New Delivery Date *</label>
                <input
                  type="date"
                  value={newDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Preferred Time Slot</label>
                <select
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-300"
                >
                  <option value="">Any time (no preference)</option>
                  {DELIVERY_SLOTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Additional Notes</label>
                <textarea
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="Any special instructions for the new delivery..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-300 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rescheduleLoading}
                  className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2"
                >
                  {rescheduleLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4" />
                  )}
                  {rescheduleLoading ? 'Scheduling...' : 'Confirm Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
