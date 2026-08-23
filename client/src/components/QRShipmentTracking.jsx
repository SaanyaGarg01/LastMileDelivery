import React, { useState, useRef } from 'react';
import axios from '../api/axios';
import QRCode from 'qrcode';

/**
 * QR Shipment Tracking Component
 * Generates scannable QR codes for order tracking
 */
export default function QRShipmentTracking({ orderId, onClose }) {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);

  const generateQR = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`/admin/orders/${orderId}/tracking-qr`);
      setQrData(res.data);

      // Generate QR code image
      const canvas = canvasRef.current;
      if (canvas && res.data.trackingUrl) {
        QRCode.toCanvas(canvas, res.data.trackingUrl, { width: 300 }, (err) => {
          if (err) {
            setError('Failed to generate QR code');
          }
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate tracking QR');
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = async () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = `tracking-${qrData.orderNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span>📱</span> Order Tracking QR
          </h2>
          <button
            onClick={onClose}
            className="text-2xl text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {!qrData ? (
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Generate a scannable QR code for quick order tracking
            </p>
            <button
              onClick={generateQR}
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
            >
              {loading ? 'Generating...' : 'Generate Tracking QR'}
            </button>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <p className="text-sm text-gray-600">
              Order: <strong>{qrData.orderNumber}</strong>
            </p>

            <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
              <canvas ref={canvasRef} className="w-full"></canvas>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-gray-600 mb-2">Tracking URL:</p>
              <p className="text-xs text-blue-600 font-mono break-all truncate max-h-12 overflow-auto">
                {qrData.trackingUrl}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={downloadQR}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
              >
                📥 Download
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Share this QR code with customers for instant tracking
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
