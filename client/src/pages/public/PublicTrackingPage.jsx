import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import RouteMapGraphic from '../../components/RouteMapGraphic';
import { Package, ShieldCheck, MapPin, RefreshCw, CheckCircle2, Clock } from 'lucide-react';

export default function PublicTrackingPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPublicTracking();
  }, [token]);

  const fetchPublicTracking = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/public/track/${token}`);
      if (res.data.success) {
        setData(res.data.tracking);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired tracking link');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center text-xs">
        <RefreshCw className="w-8 h-8 animate-spin text-sky-400 mb-3" />
        <p className="font-bold text-slate-300">Loading secure tracking details...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center text-xs space-y-3">
        <Package className="w-12 h-12 text-rose-500 mb-1" />
        <h2 className="text-lg font-extrabold text-white">Tracking Link Expired or Invalid</h2>
        <p className="text-slate-400 max-w-sm">{error || 'This public tracking token could not be verified.'}</p>
      </div>
    );
  }

  const { order, maskedPickupAddress, maskedDropAddress, slaStatus, estimatedMinutes } = data;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-extrabold border border-sky-500/30">
              GUEST PUBLIC TRACKING
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold border border-emerald-500/30">
              {slaStatus || 'ON TIME'}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white font-mono mt-1">#{order.orderNumber}</h1>
          <p className="text-xs text-slate-400 mt-0.5">Secure QR / Share Tracking Stream (PII Protected)</p>
        </div>

        <div className="text-right">
          <div className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-xl border border-emerald-500/20 inline-block">
            Status: {order.status.replace(/_/g, ' ')}
          </div>
          <p className="text-xs text-slate-400 mt-1">Est. Arrival: <strong className="text-white">{estimatedMinutes || 25} min</strong></p>
        </div>
      </div>

      {/* Live Map Vector Graphic */}
      <RouteMapGraphic order={order} />

      {/* Safe Route Summary */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
        <h3 className="font-extrabold text-slate-400 uppercase tracking-widest text-[10px]">SAFE LOGISTICS ROUTE SUMMARY</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-extrabold text-sky-400 uppercase">ORIGIN</span>
            <div className="font-bold text-white text-sm">{maskedPickupAddress}</div>
            <div className="text-slate-500">Pincode: {order.pickupPincode}</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-extrabold text-emerald-400 uppercase">DESTINATION</span>
            <div className="font-bold text-white text-sm">{maskedDropAddress}</div>
            <div className="text-slate-500">Pincode: {order.dropPincode}</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-sky-950/40 border border-sky-800/40 text-slate-300 flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-sky-400" /> Customer personal identity & phone numbers are protected on public guest links.
          </span>
          <span className="font-mono text-sky-400 font-bold">FastMile Logistics</span>
        </div>
      </div>
    </div>
  );
}
