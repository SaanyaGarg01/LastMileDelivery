import React, { useState } from 'react';
import axios from '../api/axios';

/**
 * Logistics Copilot Component
 * AI-assisted operations command for admins
 */
export default function LogisticsCopilot() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const suggestedQuestions = [
    'Why are deliveries delayed today?',
    'Which zone is performing worst?',
    'Show today\'s high-risk deliveries',
    'Which agents are overloaded?',
    'What should I do right now?',
  ];

  const handleQuery = async (q) => {
    setQuery(q);
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await axios.post('/admin/copilot/query', { query: q });
      setResponse(res.data.response);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get Copilot response');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    await handleQuery(query);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">🤖</span>
        <h2 className="text-xl font-bold text-gray-800">Operations Copilot</h2>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask me about your operations..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '...' : 'Ask'}
          </button>
        </div>
      </form>

      {/* Suggested Questions */}
      {!response && !loading && (
        <div className="mb-6">
          <p className="text-sm text-gray-600 font-semibold mb-3">Suggested questions:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleQuery(q)}
                className="text-left p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg text-sm text-gray-700 transition-colors"
              >
                • {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin">⏳</div>
          <span className="ml-3 text-gray-600">Analyzing operations...</span>
        </div>
      )}

      {/* Response */}
      {response && !loading && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <h3 className="font-semibold text-gray-800 mb-3">⚙️ Analysis Result</h3>

            {/* Delay Analysis */}
            {response.delayCount !== undefined && (
              <div>
                <p className="text-gray-700 mb-3">
                  <strong>{response.delayCount} high-risk deliveries</strong> detected out of{' '}
                  <strong>{response.totalOrders} total orders</strong>
                </p>

                {response.causes && response.causes.length > 0 && (
                  <div className="space-y-3 mb-4">
                    <p className="font-semibold text-gray-800">Major causes:</p>
                    {response.causes.map((cause, i) => (
                      <div key={i} className="ml-3 p-3 bg-white rounded border-l-2 border-orange-400">
                        <p className="font-semibold text-gray-700">{i + 1}. {cause.title}</p>
                        <p className="text-sm text-gray-600">{cause.description}</p>
                        {cause.agents && (
                          <div className="text-xs text-gray-500 mt-2">
                            Affected agents: {cause.agents.map((a) => a.name).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {response.recommendations && response.recommendations.length > 0 && (
                  <div className="space-y-2 p-3 bg-green-50 border border-green-200 rounded">
                    <p className="font-semibold text-gray-800">Recommended actions:</p>
                    <ul className="space-y-1">
                      {response.recommendations.map((rec, i) => (
                        <li key={i} className="text-sm text-gray-700">
                          → {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Operational Metrics */}
            {response.orders && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-white rounded border">
                    <p className="text-xs text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-800">{response.orders.total}</p>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <p className="text-xs text-gray-600">Delivered</p>
                    <p className="text-2xl font-bold text-green-600">{response.orders.delivered}</p>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <p className="text-xs text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-blue-600">{response.orders.active}</p>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <p className="text-xs text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold text-gray-800">{response.orders.successRate}%</p>
                  </div>
                </div>

                {response.agents && (
                  <div className="p-3 bg-white rounded border">
                    <p className="font-semibold text-gray-800 mb-2">Fleet Status</p>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">Available</p>
                        <p className="font-semibold">{response.agents.available}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Busy</p>
                        <p className="font-semibold">{response.agents.busy}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Offline</p>
                        <p className="font-semibold">{response.agents.offline}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Zones Performance */}
            {response.zones && response.zones.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="font-semibold text-gray-800">Zone Performance:</p>
                {response.zones.slice(0, 5).map((zone, i) => (
                  <div key={i} className="p-2 bg-white rounded text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{zone.zoneName}</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        zone.performanceLevel === 'EXCELLENT' ? 'bg-green-100 text-green-700' :
                        zone.performanceLevel === 'GOOD' ? 'bg-blue-100 text-blue-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {zone.successRate}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setResponse(null)}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            ← Ask another question
          </button>
        </div>
      )}
    </div>
  );
}
