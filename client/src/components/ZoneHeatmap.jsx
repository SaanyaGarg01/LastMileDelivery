import React, { useState, useEffect } from 'react';
import axios from '../api/axios';

/**
 * Zone Heatmap Component
 * Visualizes operational intensity across zones
 */
export default function ZoneHeatmap() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [zoneDetails, setZoneDetails] = useState(null);

  useEffect(() => {
    fetchHeatmap();
    const interval = setInterval(fetchHeatmap, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchHeatmap = async () => {
    try {
      const res = await axios.get('/admin/zones/heatmap');
      setZones(res.data.zones);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch zone heatmap');
    } finally {
      setLoading(false);
    }
  };

  const fetchZoneDetails = async (zoneId) => {
    try {
      const res = await axios.get(`/admin/zones/${zoneId}/performance`);
      setZoneDetails(res.data);
    } catch (err) {
      console.error('Failed to fetch zone details');
    }
  };

  const handleZoneClick = (zone) => {
    setSelectedZone(zone.zoneId);
    fetchZoneDetails(zone.zoneId);
  };

  if (loading && zones.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600">Loading zone heatmap...</p>
      </div>
    );
  }

  const sortedZones = [...zones].sort((a, b) => b.intensityScore - a.intensityScore);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🗺️</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Zone Heatmap</h2>
              <p className="text-sm text-gray-600">Operational intensity by delivery zone</p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 rounded"></div>
            <span className="text-sm font-medium text-gray-700">Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-yellow-500 rounded"></div>
            <span className="text-sm font-medium text-gray-700">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-orange-500 rounded"></div>
            <span className="text-sm font-medium text-gray-700">High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-500 rounded"></div>
            <span className="text-sm font-medium text-gray-700">Critical</span>
          </div>
        </div>
      </div>

      {/* Zones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedZones.map((zone) => (
          <button
            key={zone.zoneId}
            onClick={() => handleZoneClick(zone)}
            className={`p-6 rounded-lg border-2 transition-all transform hover:scale-105 cursor-pointer ${
              zone.intensityLevel === 'CRITICAL'
                ? 'bg-red-50 border-red-300 hover:border-red-500'
                : zone.intensityLevel === 'HIGH'
                  ? 'bg-orange-50 border-orange-300 hover:border-orange-500'
                  : zone.intensityLevel === 'MEDIUM'
                    ? 'bg-yellow-50 border-yellow-300 hover:border-yellow-500'
                    : 'bg-green-50 border-green-300 hover:border-green-500'
            }`}
          >
            {/* Zone Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-800 text-lg">{zone.zoneName}</h3>
                <p className="text-xs text-gray-600">{zone.zoneCode}</p>
              </div>
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-white text-2xl ${
                  zone.intensityLevel === 'CRITICAL'
                    ? 'bg-red-500'
                    : zone.intensityLevel === 'HIGH'
                      ? 'bg-orange-500'
                      : zone.intensityLevel === 'MEDIUM'
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                }`}
              >
                {zone.intensityScore}
              </div>
            </div>

            {/* Intensity Bar */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-gray-700">Intensity</span>
                <span className="text-xs font-bold text-gray-700">{zone.intensityLevel}</span>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    zone.intensityLevel === 'CRITICAL'
                      ? 'bg-red-500'
                      : zone.intensityLevel === 'HIGH'
                        ? 'bg-orange-500'
                        : zone.intensityLevel === 'MEDIUM'
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                  }`}
                  style={{ width: `${zone.intensityScore}%` }}
                ></div>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-2 bg-white rounded text-center">
                <p className="text-xs text-gray-600">Active Orders</p>
                <p className="font-bold text-gray-800">{zone.activeOrders}</p>
              </div>
              <div className="p-2 bg-white rounded text-center">
                <p className="text-xs text-gray-600">Success Rate</p>
                <p className="font-bold text-gray-800">{zone.successRate}%</p>
              </div>
              <div className="p-2 bg-white rounded text-center">
                <p className="text-xs text-gray-600">Agents</p>
                <p className="font-bold text-gray-800">{zone.agentCount}</p>
              </div>
              <div className="p-2 bg-white rounded text-center">
                <p className="text-xs text-gray-600">Utilization</p>
                <p className="font-bold text-gray-800">{zone.capacityUtilization}%</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Zone Details */}
      {selectedZone && zoneDetails && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">📊 {zoneDetails.performance.zoneName} Details</h3>
            <button
              onClick={() => setSelectedZone(null)}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Today's Orders</p>
              <p className="text-3xl font-bold text-blue-600">{zoneDetails.performance.ordersToday}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Delivered</p>
              <p className="text-3xl font-bold text-green-600">{zoneDetails.performance.delivered}</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600">SLA At Risk</p>
              <p className="text-3xl font-bold text-orange-600">{zoneDetails.performance.slaAtRisk}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-3xl font-bold text-red-600">{zoneDetails.performance.failedToday}</p>
            </div>
          </div>

          {/* Peak Hours */}
          {zoneDetails.peakHours && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold text-gray-800 mb-2">Peak Hours</p>
              <p className="text-sm text-gray-600">{zoneDetails.peakHours.peakLabel}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
