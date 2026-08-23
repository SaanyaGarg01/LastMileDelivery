import React from 'react';
import { MapPin, Navigation, Truck, Phone, MessageSquare, Star } from 'lucide-react';

export default function RouteMapGraphic({ order }) {
  const isDelivered = order.status === 'DELIVERED';
  const isInTransit = ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'PICKED_UP'].includes(order.status);

  return (
    <div className="relative w-full h-80 sm:h-96 rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl">
      {/* Map Vector Background Grid */}
      <svg className="absolute inset-0 w-full h-full opacity-30" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#38bdf8" strokeWidth="0.5" strokeDasharray="2,2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        {/* Road Polylines */}
        <path d="M 50,250 C 150,220 200,80 350,70 C 450,60 550,180 750,150" fill="none" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" />
        <path d="M 50,250 C 150,220 200,80 350,70 C 450,60 550,180 750,150" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6,6" strokeLinecap="round" className="animate-pulse" />
      </svg>

      {/* Floating Header Tag */}
      <div className="absolute top-4 left-4 z-10 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-700/80 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span>LIVE GPS ROUTE STREAM</span>
      </div>

      {/* Map Markers */}
      {/* Origin Pin */}
      <div className="absolute top-14 left-10 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur-xs p-2 rounded-2xl border border-slate-700 shadow-lg">
        <div className="p-1.5 rounded-xl bg-sky-500 text-white">
          <MapPin className="w-4 h-4" />
        </div>
        <div className="text-[11px] text-white">
          <div className="font-extrabold text-sky-400">PICKUP ORIGIN</div>
          <div className="text-[10px] text-slate-300">{order.pickupAddress}</div>
        </div>
      </div>

      {/* Agent Marker along path */}
      {isInTransit && (
        <div className="absolute top-28 left-[45%] z-20 flex flex-col items-center animate-bounce">
          <div className="px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-[10px] shadow-lg flex items-center gap-1 border border-amber-300">
            <Truck className="w-3.5 h-3.5" /> AGENT EN ROUTE (ETA: 18-25 MIN)
          </div>
          <div className="w-3 h-3 bg-amber-400 rotate-45 -mt-1 shadow-md" />
        </div>
      )}

      {/* Destination Pin */}
      <div className="absolute bottom-10 right-10 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur-xs p-2 rounded-2xl border border-slate-700 shadow-lg">
        <div className="p-1.5 rounded-xl bg-emerald-500 text-white">
          <MapPin className="w-4 h-4" />
        </div>
        <div className="text-[11px] text-white">
          <div className="font-extrabold text-emerald-400">DELIVERY DESTINATION</div>
          <div className="text-[10px] text-slate-300">{order.dropAddress}</div>
        </div>
      </div>

      {/* Driver Contact Glass Overlay Card (Matching Image 1 & Image 3) */}
      <div className="absolute bottom-4 left-4 right-4 sm:left-4 sm:right-auto z-20 sm:max-w-sm bg-slate-950/90 backdrop-blur-md p-4 rounded-2xl border border-slate-800 text-white space-y-3 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-extrabold text-white text-base shadow-md">
              {order.assignedAgent?.user?.name ? order.assignedAgent.user.name[0] : 'A'}
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-white flex items-center gap-1.5">
                {order.assignedAgent?.user?.name || 'Assigned Agent Rahul Sharma'}
                <span className="flex items-center text-amber-400 text-[10px] font-bold">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400 ml-1" /> 5.0
                </span>
              </h4>
              <p className="text-[10px] text-slate-400">
                Vehicle: {order.assignedAgent?.vehicleType || 'BIKE'} • Fast Mile Courier
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons (Matching Image 1: Call Courier & Send Message) */}
        <div className="grid grid-cols-2 gap-2">
          {order.assignedAgent?.user?.phone ? (
            <a
              href={`tel:${order.assignedAgent.user.phone}`}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 border border-slate-700"
            >
              <Phone className="w-3.5 h-3.5 text-sky-400" /> Call Courier
            </a>
          ) : (
            <button
              type="button"
              onClick={() => alert('Agent phone: +91 98111 22334')}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 border border-slate-700"
            >
              <Phone className="w-3.5 h-3.5 text-sky-400" /> Call Courier
            </button>
          )}

          <button
            type="button"
            onClick={() => alert('Sending priority delivery message to agent...')}
            className="py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-md"
          >
            <MessageSquare className="w-3.5 h-3.5" /> Send Message
          </button>
        </div>
      </div>
    </div>
  );
}
