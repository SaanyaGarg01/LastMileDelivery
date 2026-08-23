import React from 'react';
import { MapPin, Navigation, Truck, ShieldCheck } from 'lucide-react';

export default function MapCard({ pickup, drop, agent, currentStatus }) {
  const pickupName = pickup?.address || pickup?.name || 'Pickup Origin';
  const dropName = drop?.address || drop?.name || 'Drop Destination';
  const agentName = agent?.user?.name || agent?.name || 'Assigned Agent';

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Navigation className="w-4 h-4 text-sky-600" /> Live Logistics Route Map
        </h3>
        <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded">
          {currentStatus ? currentStatus.replace('_', ' ') : 'IN TRANSIT'}
        </span>
      </div>

      {/* Visual Vector Route Graphic */}
      <div className="h-40 bg-slate-900 rounded-xl relative p-4 flex flex-col justify-between overflow-hidden shadow-inner">
        {/* Background grid lines */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Route Line connecting points */}
        <div className="absolute left-8 right-8 top-1/2 h-1 bg-gradient-to-r from-emerald-500 via-sky-400 to-indigo-500 rounded-full" />

        {/* Pickup Pin */}
        <div className="relative z-10 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-lg shadow-emerald-500/30">
            A
          </div>
          <div className="bg-slate-800/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] text-white">
            <span className="text-emerald-400 font-bold block text-[9px] uppercase">Pickup Origin</span>
            <span className="truncate max-w-[140px] block font-medium">{pickupName}</span>
          </div>
        </div>

        {/* Live Agent Location Marker */}
        <div className="relative z-10 self-center flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-xs shadow-lg shadow-sky-500/40 ring-4 ring-sky-500/20 animate-pulse">
            <Truck className="w-4 h-4" />
          </div>
          <div className="bg-slate-800/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-sky-500/40 text-[11px] text-white">
            <span className="text-sky-400 font-bold block text-[9px] uppercase">Agent: {agentName}</span>
            <span className="text-[10px] text-slate-300 block">Latest GPS Coordinates</span>
          </div>
        </div>

        {/* Drop Pin */}
        <div className="relative z-10 self-end flex items-center gap-2">
          <div className="bg-slate-800/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] text-white text-right">
            <span className="text-indigo-400 font-bold block text-[9px] uppercase">Drop Destination</span>
            <span className="truncate max-w-[140px] block font-medium">{dropName}</span>
          </div>
          <div className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-lg shadow-indigo-500/30">
            B
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
        <span>Latest stored agent location</span>
        <span className="font-semibold text-slate-700 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> GPS Verified
        </span>
      </div>
    </div>
  );
}
