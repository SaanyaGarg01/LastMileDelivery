import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';
import {
  Truck, MapPin, Activity, RefreshCw, Users, Package,
  CheckCircle2, AlertTriangle, Phone, X, Navigation, Zap, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Map Legend ───────────────────────────────────────────────────────────────
function MapLegend() {
  return (
    <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur border border-slate-200 rounded-xl p-3 shadow-sm z-[1000] space-y-1.5">
      <p className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">Map Legend</p>
      {[
        { color: 'bg-emerald-500', label: 'Available Agent' },
        { color: 'bg-amber-500', label: 'Busy Agent' },
        { color: 'bg-slate-400', label: 'Offline Agent' },
        { color: 'bg-sky-600', label: 'Pickup Point' },
        { color: 'bg-rose-500', label: 'Drop Point' },
      ].map(({ color, label }) => (
        <div key={label} className="flex items-center gap-2 text-[10px] text-slate-700">
          <span className={`w-2.5 h-2.5 rounded-full ${color} shrink-0`} />
          {label}
        </div>
      ))}
    </div>
  );
}

// ─── Ops Map using Leaflet ────────────────────────────────────────────────────
function OpsMap({ agents, activeOrders, onAgentClick, onOrderClick, selectedId }) {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (mapRef.current && !leafletMap.current) {
      // Dynamically load Leaflet (it's used in MapCard already)
      const L = window.L;
      if (!L) {
        console.warn('Leaflet not loaded');
        return;
      }

      leafletMap.current = L.map(mapRef.current, {
        center: [28.6139, 77.2090],
        zoom: 11,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(leafletMap.current);
    }
  }, []);

  // Update markers when data changes
  useEffect(() => {
    const L = window.L;
    if (!L || !leafletMap.current) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const makeIcon = (color, size = 12) => L.divIcon({
      html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);" />`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      className: '',
    });

    // Agent markers
    agents.forEach((agent) => {
      const lat = agent.currentLat || 28.6 + (Math.random() - 0.5) * 0.2;
      const lng = agent.currentLng || 77.2 + (Math.random() - 0.5) * 0.2;

      const color = agent.status === 'AVAILABLE' ? '#10b981' : agent.status === 'BUSY' ? '#f59e0b' : '#94a3b8';
      const marker = L.marker([lat, lng], { icon: makeIcon(color, 14) })
        .addTo(leafletMap.current)
        .bindPopup(`
          <div style="font-size:11px;min-width:150px;">
            <strong style="font-size:13px;">${agent.user?.name}</strong><br/>
            <span style="color:${color};font-weight:700;">${agent.status}</span><br/>
            Vehicle: ${agent.vehicleType}<br/>
            Active orders: ${agent._count?.assignedOrders || 0}
            ${agent.user?.phone ? `<br/><a href="tel:${agent.user.phone}">${agent.user.phone}</a>` : ''}
          </div>
        `);
      marker.on('click', () => onAgentClick(agent));
      markersRef.current.push(marker);
    });

    // Active order markers
    activeOrders.forEach((order) => {
      const pickupLat = order.pickupLat || 28.62 + (Math.random() - 0.5) * 0.15;
      const pickupLng = order.pickupLng || 77.21 + (Math.random() - 0.5) * 0.15;
      const dropLat = order.dropLat || 28.58 + (Math.random() - 0.5) * 0.15;
      const dropLng = order.dropLng || 77.23 + (Math.random() - 0.5) * 0.15;

      // Pickup
      const pickupMarker = L.marker([pickupLat, pickupLng], {
        icon: L.divIcon({
          html: `<div style="width:10px;height:10px;border-radius:50%;background:#0284c7;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.2);" />`,
          iconSize: [10, 10], iconAnchor: [5, 5], className: '',
        }),
      }).addTo(leafletMap.current)
        .bindPopup(`<b>📦 Pickup</b><br/>${order.orderNumber}<br/>${order.pickupAddress}`);
      markersRef.current.push(pickupMarker);

      // Drop
      const dropMarker = L.marker([dropLat, dropLng], {
        icon: L.divIcon({
          html: `<div style="width:10px;height:10px;border-radius:50%;background:#ef4444;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.2);" />`,
          iconSize: [10, 10], iconAnchor: [5, 5], className: '',
        }),
      }).addTo(leafletMap.current)
        .bindPopup(`<b>📍 Drop</b><br/>${order.orderNumber}<br/>${order.dropAddress}`);
      dropMarker.on('click', () => onOrderClick(order));
      markersRef.current.push(dropMarker);
    });

  }, [agents, activeOrders]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden">
      <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: '480px' }} />
      <MapLegend />
    </div>
  );
}

// ─── Fallback Map (when Leaflet not available) ────────────────────────────────
function FallbackMap({ agents, activeOrders, onAgentClick, onOrderClick }) {
  // Simple grid visualization when Leaflet isn't available
  return (
    <div className="w-full h-full min-h-[480px] rounded-2xl bg-slate-900 relative overflow-hidden flex flex-col items-center justify-center">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />
      <p className="text-slate-400 text-xs font-semibold z-10 mb-4">Live Fleet & Delivery Operations Map</p>
      {/* Agent dots */}
      <div className="flex flex-wrap gap-3 z-10 max-w-lg">
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => onAgentClick(agent)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
              agent.status === 'AVAILABLE' ? 'bg-emerald-900/50 border-emerald-500 text-emerald-400' :
              agent.status === 'BUSY' ? 'bg-amber-900/50 border-amber-500 text-amber-400' :
              'bg-slate-800 border-slate-600 text-slate-400'
            }`}
          >
            <Truck className="w-3 h-3 inline mr-1" />
            {agent.user?.name?.split(' ')[0]}
          </button>
        ))}
        {activeOrders.map((order) => (
          <button
            key={order.id}
            onClick={() => onOrderClick(order)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-sky-900/50 border border-sky-500 text-sky-400"
          >
            <Package className="w-3 h-3 inline mr-1" />
            {order.orderNumber.slice(-6)}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Agent Detail Panel ───────────────────────────────────────────────────────
function AgentPanel({ agent, onClose }) {
  if (!agent) return null;
  const statusColors = {
    AVAILABLE: 'text-emerald-700 bg-emerald-100 border-emerald-200',
    BUSY: 'text-amber-700 bg-amber-100 border-amber-200',
    OFFLINE: 'text-slate-500 bg-slate-100 border-slate-200',
  };
  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Selected Agent</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-sky-500 flex items-center justify-center">
          <Truck className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-extrabold text-slate-900">{agent.user?.name}</p>
          <p className="text-[10px] text-slate-400">{agent.vehicleType} · {agent.id.slice(-6).toUpperCase()}</p>
        </div>
      </div>
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${statusColors[agent.status] || ''}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${agent.status === 'AVAILABLE' ? 'bg-emerald-500 animate-pulse' : agent.status === 'BUSY' ? 'bg-amber-500' : 'bg-slate-400'}`} />
        {agent.status}
      </span>
      <div className="space-y-1.5 text-xs">
        {agent.user?.phone && (
          <a href={`tel:${agent.user.phone}`} className="flex items-center gap-2 text-sky-600 font-bold hover:underline">
            <Phone className="w-3.5 h-3.5" /> {agent.user.phone}
          </a>
        )}
        <p className="text-slate-600">Active Deliveries: <strong>{agent._count?.assignedOrders || 0}</strong></p>
        <p className="text-slate-400 font-mono text-[10px]">
          Loc: {(agent.currentLat || 28.6139).toFixed(4)}, {(agent.currentLng || 77.209).toFixed(4)}
        </p>
      </div>
    </div>
  );
}

// ─── Order Detail Panel ───────────────────────────────────────────────────────
function OrderPanel({ order, onClose }) {
  if (!order) return null;
  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Selected Order</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
      </div>
      <p className="font-extrabold text-slate-900 font-mono text-sm">{order.orderNumber}</p>
      <StatusBadge status={order.status} />
      <div className="space-y-2 text-xs">
        <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200">
          <p className="text-[10px] text-slate-400 font-bold">PICKUP</p>
          <p className="text-slate-800 font-semibold">{order.pickupAddress}</p>
          <p className="text-sky-700 font-bold">{order.pickupZone?.name}</p>
        </div>
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
          <p className="text-[10px] text-slate-400 font-bold">DROP</p>
          <p className="text-slate-800 font-semibold">{order.dropAddress}</p>
          <p className="text-rose-700 font-bold">{order.dropZone?.name}</p>
        </div>
        <p className="text-slate-600">Customer: <strong>{order.customer?.name}</strong></p>
        {order.assignedAgent && (
          <p className="text-slate-600">Agent: <strong>{order.assignedAgent.user?.name}</strong></p>
        )}
        <p className="text-slate-600">Amount: <strong>₹{order.totalAmount}</strong> ({order.paymentType})</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminLiveOperationsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [hasLeaflet, setHasLeaflet] = useState(typeof window !== 'undefined' && typeof window.L !== 'undefined');

  useEffect(() => {
    const checkLeaflet = () => {
      if (typeof window !== 'undefined' && window.L) {
        setHasLeaflet(true);
      }
    };
    checkLeaflet();
    const leafletCheckTimer = setInterval(checkLeaflet, 500);

    fetchData();
    const interval = setInterval(fetchData, 15000); // Refresh every 15s

    return () => {
      clearInterval(leafletCheckTimer);
      clearInterval(interval);
    };
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/admin/live-operations');
      if (res.data.success) {
        setData(res.data);
        setLastUpdated(new Date());
      }
    } catch {
      toast.error('Failed to load live operations data');
    } finally {
      setLoading(false);
    }
  };

  const { agents = [], activeOrders = [], summary = {} } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-sky-600" /> Live Operations Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time fleet tracking and active delivery monitoring
            <span className="ml-2 text-[10px] text-slate-400">· Updated {lastUpdated.toLocaleTimeString()} · Auto-refreshes every 15s</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
          <button onClick={fetchData} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Agents', value: summary.totalAgents || 0, icon: Users, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' },
          { label: 'Available', value: summary.availableAgents || 0, icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          { label: 'On Delivery', value: summary.busyAgents || 0, icon: Truck, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
          { label: 'Offline', value: summary.offlineAgents || 0, icon: AlertTriangle, color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200' },
          { label: 'Active Orders', value: summary.activeOrderCount || 0, icon: Package, color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200' },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={`p-4 rounded-2xl ${bg} border ${border}`}>
            <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
              <Icon className={`w-3.5 h-3.5 ${color}`} /> {label}
            </span>
            <span className={`text-2xl font-extrabold block ${color}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map */}
        <div className="lg:col-span-8 rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ minHeight: 520 }}>
          {loading ? (
            <div className="w-full h-full min-h-[520px] bg-slate-100 animate-pulse flex items-center justify-center">
              <p className="text-slate-400 text-xs">Loading map...</p>
            </div>
          ) : hasLeaflet ? (
            <OpsMap
              agents={agents}
              activeOrders={activeOrders}
              onAgentClick={setSelectedAgent}
              onOrderClick={setSelectedOrder}
              selectedId={selectedAgent?.id || selectedOrder?.id}
            />
          ) : (
            <FallbackMap
              agents={agents}
              activeOrders={activeOrders}
              onAgentClick={setSelectedAgent}
              onOrderClick={setSelectedOrder}
            />
          )}
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-4 space-y-4">
          {/* Selected panels */}
          {selectedAgent && (
            <AgentPanel agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
          )}
          {selectedOrder && (
            <OrderPanel order={selectedOrder} onClose={() => setSelectedOrder(null)} />
          )}

          {/* Agent List */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">Fleet Status</h3>
            {agents.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No agents in system</p>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {agents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => { setSelectedAgent(agent); setSelectedOrder(null); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs border transition-all text-left ${
                      selectedAgent?.id === agent.id ? 'bg-sky-50 border-sky-300' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      agent.status === 'AVAILABLE' ? 'bg-emerald-500 animate-pulse' :
                      agent.status === 'BUSY' ? 'bg-amber-500' : 'bg-slate-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate">{agent.user?.name}</p>
                      <p className="text-[10px] text-slate-400">{agent.vehicleType} · {agent._count?.assignedOrders || 0} active</p>
                    </div>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg ${
                      agent.status === 'AVAILABLE' ? 'text-emerald-700 bg-emerald-100' :
                      agent.status === 'BUSY' ? 'text-amber-700 bg-amber-100' : 'text-slate-500 bg-slate-100'
                    }`}>
                      {agent.status === 'AVAILABLE' ? 'Free' : agent.status === 'BUSY' ? 'Busy' : 'Off'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active Orders List */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">Active Deliveries</h3>
            {activeOrders.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No active deliveries</p>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {activeOrders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => { setSelectedOrder(order); setSelectedAgent(null); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs border transition-all text-left ${
                      selectedOrder?.id === order.id ? 'bg-sky-50 border-sky-300' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Package className="w-4 h-4 text-sky-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 font-mono truncate">{order.orderNumber}</p>
                      <p className="text-[10px] text-slate-400 truncate">{order.customer?.name}</p>
                    </div>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg`}
                      style={{ color: '#f97316', background: '#fff7ed', border: '1px solid #fed7aa' }}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
