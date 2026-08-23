import React, { useState, useEffect } from 'react';
import axios from '../api/axios';

/**
 * Agent Leaderboard Component
 * Shows top performing agents by various metrics
 */
export default function AgentLeaderboard() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('successRate'); // successRate, deliveries, avgTime

  useEffect(() => {
    fetchAgentPerformance();
    const interval = setInterval(fetchAgentPerformance, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchAgentPerformance = async () => {
    try {
      const res = await axios.get('/admin/analytics', { params: { timeRange: 'today' } });
      if (res.data.agentPerformance) {
        setAgents(res.data.agentPerformance);
      }
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch agent performance');
    } finally {
      setLoading(false);
    }
  };

  if (loading && agents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600">Loading leaderboard...</p>
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

  const getMedalEmoji = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return '🏅';
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <div>
              <h2 className="text-2xl font-bold">Top Delivery Agents</h2>
              <p className="text-purple-100 text-sm">Today's performance leaderboard</p>
            </div>
          </div>
          <div className="select">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 rounded text-gray-800 bg-white"
            >
              <option value="successRate">Success Rate</option>
              <option value="deliveries">Deliveries</option>
              <option value="avgTime">Avg Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="divide-y">
        {agents.length === 0 ? (
          <div className="p-12 text-center text-gray-600">
            <p>No agent data available</p>
          </div>
        ) : (
          agents.slice(0, 15).map((agent, index) => (
            <div
              key={agent.id}
              className={`p-4 hover:bg-gray-50 transition-colors ${
                index < 3 ? 'bg-gray-50' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className="text-3xl font-bold text-center w-12">
                  {getMedalEmoji(index)}
                </div>

                {/* Agent Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 truncate">
                    {agent.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    Status:{' '}
                    <span className={`font-medium ${
                      agent.status === 'AVAILABLE'
                        ? 'text-green-600'
                        : agent.status === 'BUSY'
                          ? 'text-orange-600'
                          : 'text-gray-600'
                    }`}>
                      {agent.status}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="hidden md:grid grid-cols-4 gap-6 text-right">
                  <div>
                    <p className="text-xs text-gray-600">Active/Capacity</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {agent.activeOrders}/{agent.maxCapacity}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Today</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {agent.completed}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Success Rate</p>
                    <div className="flex items-center gap-2 justify-end">
                      <div className="w-16 h-2 bg-gray-300 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            agent.successRate >= 95
                              ? 'bg-green-500'
                              : agent.successRate >= 80
                                ? 'bg-blue-500'
                                : 'bg-orange-500'
                          }`}
                          style={{
                            width: `${Math.min(agent.successRate, 100)}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-lg font-bold text-gray-800 w-12">
                        {agent.successRate}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Avg Time</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {agent.avgDeliveryTime}
                    </p>
                  </div>
                </div>

                {/* Mobile Stats */}
                <div className="md:hidden text-right">
                  <p className="text-lg font-bold text-gray-800">{agent.successRate}%</p>
                  <p className="text-xs text-gray-600">{agent.completed} today</p>
                </div>
              </div>

              {/* Workload Bar */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      agent.workloadPct >= 80
                        ? 'bg-red-500'
                        : agent.workloadPct >= 60
                          ? 'bg-orange-500'
                          : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(agent.workloadPct, 100)}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-600 w-12 text-right">
                  {agent.workloadPct}%
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 p-4 text-center text-sm text-gray-600">
        Showing top {Math.min(15, agents.length)} agents • Updated regularly
      </div>
    </div>
  );
}
