import React, { useState, useEffect } from 'react';
import axios from '../api/axios';

/**
 * Rate Explanation Modal Component
 * Shows detailed breakdown of how order price was calculated
 */
export default function RateExplanationModal({ orderId, onClose }) {
  const [explanation, setExplanation] = useState(null);
  const [scenarios, setScenarios] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchExplanation();
  }, [orderId]);

  const fetchExplanation = async () => {
    try {
      const [expRes, scenRes] = await Promise.all([
        axios.get(`/admin/orders/${orderId}/rate-explanation`),
        axios.post(`/admin/orders/${orderId}/rate-scenarios`),
      ]);
      setExplanation(expRes.data.explanation);
      setScenarios(scenRes.data.scenarios);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch rate explanation');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full p-6 text-center">
          <p className="text-gray-600">Loading price breakdown...</p>
        </div>
      </div>
    );
  }

  if (error || !explanation) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full p-6">
          <p className="text-red-600">{error || 'No data'}</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💰</span>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Rate Calculation</h2>
              <p className="text-sm text-gray-600">Order {explanation.orderNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-2xl text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Package Section */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-blue-50 p-4 border-b font-bold text-gray-800">📦 PACKAGE</div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Length</p>
                  <p className="text-lg font-semibold text-gray-800">{explanation.package.dimensions.length} cm</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Breadth</p>
                  <p className="text-lg font-semibold text-gray-800">{explanation.package.dimensions.breadth} cm</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Height</p>
                  <p className="text-lg font-semibold text-gray-800">{explanation.package.dimensions.height} cm</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Actual Weight</p>
                  <p className="text-lg font-semibold text-gray-800">{explanation.package.weight.actual} kg</p>
                </div>
              </div>

              {/* Volumetric Calculation */}
              <div className="p-4 bg-gray-50 rounded-lg border">
                <p className="font-semibold text-gray-800 mb-2">Volumetric Weight Calculation</p>
                <p className="text-sm text-gray-700 mb-2">Formula: L × B × H ÷ 5000</p>
                <p className="text-sm text-gray-700">{explanation.package.volumetricCalculation.calculation}</p>
                <p className="mt-2 text-lg font-bold text-blue-600">
                  Volumetric Weight: {explanation.package.volumetricWeight} kg
                </p>
              </div>

              {/* Chargeable Weight */}
              <div className={`p-4 rounded-lg border-2 ${
                explanation.package.chargeableWeight.determinedBy === 'volumetric'
                  ? 'bg-orange-50 border-orange-300'
                  : 'bg-green-50 border-green-300'
              }`}>
                <p className="font-semibold text-gray-800 mb-1">Chargeable Weight</p>
                <p className="text-3xl font-bold text-gray-800 mb-2">
                  {explanation.package.chargeableWeight.value} kg
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Determined by:</strong> {explanation.package.chargeableWeight.determinedBy.toUpperCase()}
                </p>
                <p className="text-xs text-gray-600">{explanation.package.chargeableWeight.explanation}</p>
              </div>
            </div>
          </div>

          {/* Zone Section */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-green-50 p-4 border-b font-bold text-gray-800">📍 ZONE</div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Pickup Zone</p>
                  <p className="font-semibold text-gray-800">{explanation.zone.pickup}</p>
                </div>
                <div className="flex items-center justify-center">
                  <p className="text-xl">→</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Drop Zone</p>
                  <p className="font-semibold text-gray-800">{explanation.zone.drop}</p>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-600">Route Type</p>
                <p className="font-semibold text-gray-800">{explanation.zone.route}</p>
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-purple-50 p-4 border-b font-bold text-gray-800">₹ COST BREAKDOWN</div>
            <div className="p-4 space-y-2">
              {explanation.costBreakdown.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-semibold text-gray-800">{item.component}</p>
                    <p className="text-xs text-gray-600">{item.breakdown}</p>
                  </div>
                  <p className="text-lg font-bold text-gray-800">₹{item.amount}</p>
                </div>
              ))}

              {/* Total */}
              <div className="mt-4 p-4 bg-blue-100 rounded-lg border-2 border-blue-500">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-bold text-gray-800">Total Amount</p>
                  <p className="text-3xl font-bold text-blue-600">₹{explanation.totalAmount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* What-If Scenarios */}
          {scenarios && scenarios.length > 1 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-orange-50 p-4 border-b font-bold text-gray-800">❓ WHAT-IF SCENARIOS</div>
              <div className="p-4 space-y-2">
                {scenarios.map((scenario, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-800">{scenario.name}</p>
                        <p className="text-xs text-gray-600">{scenario.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-800">₹{scenario.amount}</p>
                        {scenario.difference && (
                          <p className={`text-sm font-semibold ${
                            scenario.difference > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {scenario.difference > 0 ? '+' : ''}₹{scenario.difference}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary Notes */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="font-semibold text-gray-800 mb-2">📋 Summary</p>
            <ul className="space-y-1 text-sm text-gray-700">
              {explanation.notes.map((note, i) => (
                <li key={i}>• {note}</li>
              ))}
            </ul>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium text-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
