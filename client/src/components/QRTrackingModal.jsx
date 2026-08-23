import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { QrCode, RefreshCw, X, ExternalLink, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QRTrackingModal({ orderId, isOpen, onClose }) {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && orderId) {
      generateQR();
    }
  }, [isOpen, orderId]);

  const generateQR = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/orders/${orderId}/tracking-qr`);
      if (res.data.success) {
        setQrData(res.data);
      }
    } catch (err) {
      toast.error('Could not generate tracking QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (qrData?.publicUrl) {
      navigator.clipboard.writeText(qrData.publicUrl);
      toast.success('Public tracking URL copied!');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl border border-slate-200 text-center animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-left">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-sky-600" /> SHIPMENT TRACKING QR
            </h2>
            <p className="text-xs text-slate-400">Scan to track order instantly</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-xs text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-sky-600 mx-auto mb-2" /> Generating secure QR code...
          </div>
        ) : (
          qrData && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl inline-block shadow-inner">
                <img src={qrData.qrSvgDataUri} alt="Tracking QR Code" className="w-48 h-48 mx-auto" />
              </div>
              <div className="space-y-1 text-xs">
                <div className="font-mono font-bold text-slate-900">ORDER #{qrData.orderNumber}</div>
                <div className="text-[11px] text-slate-400">Token: {qrData.token.substring(0, 12)}...</div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Link
                </button>
                <a
                  href={qrData.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open Link
                </a>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
