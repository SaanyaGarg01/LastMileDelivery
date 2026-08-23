import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Play, Pause, RotateCcw, X, MapPin, Navigation, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RouteReplayModal({ orderId, onClose }) {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchRoutePoints();
  }, [orderId]);

  useEffect(() => {
    let timer;
    if (isPlaying && points.length > 0) {
      timer = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= points.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, points]);

  const fetchRoutePoints = async () => {
    try {
      const res = await api.get(`/orders/${orderId}/route`);
      if (res.data.success) {
        setPoints(res.data.points || []);
      }
    } catch {
      toast.error('Failed to load route points');
    } finally {
      setLoading(false);
    }
  };

  const currentPoint = points[currentIndex] || null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-sky-600 animate-pulse" /> Animated Route Replay
            </h3>
            <p className="text-xs text-slate-500">Visual playback of actual GPS coordinates recorded during delivery.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs animate-pulse">Loading location history...</div>
        ) : points.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold">No recorded GPS points for this shipment.</p>
            <p className="text-[11px] text-slate-400">Route history is automatically captured during active agent delivery updates.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Visual Route Replay Map Simulation Canvas */}
            <div className="relative h-64 bg-slate-900 rounded-xl overflow-hidden p-4 border border-slate-800 flex flex-col justify-between">
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span className="bg-slate-800/80 px-3 py-1 rounded-full font-mono text-[11px]">
                  Step {currentIndex + 1} of {points.length}
                </span>
                <span className="flex items-center gap-1 text-sky-400 font-mono text-[11px]">
                  <Clock className="w-3.5 h-3.5" /> {currentPoint ? new Date(currentPoint.timestamp).toLocaleTimeString() : ''}
                </span>
              </div>

              {/* Dynamic Coordinate Card */}
              {currentPoint && (
                <div className="bg-slate-800/90 backdrop-blur-xs p-4 rounded-xl border border-slate-700 space-y-2 max-w-sm mx-auto w-full text-center">
                  <div className="flex justify-center items-center gap-2 text-sky-400 font-bold text-xs">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span>Lat: {currentPoint.latitude.toFixed(4)}</span>
                    <span>•</span>
                    <span>Lng: {currentPoint.longitude.toFixed(4)}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Recorded: {new Date(currentPoint.timestamp).toLocaleString()}
                  </div>
                </div>
              )}

              {/* Progress Track Bar */}
              <div className="space-y-1">
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / points.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setCurrentIndex(0);
                  setIsPlaying(false);
                }}
                className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all"
                title="Reset Replay"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                {isPlaying ? <><Pause className="w-4 h-4" /> Pause Replay</> : <><Play className="w-4 h-4" /> Play Route</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
