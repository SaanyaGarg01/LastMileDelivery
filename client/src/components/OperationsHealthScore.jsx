import React, { useState, useEffect } from 'react';
import axios from '../api/axios';

/**
 * Operations Health Score Component
 * Overall logistics performance dashboard
 */
export default function OperationsHealth() {
  const [health, setHealth] = useState(null);
  const [trend, setTrend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchHealth = async () => {
    try {
      const res = await axios.get('/admin/operations-health');
      setHealth(res.data.health);
      setTrend(res.data.trend);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch health metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !health) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600">Loading operations health...</p>
      </div>
    );
  }

  if (error || !health) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-red-600">{error || 'No data'}</p>
      </div>
    );
  }

  const getHealthColor = (level) => {
    if (level === 'EXCELLENT') return 'from-green-500 to-green-600';
    if (level === 'GOOD') return 'from-blue-500 to-blue-600';
    if (level === 'FAIR') return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  const getMetricStatusColor = (status) => {
    if (status === 'EXCELLENT') return 'text-green-600 bg-green-50';
    if (status === 'GOOD') return 'text-blue-600 bg-blue-50';
    if (status === 'FAIR') return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const renderProgressBar = (score, maxScore = 100) => {
    const percentage = (score / maxScore) * 100;
    const barColor = score >= 90 ? 'bg-green-500' : score >= 75 ? 'bg-blue-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500';

    return (
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Main Score Card */}
      <div className={`bg-gradient-to-r ${getHealthColor(health.healthLevel)} rounded-lg shadow-lg p-8 text-white`}>
        <div className="text-center mb-6">
          <p className="text-sm opacity-90 mb-2">Operations Health Score</p>
          <div className="text-6xl font-bold mb-2">{health.overallScore}</div>
          <div className="text-xl font-semibold">{health.healthLevel}</div>
        </div>

        {/* Quick Status */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white border-opacity-20">
          <div className="text-center">
            <p className="text-sm opacity-80">Last Updated</p>
            <p className="text-xs mt-1">
              {new Date(health.timestamp).toLocaleTimeString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm opacity-80">Status</p>
            <p className="text-sm font-semibold mt-1">●  Active</p>
          </div>
          <div className="text-center">
            <p className="text-sm opacity-80">Trend</p>
            <p className="text-sm font-semibold mt-1">↗ Stable</p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {health.metrics.map((metric, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700">{metric.name}</p>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getMetricStatusColor(metric.status)}`}>
                {metric.status}
              </span>
            </div>

            <div className="mb-3">
              <p className="text-3xl font-bold text-gray-800">{metric.score}</p>
              <p className="text-xs text-gray-500 mt-1">{metric.weight}% weight</p>
            </div>

            {renderProgressBar(metric.score)}

            <p className="text-xs text-gray-600 mt-2 line-clamp-2">{metric.description}</p>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {health.recommendations && health.recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">💡 Recommended Actions</h3>

          <div className="space-y-3">
            {health.recommendations.map((rec, i) => (
              <div
                key={i}
                className={`p-4 rounded-lg border-l-4 ${
                  rec.priority === 'HIGH'
                    ? 'bg-red-50 border-red-500'
                    : rec.priority === 'MEDIUM'
                      ? 'bg-orange-50 border-orange-500'
                      : 'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl mt-1">
                    {rec.priority === 'HIGH' ? '🚨' : rec.priority === 'MEDIUM' ? '⚠️' : 'ℹ️'}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{rec.action}</p>
                    <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-semibold whitespace-nowrap ${
                    rec.priority === 'HIGH'
                      ? 'bg-red-200 text-red-700'
                      : rec.priority === 'MEDIUM'
                        ? 'bg-orange-200 text-orange-700'
                        : 'bg-blue-200 text-blue-700'
                  }`}>
                    {rec.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trend Chart */}
      {trend && trend.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📈 7-Day Trend</h3>

          <div className="flex items-end justify-between h-32 gap-2 p-4 bg-gray-50 rounded-lg">
            {trend.map((item, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full h-24 bg-gradient-to-t from-blue-400 to-blue-200 rounded-t-lg relative group hover:from-blue-500 hover:to-blue-300 transition-colors"
                  style={{ height: `${Math.max(item.successRate / 4, 10)}px` }}
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.successRate}%
                  </span>
                </div>
                <p className="text-xs text-gray-600 font-medium">{item.date.split('-')[2]}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-600">Best Day</p>
              <p className="text-lg font-bold text-green-600">
                {Math.max(...trend.map((t) => t.successRate))}%
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-600">Average</p>
              <p className="text-lg font-bold text-blue-600">
                {Math.round(trend.reduce((s, t) => s + t.successRate, 0) / trend.length)}%
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-600">Worst Day</p>
              <p className="text-lg font-bold text-orange-600">
                {Math.min(...trend.map((t) => t.successRate))}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
