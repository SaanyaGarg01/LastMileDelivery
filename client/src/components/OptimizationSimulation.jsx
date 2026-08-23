import React, { useState } from 'react';
import axios from '../api/axios';

/**
 * Optimization Simulation Component
 * Shows impact of smart routing vs baseline assignment
 */
export default function OptimizationSimulation() {
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runSimulation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/admin/optimization/simulate');
      setSimulation(res.data.simulation);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to run simulation');
    } finally {
      setLoading(false);
    }
  };

  const getImprovementColor = (improvement) => {
    if (improvement > 0) return 'text-green-600';
    if (improvement < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getImprovementBgColor = (improvement) => {
    if (improvement > 0) return 'bg-green-50';
    if (improvement < 0) return 'bg-red-50';
    return 'bg-gray-50';
  };

  return (
    <div className="space-y-6">
      {/* Header & CTA */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">⚡</span>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Optimization Impact</h2>
            <p className="text-sm text-gray-600">
              Compare baseline vs intelligent assignment performance
            </p>
          </div>
        </div>

        <button
          onClick={runSimulation}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
        >
          {loading ? '⏳ Running Simulation...' : '▶ Run Optimization Simulation'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {simulation && (
        <div className="space-y-6">
          {/* Simulation Info */}
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-sm text-gray-600 mb-2">Simulation Date</p>
            <p className="text-lg font-semibold text-gray-800">{simulation.simulationDate}</p>
            <p className="text-sm text-gray-600 mt-2">
              Analyzed {simulation.ordersAnalyzed} completed deliveries
            </p>
            <p className="text-xs text-gray-500 mt-1">{simulation.note}</p>
          </div>

          {/* Metrics Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                name: 'Avg Delivery Time',
                key: 'deliveryTime',
                unit: 'min',
                direction: 'lower',
              },
              { name: 'Avg Delivery Distance', key: 'distance', unit: 'km', direction: 'lower' },
              { name: 'Success Rate', key: 'successRate', unit: '%', direction: 'higher' },
              { name: 'Fleet Utilization', key: 'utilization', unit: '%', direction: 'higher' },
              { name: 'SLA Compliance', key: 'slaCompliance', unit: '%', direction: 'higher' },
              {
                name: 'Assignment Quality',
                key: 'assignmentQuality',
                unit: 'score',
                direction: 'higher',
              },
            ].map((metric, i) => {
              const data = simulation.improvements[metric.key];
              const improvement = data.improvement;
              const isPositive = (metric.direction === 'lower' && improvement < 0) || 
                               (metric.direction === 'higher' && improvement > 0);

              return (
                <div
                  key={i}
                  className={`p-4 rounded-lg border-2 ${
                    isPositive
                      ? 'bg-green-50 border-green-300'
                      : improvement === 0
                        ? 'bg-gray-50 border-gray-300'
                        : 'bg-red-50 border-red-300'
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-700 mb-3">{metric.name}</p>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="text-center p-2 bg-white rounded border">
                      <p className="text-xs text-gray-600">Baseline</p>
                      <p className="text-lg font-bold text-gray-800">
                        {Math.round(data.baseline)}{metric.unit}
                      </p>
                    </div>
                    <div className="text-center p-2 bg-white rounded border">
                      <p className="text-xs text-gray-600">Smart</p>
                      <p className="text-lg font-bold text-blue-600">
                        {Math.round(data.optimized)}{metric.unit}
                      </p>
                    </div>
                  </div>

                  <div className={`text-center p-2 rounded ${getImprovementBgColor(improvement)}`}>
                    <p className={`text-lg font-bold ${getImprovementColor(improvement)}`}>
                      {improvement > 0 ? '+' : ''}{improvement}
                      {metric.key !== 'assignmentQuality' ? '%' : ''}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {isPositive
                        ? metric.direction === 'lower'
                          ? 'Time saved'
                          : 'Improvement'
                        : 'No change'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Key Improvements */}
          {simulation.improvements && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 border-2 border-blue-300">
              <h3 className="text-lg font-bold text-gray-800 mb-4">🎯 Key Improvements with Smart Assignment</h3>

              <div className="space-y-3">
                {Object.entries(simulation.improvements).map(([key, data], i) => {
                  if (data.improvement === 0) return null;
                  const isPositive =
                    (data.direction === 'Lower is better' && data.improvement < 0) ||
                    (data.direction === 'Higher is better' && data.improvement > 0);

                  return (
                    <div
                      key={i}
                      className="p-3 bg-white rounded border-l-4 border-blue-500"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </p>
                          <p className="text-xs text-gray-600">{data.direction}</p>
                        </div>
                        <span
                          className={`text-xl font-bold px-3 py-1 rounded ${
                            isPositive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {data.improvement > 0 ? '+' : ''}{data.improvement}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {simulation.recommendations && simulation.recommendations.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">💡 Recommendations</h3>

              <div className="space-y-3">
                {simulation.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-lg border-l-4 ${
                      rec.impact === 'HIGH'
                        ? 'bg-red-50 border-red-500'
                        : rec.impact === 'MEDIUM'
                          ? 'bg-orange-50 border-orange-500'
                          : 'bg-blue-50 border-blue-500'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">
                        {rec.impact === 'HIGH' ? '🚨' : rec.impact === 'MEDIUM' ? '⚠️' : 'ℹ️'}
                      </span>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{rec.metric}</p>
                        <p className="text-sm text-gray-700 mt-1">{rec.recommendation}</p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded font-semibold whitespace-nowrap ${
                          rec.impact === 'HIGH'
                            ? 'bg-red-200 text-red-700'
                            : rec.impact === 'MEDIUM'
                              ? 'bg-orange-200 text-orange-700'
                              : 'bg-blue-200 text-blue-700'
                        }`}
                      >
                        {rec.impact}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scale Scenario */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Agent Scaling Scenario</h3>
            <p className="text-sm text-gray-600 mb-4">
              See the impact of adding more agents to your fleet
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 5].map((num) => (
                <button
                  key={num}
                  onClick={async () => {
                    try {
                      const res = await axios.post('/admin/optimization/scaling-scenario', {
                        additionalAgents: num,
                      });
                      alert(`Adding ${num} agents would reduce utilization to ${
                        res.data.scenario.projectedUtilization
                      }%`);
                    } catch (err) {
                      console.error('Failed to run scenario');
                    }
                  }}
                  className="p-4 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-lg transition-colors"
                >
                  <p className="font-bold text-blue-600 text-lg">+{num}</p>
                  <p className="text-xs text-gray-600 mt-1">agents</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!simulation && !loading && (
        <div className="bg-blue-50 rounded-lg border-2 border-blue-300 p-12 text-center">
          <span className="text-5xl">📊</span>
          <p className="mt-3 text-gray-700 font-semibold">Ready to optimize?</p>
          <p className="text-sm text-gray-600 mt-1">
            Click "Run Optimization Simulation" to see the impact of intelligent routing
          </p>
        </div>
      )}
    </div>
  );
}
