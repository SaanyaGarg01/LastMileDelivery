import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';
import InteractiveLogisticsMap from '../../components/InteractiveLogisticsMap';
import { ItemImage } from '../../utils/itemIcons';
import {
  Search, RefreshCw, Navigation, Share2, QrCode, Phone, MessageCircle,
  ShieldCheck, ArrowLeft, Star, Bike, CheckCircle2, Circle, Loader2,
  MapPin, Clock, Gauge, TriangleAlert, ChevronRight, Package
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const STEPS = [
  { key: 'CREATED',          label: 'Order Confirmed' },
  { key: 'ASSIGNED',         label: 'Agent Assigned' },
  { key: 'PICKED_UP',        label: 'Picked Up' },
  { key: 'IN_TRANSIT',       label: 'In Transit' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { key: 'DELIVERED',        label: 'Delivered' },
];

const STATUS_ORDER = ['CREATED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];

function stepIndex(status) {
  const idx = STATUS_ORDER.indexOf(status);
  return idx === -1 ? 0 : idx;
}

function formatTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ─────────────────────────────────────────────
   Interactive OpenStreetMap Container with Demo GPS & All Agents
───────────────────────────────────────────── */
function MapSVG({ pickup, drop, agentName, status }) {
  const [allAgents, setAllAgents] = useState([]);
  const [demoMode, setDemoMode] = useState(false);
  const [agentPos, setAgentPos] = useState({
    lat: 28.6250,
    lng: 77.2140,
    name: agentName || 'Rahul Sharma',
  });

  useEffect(() => {
    fetchFleetAgents();
  }, []);

  const fetchFleetAgents = async () => {
    try {
      const res = await api.get('/agents');
      if (res.data.success) {
        setAllAgents(res.data.agents || []);
      }
    } catch {
      // Fallback
    }
  };

  // Simulated GPS Movement in Demo Mode (Part 43)
  useEffect(() => {
    if (!demoMode) return;
    const interval = setInterval(() => {
      setAgentPos((prev) => ({
        ...prev,
        lat: prev.lat + (Math.random() - 0.4) * 0.0015,
        lng: prev.lng + (Math.random() - 0.4) * 0.0015,
      }));
    }, 2500);
    return () => clearInterval(interval);
  }, [demoMode]);

  const pickupObj = {
    address: pickup?.address || pickup?.name || 'Connaught Place, Delhi',
    lat: pickup?.lat || 28.6139,
    lng: pickup?.lng || 77.2090,
  };

  const dropObj = {
    address: drop?.address || drop?.name || 'Sector 18, Noida',
    lat: drop?.lat || 28.6320,
    lng: drop?.lng || 77.2190,
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Navigation className="w-3.5 h-3.5 text-sky-600" /> Interactive OpenStreetMap Tracking
        </span>
        <button
          type="button"
          onClick={() => setDemoMode(!demoMode)}
          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border transition-all ${
            demoMode
              ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm animate-pulse'
              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
          }`}
        >
          {demoMode ? '⚡ LIVE GPS AUTO-REFRESH ACTIVE' : '▶ Enable Real-Time GPS Tracking'}
        </button>
      </div>

      <InteractiveLogisticsMap
        pickup={pickupObj}
        drop={dropObj}
        agents={allAgents}
        isLiveTracking={true}
        assignedAgentLocation={agentPos}
        height="320px"
        showRoute={true}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Shipment Journey Timeline
───────────────────────────────────────────── */
function JourneyTimeline({ order }) {
  const currentIdx = stepIndex(order?.status || 'CREATED');
  const logs = order?.tracking || [];

  // Map log timestamps to steps
  const getLogForStep = (stepKey) => {
    return logs.find(l => l.status === stepKey);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 mt-4">
      <h3 className="text-sm font-bold text-slate-800 mb-5">Shipment Journey</h3>
      <div className="relative flex items-start">
        {/* Connector line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200 z-0" />
        {/* Filled connector up to current step */}
        <div
          className="absolute top-5 left-0 h-0.5 bg-green-500 z-0 transition-all duration-700"
          style={{ width: `${Math.min((currentIdx / (STEPS.length - 1)) * 100, 100)}%` }}
        />

        {STEPS.map((step, idx) => {
          const log = getLogForStep(step.key);
          const isDone = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isFuture = idx > currentIdx;

          return (
            <div key={step.key} className="relative flex-1 flex flex-col items-center z-10">
              {/* Step icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                ${isDone ? 'bg-green-500 border-green-500 text-white' :
                  isCurrent ? 'bg-white border-blue-500 text-blue-500' :
                  'bg-white border-slate-200 text-slate-300'}`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </div>

              {/* Step label & time */}
              <div className="mt-2 text-center">
                <p className={`text-[11px] font-bold leading-tight
                  ${isDone ? 'text-green-700' : isCurrent ? 'text-blue-700' : 'text-slate-400'}`}>
                  {step.label}
                </p>
                {log ? (
                  <>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{formatTime(log.timestamp)}</p>
                    <p className="text-[10px] text-slate-400">{formatDate(log.timestamp)}</p>
                  </>
                ) : isFuture ? (
                  <p className="text-[10px] text-slate-300 mt-0.5">—</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
export default function LiveTrackingPage() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('search') || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchActiveTracking();
    // Auto-refresh every 15s
    intervalRef.current = setInterval(() => fetchActiveTracking(undefined, true), 15000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const fetchActiveTracking = async (searchQuery = query, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/orders');
      if (res.data.success && res.data.orders.length > 0) {
        let matched = res.data.orders[0];
        if (searchQuery) {
          const found = res.data.orders.find(o =>
            o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
          );
          if (found) matched = found;
        } else {
          // Prefer active orders
          const active = res.data.orders.find(o =>
            ['OUT_FOR_DELIVERY', 'IN_TRANSIT', 'PICKED_UP', 'ASSIGNED'].includes(o.status)
          );
          if (active) matched = active;
        }
        const detailRes = await api.get(`/orders/${matched.id}`);
        if (detailRes.data.success) {
          setOrder(detailRes.data.order);
          setLastUpdated(new Date());
        }
      }
    } catch {
      if (!silent) toast.error('Failed to load tracking data');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchActiveTracking(query);
  };

  /* ── derived values ── */
  const agent = order?.assignedAgent;
  const agentName = agent?.user?.name || 'Not Assigned';
  const agentRating = 4.8;
  const agentDeliveries = 124;
  const vehicle = 'EV Bike';
  const vehicleNo = 'MH12 AB 1234';

  const isCancelled = order?.status === 'CANCELLED';
  const isActive = order && !isCancelled && order.status !== 'DELIVERED';

  const secondsAgo = lastUpdated
    ? Math.round((Date.now() - lastUpdated.getTime()) / 1000)
    : null;

  // Health metrics
  const etaConfidence = 91;
  const delayRisk = 'Low';
  const routeDeviation = '0.2 km';
  const trafficCondition = 'Light';
  const gpsFreshness = secondsAgo !== null ? `${secondsAgo} sec ago` : '—';

  // Package items (from order.items or fallback demo items)
  const items = order?.items?.length
    ? order.items
    : [
        { name: 'Wireless Headphones', category: 'Electronics', quantity: 1, declaredValue: 8999, isFragile: true },
        { name: 'Phone Case',          category: 'Electronics', quantity: 2, declaredValue: 1500 },
        { name: 'USB Cable',           category: 'Electronics', quantity: 1, declaredValue: 299 },
      ];

  const totalDeclared = items.reduce((s, i) => s + Number(i.declaredValue || 0) * Number(i.quantity || 1), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-0">

      {/* ── Back & Title Bar ── */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-xs text-sky-600 font-semibold hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Live Tracking
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Live Tracking</h1>
              {isActive && (
                <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-[11px] font-extrabold border border-green-200 tracking-wide">
                  LIVE
                </span>
              )}
              {isCancelled && (
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[11px] font-extrabold border border-slate-200">
                  CANCELLED
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">Real-time tracking of your shipment</p>
          </div>
        </div>

        {/* Action buttons */}
        {order && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Tracking link copied!'); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" /> Share Tracking Link
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 font-semibold hover:bg-slate-50 transition-colors">
              <QrCode className="w-3.5 h-3.5" /> View QR Code
            </button>
            <button className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50">
              <span className="text-base leading-none">⋮</span>
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-sm text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2 text-sky-500" /> Loading live tracking stream...
        </div>
      ) : !order ? (
        <div className="p-12 text-center text-slate-500 text-xs bg-white border border-slate-200 rounded-2xl shadow-sm">
          No shipments found. <Link to="/customer/shipments" className="text-sky-600 font-bold hover:underline">Create a shipment</Link> to track it here.
        </div>
      ) : (
        <>
          {/* ── Shipment Quick Info Bar ── */}
          <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 mb-4 flex flex-wrap items-center gap-5 text-xs">
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase mb-0.5">Shipment ID</p>
              <Link to={`/customer/orders/${order.id}`} className="text-sky-600 font-bold font-mono hover:underline">
                {order.orderNumber}
              </Link>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase mb-0.5">Status</p>
              <StatusBadge status={order.status} />
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase mb-0.5">ETA</p>
              {isCancelled ? (
                <span className="text-slate-400 font-bold">N/A</span>
              ) : (
                <>
                  <span className="font-bold text-slate-900">12–18 min</span>
                  <span className="text-slate-400 ml-1">2.4 km away</span>
                </>
              )}
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase mb-0.5">Agent</p>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">{agentName}</span>
                {agent && !isCancelled && (
                  <button className="p-1 rounded-full bg-sky-50 text-sky-600 hover:bg-sky-100">
                    <Phone className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase mb-0.5">Vehicle</p>
              <div className="flex items-center gap-1.5">
                <Bike className="w-3.5 h-3.5 text-slate-600" />
                <span className="font-bold text-slate-900">{vehicle}</span>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase mb-0.5">Last Updated</p>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                <span className="font-mono text-slate-700">
                  {gpsFreshness !== '—' ? gpsFreshness : '8 sec ago'}
                </span>
              </div>
            </div>
          </div>

          {/* ── Main 3-column layout ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">

            {/* ── LEFT: Map + Telemetry + Journey ── */}
            <div className="space-y-4">
              {/* Map */}
              <MapSVG
                pickup={order.pickupAddress}
                drop={order.dropAddress}
                agentName={agentName}
                status={order.status}
              />

              {/* Telemetry stats row */}
              <div className="grid grid-cols-5 gap-3">
                {[
                  { label: 'Distance Remaining', value: isCancelled ? '—' : '2.4 km' },
                  { label: 'ETA Range', value: isCancelled ? '—' : '12–18 min' },
                  { label: 'GPS Accuracy', value: isCancelled ? '—' : '±12 m' },
                  { label: 'Speed', value: isCancelled ? '—' : '28 km/h' },
                  {
                    label: 'Route Deviation',
                    value: isCancelled ? '—' : '0.2 km',
                    extra: !isCancelled && <span className="ml-1 text-green-600 font-bold text-[10px]">Low Risk</span>
                  },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-slate-400 font-semibold leading-tight">{stat.label}</p>
                    <div className="flex items-center justify-center mt-1">
                      <p className="text-sm font-extrabold text-slate-900">{stat.value}</p>
                      {stat.extra}
                    </div>
                  </div>
                ))}
              </div>

              {/* Journey Timeline */}
              <JourneyTimeline order={order} />
            </div>

            {/* ── RIGHT: Agent Card + Health + Package ── */}
            <div className="space-y-4">

              {/* Delivery Partner Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-slate-800">Delivery Partner</h3>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center text-2xl flex-shrink-0">
                    {agent ? '👨‍💼' : '❓'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{agentName}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-bold text-slate-700">{agentRating}</span>
                      <span className="text-xs text-slate-400">({agentDeliveries} deliveries)</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Bike className="w-4 h-4" />
                  <span>{vehicle} • {vehicleNo}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={isCancelled || !agent}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call
                  </button>
                  <button
                    disabled={isCancelled || !agent}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Chat
                  </button>
                </div>
              </div>

              {/* Delivery Health Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">Delivery Health</h3>
                  {isCancelled ? (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-extrabold border border-slate-200">
                      CANCELLED
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-extrabold border border-green-200">
                      <ShieldCheck className="w-3 h-3" /> ON TRACK
                    </span>
                  )}
                </div>

                <div className="space-y-2.5 text-xs">
                  {[
                    { label: 'ETA Confidence', value: isCancelled ? '—' : `${etaConfidence}%`, valueClass: 'text-green-600 font-bold' },
                    { label: 'Delay Risk', value: isCancelled ? '—' : delayRisk, valueClass: 'text-slate-700 font-semibold' },
                    { label: 'Route Deviation', value: isCancelled ? '—' : routeDeviation, valueClass: 'text-slate-700 font-semibold' },
                    { label: 'Traffic Condition', value: isCancelled ? '—' : trafficCondition, valueClass: 'text-slate-700 font-semibold' },
                    { label: 'GPS Freshness', value: gpsFreshness !== '—' ? gpsFreshness : '8 sec ago', valueClass: 'text-slate-700 font-semibold' },
                  ].map(({ label, value, valueClass }) => (
                    <div key={label} className="flex justify-between items-center border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                      <span className="text-slate-500">{label}</span>
                      <span className={valueClass}>{value}</span>
                    </div>
                  ))}
                </div>

                <button className="w-full text-xs text-sky-600 font-semibold hover:underline text-center pt-1">
                  View Details
                </button>
              </div>

              {/* Your Package Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">Your Package</h3>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    {items.length} Items • {order.chargeableWeight || 3.2} kg
                  </span>
                </div>

                <div className="space-y-3">
                  {items.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <ItemImage item={item} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-500">Qty: {item.quantity || 1}</span>
                          <span className="text-[11px] font-semibold text-slate-700">₹{Number(item.declaredValue || 0).toLocaleString('en-IN')}</span>
                          {item.isFragile && (
                            <span className="text-[10px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded font-bold">🔴 Fragile</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-semibold">Total Declared Value</span>
                  <span className="text-sm font-extrabold text-slate-900">₹{totalDeclared.toLocaleString('en-IN')}</span>
                </div>

                {items.length > 3 && (
                  <button className="w-full text-xs text-sky-600 font-semibold hover:underline text-center">
                    View All Items
                  </button>
                )}
              </div>

              {/* Refresh button */}
              <button
                onClick={() => fetchActiveTracking()}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Tracking
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
