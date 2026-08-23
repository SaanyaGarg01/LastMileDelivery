import React, { useState, useEffect } from 'react';
import axios from '../api/axios';

/**
 * Assignment Explanation Modal Component
 * Shows why a specific agent was assigned to an order
 */
export default function AssignmentExplanationModal({ orderId, onClose }) {
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchExplanation();
  }, [orderId]);

  const fetchExplanation = async () => {
    try {
      const res = await axios.get(`/admin/orders/${orderId}/assignment-explanation`);
      setExplanation(res.data.explanation);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch assignment explanation');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full p-6">
          <p className="text-gray-600 text-center">Loading assignment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full p-6">
          <p className="text-red-600">{error}</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!explanation) {
    return null;
  }

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 90) return 'bg-green-50';
    if (score >= 75) return 'bg-blue-50';
    if (score >= 60) return 'bg-orange-50';
    return 'bg-red-50';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🤖</span>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Smart Assignment</h2>
              <p className="text-sm text-gray-600">Order {explanation.agentName ? '• Assigned' : '• Unassigned'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-2xl text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {explanation.status === 'UNASSIGNED' ? (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-center">
              <p className="text-orange-700 font-semibold">{explanation.message}</p>
            </div>
          ) : (
            <>
              {/* Agent Summary */}
              <div className={`p-6 rounded-lg border-2 ${getScoreBgColor(explanation.assignmentScore)}`}>
                <div className="grid grid-cols-2 gap-6 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Selected Agent</p>
                    <p className="text-2xl font-bold text-gray-800">{explanation.agentName}</p>
                    <p className="text-sm text-gray-600 mt-1">{explanation.agentPhone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Assignment Score</p>
                    <p className={`text-4xl font-bold ${getScoreColor(explanation.assignmentScore)}`}>
                      {explanation.assignmentScore}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">out of {explanation.assignmentScoreMax}</p>
                  </div>
                </div>

                {/* Score Bar */}
                <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full ${
                      explanation.assignmentScore >= 90
                        ? 'bg-green-500'
                        : explanation.assignmentScore >= 75
                          ? 'bg-blue-500'
                          : 'bg-orange-500'
                    } transition-all`}
                    style={{ width: `${(explanation.assignmentScore / 100) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Scoring Factors */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Assignment Scoring Breakdown</h3>
                <div className="space-y-3">
                  {explanation.factors.map((factor, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-800">{factor.name}</span>
                        <span className="text-sm font-bold text-gray-700">
                          {factor.score} / {factor.maxScore} (weight: {factor.weight}%)
                        </span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${(factor.score / factor.maxScore) * 100}%` }}
                        ></div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Current Value</p>
                          <p className="font-semibold text-gray-800">{factor.value}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Assessment</p>
                          <p className="font-semibold text-gray-800">{factor.explanation}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Why This Agent */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-bold text-gray-800 mb-3">✓ Why {explanation.agentName}?</h3>
                <ul className="space-y-2">
                  {explanation.reasons.map((reason, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendation Summary */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-700 leading-relaxed">
                  <strong>Recommendation:</strong> {explanation.recommendationSummary}
                </p>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium text-gray-800 transition-colors"
            >
              Close
            </button>
            {explanation.status === 'ASSIGNED' && (
              <button
                onClick={() => window.location.href = `/admin/orders/${orderId}`}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-white transition-colors"
              >
                View Full Order
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
