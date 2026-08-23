import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Truck, MapPin, Navigation, Star, ShieldCheck, Clock, User } from 'lucide-react';

// Custom SVG Leaflet Icon Factory
const createCustomIcon = (type, isRecommended = false) => {
  let color = '#3b82f6'; // default sky
  let iconSvg = '🚚';
  let badgeHtml = '';

  if (type === 'PICKUP') {
    color = '#10b981'; // emerald
    iconSvg = '📦';
  } else if (type === 'DROP') {
    color = '#6366f1'; // indigo
    iconSvg = '🏁';
  } else if (type === 'AVAILABLE') {
    color = isRecommended ? '#0284c7' : '#10b981';
    iconSvg = '🟢';
  } else if (type === 'BUSY') {
    color = '#f59e0b';
    iconSvg = '🟠';
  } else if (type === 'OFFLINE') {
    color = '#64748b';
    iconSvg = '⚫';
  }

  if (isRecommended) {
    badgeHtml = `<div style="position: absolute; top: -8px; right: -8px; background: #fbbf24; border: 2px solid white; border-radius: 9999px; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">⭐</div>`;
  }

  const html = `
    <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
      ${isRecommended ? `<div style="position: absolute; inset: -4px; border-radius: 9999px; background: rgba(14, 165, 233, 0.35); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
      <div style="background: ${color}; color: white; width: 34px; height: 34px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2.5px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.25); z-index: 10;">
        ${iconSvg}
      </div>
      ${badgeHtml}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-pin',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20],
  });
};

export default function InteractiveLogisticsMap({
  pickup,
  drop,
  agents = [],
  recommendedAgentId = null,
  selectedAgentId = null,
  onSelectAgent = null,
  height = '420px',
  showRoute = true,
  isLiveTracking = false,
  assignedAgentLocation = null,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default coordinates (Delhi Center)
    const defaultCenter = [28.6139, 77.2090];
    const initialLat = pickup?.lat || defaultCenter[0];
    const initialLng = pickup?.lng || defaultCenter[1];

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 12,
        zoomControl: true,
      });

      // OpenStreetMap Tiles (100% Free & Open Source)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markers = [];
    const boundsPoints = [];

    // 1. Pickup Marker
    if (pickup?.lat && pickup?.lng) {
      const pickupPos = [pickup.lat, pickup.lng];
      boundsPoints.push(pickupPos);
      const marker = L.marker(pickupPos, { icon: createCustomIcon('PICKUP') })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: system-ui, sans-serif; padding: 4px; text-align: left;">
            <span style="color: #10b981; font-weight: 800; font-size: 10px; text-transform: uppercase;">📦 PICKUP ORIGIN</span>
            <div style="font-weight: 800; font-size: 12px; color: #0f172a; margin-top: 2px;">${pickup.address || 'Pickup Point'}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Pincode: ${pickup.pincode || '110001'}</div>
          </div>
        `);
      markers.push(marker);
    }

    // 2. Drop Marker
    if (drop?.lat && drop?.lng) {
      const dropPos = [drop.lat, drop.lng];
      boundsPoints.push(dropPos);
      const marker = L.marker(dropPos, { icon: createCustomIcon('DROP') })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: system-ui, sans-serif; padding: 4px; text-align: left;">
            <span style="color: #6366f1; font-weight: 800; font-size: 10px; text-transform: uppercase;">🏁 DROP DESTINATION</span>
            <div style="font-weight: 800; font-size: 12px; color: #0f172a; margin-top: 2px;">${drop.address || 'Destination Point'}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Pincode: ${drop.pincode || '201301'}</div>
          </div>
        `);
      markers.push(marker);
    }

    // 3. Agent Markers
    agents.forEach((ag) => {
      const lat = ag.currentLat || (ag.location ? ag.location.lat : null);
      const lng = ag.currentLng || (ag.location ? ag.location.lng : null);

      if (lat && lng) {
        const agPos = [lat, lng];
        boundsPoints.push(agPos);

        const isRec = ag.id === recommendedAgentId;
        const isSel = ag.id === selectedAgentId;
        const icon = createCustomIcon(ag.status || 'AVAILABLE', isRec || isSel);

        const lastUpdatedText = ag.lastLocationUpdatedAt
          ? `${Math.max(1, Math.round((Date.now() - new Date(ag.lastLocationUpdatedAt).getTime()) / 1000))} sec ago`
          : 'Live GPS';

        const marker = L.marker(agPos, { icon }).addTo(map);

        const popupContent = document.createElement('div');
        popupContent.className = 'p-1 text-left font-sans text-xs space-y-1.5';
        popupContent.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
            <strong style="font-size: 13px; color: #0f172a;">${ag.user?.name || ag.name || 'Delivery Agent'}</strong>
            <span style="font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 9999px; ${
              ag.status === 'AVAILABLE' ? 'background: #dcfce7; color: #15803d;' : 'background: #fef3c7; color: #b45309;'
            }">${ag.status}</span>
          </div>
          <div style="font-size: 11px; color: #475569;">Vehicle: <strong>${ag.vehicleType || 'EV Bike'}</strong></div>
          <div style="font-size: 11px; color: #475569;">Distance from Pickup: <strong>${ag.distKm ? ag.distKm.toFixed(1) : '1.2'} km</strong></div>
          <div style="font-size: 11px; color: #475569;">Active Deliveries: <strong>${ag.activeOrderCount || 0}</strong></div>
          <div style="font-size: 10px; color: #94a3b8; border-t: 1px solid #f1f5f9; padding-top: 4px;">Last updated: ${lastUpdatedText}</div>
        `;

        if (onSelectAgent && ag.status === 'AVAILABLE') {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.innerText = 'SELECT / ASSIGN THIS AGENT';
          btn.style.cssText = 'width: 100%; margin-top: 6px; background: #0284c7; color: white; border: none; font-weight: 800; font-size: 11px; padding: 6px; border-radius: 8px; cursor: pointer;';
          btn.onclick = () => onSelectAgent(ag);
          popupContent.appendChild(btn);
        }

        marker.bindPopup(popupContent);
        markers.push(marker);
      }
    });

    // 4. Live assigned agent marker for customer tracking page
    if (isLiveTracking && assignedAgentLocation?.lat && assignedAgentLocation?.lng) {
      const livePos = [assignedAgentLocation.lat, assignedAgentLocation.lng];
      boundsPoints.push(livePos);

      const liveMarker = L.marker(livePos, { icon: createCustomIcon('AVAILABLE', true) })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: system-ui, sans-serif; padding: 4px; text-align: left;">
            <span style="color: #0284c7; font-weight: 800; font-size: 10px; text-transform: uppercase;">🚚 LIVE ASSIGNED AGENT</span>
            <div style="font-weight: 800; font-size: 12px; color: #0f172a; margin-top: 2px;">${assignedAgentLocation.name || 'Rahul Sharma'}</div>
            <div style="font-size: 11px; color: #10b981; font-weight: 700; margin-top: 2px;">● Moving towards destination</div>
          </div>
        `);
      markers.push(liveMarker);
    }

    // 5. Draw Polyline Route if available
    if (showRoute && boundsPoints.length >= 2) {
      const polyline = L.polyline(boundsPoints, {
        color: '#0284c7',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8',
      }).addTo(map);
      markers.push(polyline);
    }

    // Fit bounds to show all markers smoothly
    if (boundsPoints.length > 0) {
      map.fitBounds(boundsPoints, { padding: [30, 30], maxZoom: 11 });
    }

    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [pickup, drop, agents, recommendedAgentId, selectedAgentId, assignedAgentLocation, isLiveTracking]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-900" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Map Legend (Part 29 Reference) */}
      <div className="absolute bottom-3 right-3 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3 text-[11px] text-white shadow-xl space-y-1.5 font-bold">
        <span className="text-[9px] uppercase tracking-widest text-slate-400 block font-extrabold border-b border-slate-800 pb-1">
          MAP LEGEND
        </span>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Available</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Busy</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" /> Offline</div>
          <div className="flex items-center gap-1.5"><span className="text-amber-400">⭐</span> Nearest</div>
          <div className="flex items-center gap-1.5"><span className="text-emerald-400 font-extrabold">📦</span> Pickup</div>
          <div className="flex items-center gap-1.5"><span className="text-indigo-400 font-extrabold">🏁</span> Drop</div>
        </div>
      </div>
    </div>
  );
}
