import React, { useState, useEffect } from 'react';
import axios from '../api/axios';

/**
 * Delivery Risk Radar Component
 * Visual display of shipment risk status with real-time updates
 */
export default function DeliveryRiskRadar() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL'); // ALL, CRITICAL, AT_RISK, ON_TRACK

  useEffect(() => {
    fetchRiskRadar();
    const interval = setInterval(fetchRiskRadar, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchRiskRadar = async () => {
    try {
      const res = await axios.get('/admin/risk-radar');
      setData(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch risk radar data');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600">Loading risk radar...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const filteredOrders = data.criticalOrders.filter((order) => {
    if (filter === 'CRITICAL') return order.riskLevel === 'CRITICAL';
    return true;
  });

  const getRiskColor = (level) => {
    if (level === 'CRITICAL') return 'bg-red-500';
    if (level === 'AT_RISK') return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getRiskBgColor = (level) => {
    if (level === 'CRITICAL') return 'bg-red-50 border-red-200';
    if (level === 'AT_RISK') return 'bg-orange-50 border-orange-200';
    return 'bg-green-50 border-green-200';
  };

  const getRiskBadgeColor = (level) => {
    if (level === 'CRITICAL') return 'bg-red-100 text-red-700';
    if (level === 'AT_RISK') return 'bg-orange-100 text-orange-700';
    return 'bg-green-100 text-green-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🚦</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Delivery Risk Radar</h2>
              <p className="text-sm text-gray-600">Real-time shipment risk monitoring</p>
            </div>
          </div>
          <button
            onClick={fetchRiskRadar}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Risk Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
            <p className="text-sm text-red-700 font-semibold mb-1">CRITICAL</p>
            <p className="text-3xl font-bold text-red-600">{data.summary.CRITICAL}</p>
            <p className="text-xs text-red-600 mt-1">
              {data.riskPercentage.critical}% of active
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-700 font-semibold mb-1">AT RISK</p>
            <p className="text-3xl font-bold text-orange-600">{data.summary.AT_RISK}</p>
            <p className="text-xs text-orange-600 mt-1">
              {data.riskPercentage.atRisk}% of active
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
            <p className="text-sm text-green-700 font-semibold mb-1">ON TRACK</p>
            <p className="text-3xl font-bold text-green-600">{data.summary.ON_TRACK}</p>
            <p className="text-xs text-green-600 mt-1">
              {data.riskPercentage.onTrack}% of active
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700 font-semibold mb-1">TOTAL ACTIVE</p>
            <p className="text-3xl font-bold text-blue-600">{data.totalActive}</p>
            <p className="text-xs text-blue-600 mt-1">Monitored orders</p>
          </div>
        </div>

        {/* Visual Progress Bars */}
        <div className="mt-6 space-y-3">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-700">Risk Distribution</span>
              <span className="text-xs text-gray-600">
                {data.totalActive} active shipments
              </span>
            </div>
            <div className="flex h-8 gap-1 rounded-lg overflow-hidden shadow">
              {data.summary.ON_TRACK > 0 && (
                <div
                  className="bg-green-500 hover:bg-green-600 transition-colors flex items-center justify-center text-white text-xs font-bold"
                  style={{ width: `${(data.summary.ON_TRACK / data.totalActive) * 100}%` }}
                >
                  {data.riskPercentage.onTrack > 5 && `${data.riskPercentage.onTrack}%`}
                </div>
              )}
              {data.summary.AT_RISK > 0 && (
                <div
                  className="bg-orange-500 hover:bg-orange-600 transition-colors flex items-center justify-center text-white text-xs font-bold"
                  style={{ width: `${(data.summary.AT_RISK / data.totalActive) * 100}%` }}
                >
                  {data.riskPercentage.atRisk > 5 && `${data.riskPercentage.atRisk}%`}
                </div>
              )}
              {data.summary.CRITICAL > 0 && (
                <div
                  className="bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center text-white text-xs font-bold"
                  style={{ width: `${(data.summary.CRITICAL / data.totalActive) * 100}%` }}
                >
                  {data.riskPercentage.critical > 5 && `${data.riskPercentage.critical}%`}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Critical Orders List */}
      {data.criticalOrders && data.criticalOrders.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800">🔴 High-Risk Shipments</h3>
            <span className="text-sm text-gray-600">
              {data.criticalOrders.length} orders requiring attention
            </span>
          </div>

          <div className="space-y-3">
            {data.criticalOrders.map((order) => (
              <div
                key={order.orderId}
                className={`p-4 rounded-lg border-2 ${getRiskBgColor(order.riskLevel)} transition-all hover:shadow-md`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-block w-3 h-3 rounded-full ${getRiskColor(order.riskLevel)}`}></span>
                      <span className="font-semibold text-gray-800">{order.orderNumber}</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getRiskBadgeColor(
                        order.riskLevel
                      )}`}>
                        Risk Score: {order.riskScore}/100
                      </span>
                    </div>

                    <p className="text-sm text-gray-700 mb-3">Status: {order.status}</p>

                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <strong>Risk Factors:</strong>
                      </p>
                      <ul className="ml-4 space-y-1">
                        {order.reasons && order.reasons.map((reason, i) => (
                          <li key={i} className="text-xs text-gray-600">
                            • {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <button
                    onClick={() => window.location.href = `/order/${order.orderId}`}
                    className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!data.criticalOrders || data.criticalOrders.length === 0) && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-5xl mb-3">✅</div>
          <p className="text-gray-600 font-semibold">All active shipments are on track!</p>
          <p className="text-sm text-gray-500 mt-1">No high-risk deliveries detected</p>
        </div>
      )}
    </div>
  );
}
