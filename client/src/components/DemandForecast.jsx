import React, { useState, useEffect } from 'react';
import axios from '../api/axios';

/**
 * Demand Forecast Component
 * Predicts delivery demand for coming days
 */
export default function DemandForecast() {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchForecast();
  }, []);

  const fetchForecast = async () => {
    try {
      const res = await axios.get('/admin/demand-forecast');
      setForecast(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch demand forecast');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600">Loading demand forecast...</p>
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

  if (!forecast) return null;

  const getDemandColor = (level) => {
    if (level === 'CRITICAL') return 'bg-red-100 border-red-300 text-red-700';
    if (level === 'HIGH') return 'bg-orange-100 border-orange-300 text-orange-700';
    if (level === 'MEDIUM') return 'bg-yellow-100 border-yellow-300 text-yellow-700';
    return 'bg-green-100 border-green-300 text-green-700';
  };

  const getDemandBarColor = (level) => {
    if (level === 'CRITICAL') return 'bg-red-500';
    if (level === 'HIGH') return 'bg-orange-500';
    if (level === 'MEDIUM') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🔮</span>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Demand Forecast</h2>
            <p className="text-sm text-gray-600">
              7-day prediction based on {forecast.forecast?.baselinePeriod || '30-day'} historical data
            </p>
          </div>
        </div>

        {forecast.forecast?.status === 'INSUFFICIENT_DATA' ? (
          <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
            <p className="text-yellow-700 font-semibold">{forecast.forecast.message}</p>
            <button className="mt-3 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded font-medium text-sm">
              {forecast.forecast.suggestion}
            </button>
          </div>
        ) : (
          <>
            {/* Confidence & Metadata */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 text-sm text-gray-700">
              <p className="mb-2">
                <strong>Data Points:</strong> {forecast.forecast?.baselinePeriod || 'N/A'}
              </p>
              <p>
                <strong>Forecast Confidence:</strong>{' '}
                <span className="font-semibold">
                  {forecast.metadata?.confidence || 'N/A'}
                </span>
              </p>
            </div>
          </>
        )}
      </div>

      {/* Zone Forecasts */}
      {forecast.forecast?.forecast && forecast.forecast.forecast.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">📍 Demand by Zone</h3>

          <div className="space-y-4">
            {forecast.forecast.forecast.map((zone, i) => (
              <div
                key={i}
                className={`p-4 rounded-lg border-2 ${getDemandColor(zone.demandLevel)} transition-all hover:shadow-md`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-lg">{zone.zoneName}</h4>
                    <p className="text-sm opacity-80">
                      ~{Math.round(zone.averageDailyOrders)} orders/day | Peak: {zone.peakHours}
                    </p>
                  </div>
                  <span className="text-2xl font-bold">{Math.round(zone.averageDailyOrders * 7)}</span>
                </div>

                {/* Demand Bar */}
                <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getDemandBarColor(zone.demandLevel)} flex items-center justify-center text-white text-xs font-bold transition-all`}
                    style={{ width: `${zone.demandBar}%` }}
                  >
                    {zone.demandBar > 20 && `${zone.demandLevel}`}
                  </div>
                </div>

                {/* Recommendation */}
                <p className="mt-3 text-sm font-semibold text-gray-800">
                  ⚡ {zone.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hourly Pattern */}
      {forecast.hourlyPattern?.hourly && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">🕐 Hourly Demand Pattern</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chart */}
            <div>
              <div className="h-40 flex items-end justify-between gap-1 p-4 bg-gray-50 rounded-lg border">
                {forecast.hourlyPattern.hourly.map((hour, i) => {
                  const maxOrders = Math.max(...forecast.hourlyPattern.hourly.map((h) => h.averageOrders));
                  const heightPercent = (hour.averageOrders / maxOrders) * 100;
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-2 group"
                    >
                      <div
                        className="w-full bg-gradient-to-t from-blue-400 to-blue-200 rounded-t transition-all group-hover:from-blue-500 group-hover:to-blue-300 relative"
                        style={{ height: `${Math.max(heightPercent, 5)}px` }}
                      >
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {hour.averageOrders}
                        </span>
                      </div>
                      <span className="text-xs text-gray-600 font-medium">{hour.hour}:00</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Peak Hours */}
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                <p className="text-sm text-gray-600">Peak Hour</p>
                <p className="text-2xl font-bold text-red-600">
                  {forecast.hourlyPattern.peakLabel}
                </p>
                <p className="text-sm text-red-700 mt-2">
                  ~{forecast.hourlyPattern.peakHour === 0 ? 0 : Math.round(Math.max(...forecast.hourlyPattern.hourly.map((h) => h.averageOrders)))} orders/hour
                </p>
              </div>

              <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                <p className="text-sm text-gray-600">Average</p>
                <p className="text-2xl font-bold text-blue-600">
                  {forecast.hourlyPattern.averageOrdersPerHour || 'N/A'} orders/hour
                </p>
              </div>

              <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                <p className="text-sm text-gray-600">Recommendation</p>
                <p className="text-sm text-green-700 font-semibold mt-2">
                  Allocate additional fleet resources during peak hours
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* By Order Type */}
      {forecast.byOrderType?.forecast && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">📦 Forecast by Order Type</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {forecast.byOrderType.forecast.map((type, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-gray-800">{type.type}</span>
                  <span className="text-2xl font-bold text-gray-800">{type.percentage}%</span>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden mb-3">
                  <div
                    className={`h-full ${type.type === 'B2B' ? 'bg-blue-500' : 'bg-purple-500'} transition-all`}
                    style={{ width: `${type.percentage}%` }}
                  ></div>
                </div>
                <div className="text-sm text-gray-600">
                  <p>
                    <strong>Avg Daily:</strong> {Math.round(type.averageDaily)} orders
                  </p>
                  <p>
                    <strong>Demand:</strong>{' '}
                    <span className={`font-semibold ${
                      type.demandLevel === 'HIGH' ? 'text-orange-600' : 'text-gray-700'
                    }`}>
                      {type.demandLevel}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Methodology */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 text-sm text-gray-700">
        <p className="font-semibold mb-2">📊 Forecast Methodology</p>
        <p>{forecast.forecast?.methodology || 'Statistical analysis of historical order patterns'}</p>
        {forecast.metadata?.caveats && (
          <>
            <p className="font-semibold mt-3 mb-2">Caveats:</p>
            <ul className="space-y-1 ml-4">
              {forecast.metadata.caveats.map((caveat, i) => (
                <li key={i}>• {caveat}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
