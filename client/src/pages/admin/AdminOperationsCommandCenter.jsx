import React, { useState } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

// Import all the new WOW factor components
import LogisticsCopilot from '../../components/LogisticsCopilot';
import DeliveryRiskRadar from '../../components/DeliveryRiskRadar';
import OperationsHealthScore from '../../components/OperationsHealthScore';
import ZoneHeatmap from '../../components/ZoneHeatmap';
import RateExplanationModal from '../../components/RateExplanationModal';
import DemandForecast from '../../components/DemandForecast';
import OptimizationSimulation from '../../components/OptimizationSimulation';
import AgentLeaderboard from '../../components/AgentLeaderboard';

/**
 * Admin Operations Command Center Page
 * Central hub for all AI-powered logistics management features
 */
export default function AdminOperationsCommandCenter() {
  const [selectedTab, setSelectedTab] = useState(0);

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-6 shadow-lg">
        <div className="flex items-center gap-4 mb-2">
          <span className="text-4xl">🚀</span>
          <div>
            <h1 className="text-3xl font-bold">AI Operations Command Center</h1>
            <p className="text-blue-100">Unified logistics management and decision support</p>
          </div>
        </div>
        <p className="text-sm text-blue-50 mt-4">
          Real-time monitoring, predictive insights, and intelligent automation for maximum delivery performance
        </p>
      </div>

      {/* Features Grid - Quick Access */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: '🤖', label: 'Copilot', tab: 0 },
          { icon: '🚦', label: 'Risk Radar', tab: 1 },
          { icon: '❤️', label: 'Health Score', tab: 2 },
          { icon: '🗺️', label: 'Zone Map', tab: 3 },
          { icon: '🔮', label: 'Forecast', tab: 4 },
          { icon: '⚡', label: 'Optimization', tab: 5 },
          { icon: '🏆', label: 'Leaderboard', tab: 6 },
          { icon: '💰', label: 'Pricing', tab: 7 },
        ].map((feature, i) => (
          <button
            key={i}
            onClick={() => setSelectedTab(feature.tab)}
            className={`p-4 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 ${
              selectedTab === feature.tab
                ? 'bg-blue-600 text-white shadow-lg scale-105'
                : 'bg-white text-gray-800 shadow hover:shadow-md border border-gray-200'
            }`}
          >
            <div className="text-2xl mb-1">{feature.icon}</div>
            {feature.label}
          </button>
        ))}
      </div>

      {/* Main Content - Tabbed Interface */}
      <Tabs selectedIndex={selectedTab} onSelect={(idx) => setSelectedTab(idx)} className="bg-white rounded-lg shadow-lg">
        <TabList className="flex flex-wrap gap-2 p-4 border-b border-gray-200 bg-gray-50">
          <Tab
            className="px-4 py-2 rounded-lg font-semibold text-sm cursor-pointer hover:bg-gray-200 transition-colors select-none"
            selectedClassName="bg-blue-600 text-white"
          >
            🤖 Copilot
          </Tab>
          <Tab
            className="px-4 py-2 rounded-lg font-semibold text-sm cursor-pointer hover:bg-gray-200 transition-colors select-none"
            selectedClassName="bg-blue-600 text-white"
          >
            🚦 Risk Radar
          </Tab>
          <Tab
            className="px-4 py-2 rounded-lg font-semibold text-sm cursor-pointer hover:bg-gray-200 transition-colors select-none"
            selectedClassName="bg-blue-600 text-white"
          >
            ❤️ Operations Health
          </Tab>
          <Tab
            className="px-4 py-2 rounded-lg font-semibold text-sm cursor-pointer hover:bg-gray-200 transition-colors select-none"
            selectedClassName="bg-blue-600 text-white"
          >
            🗺️ Zone Heatmap
          </Tab>
          <Tab
            className="px-4 py-2 rounded-lg font-semibold text-sm cursor-pointer hover:bg-gray-200 transition-colors select-none"
            selectedClassName="bg-blue-600 text-white"
          >
            🔮 Demand Forecast
          </Tab>
          <Tab
            className="px-4 py-2 rounded-lg font-semibold text-sm cursor-pointer hover:bg-gray-200 transition-colors select-none"
            selectedClassName="bg-blue-600 text-white"
          >
            ⚡ Optimization
          </Tab>
          <Tab
            className="px-4 py-2 rounded-lg font-semibold text-sm cursor-pointer hover:bg-gray-200 transition-colors select-none"
            selectedClassName="bg-blue-600 text-white"
          >
            🏆 Leaderboard
          </Tab>
          <Tab
            className="px-4 py-2 rounded-lg font-semibold text-sm cursor-pointer hover:bg-gray-200 transition-colors select-none"
            selectedClassName="bg-blue-600 text-white"
          >
            💰 Rate Insights
          </Tab>
        </TabList>

        {/* Tab Panels */}
        <div className="p-6">
          <TabPanel>
            <LogisticsCopilot />
          </TabPanel>

          <TabPanel>
            <DeliveryRiskRadar />
          </TabPanel>

          <TabPanel>
            <OperationsHealthScore />
          </TabPanel>

          <TabPanel>
            <ZoneHeatmap />
          </TabPanel>

          <TabPanel>
            <DemandForecast />
          </TabPanel>

          <TabPanel>
            <OptimizationSimulation />
          </TabPanel>

          <TabPanel>
            <AgentLeaderboard />
          </TabPanel>

          <TabPanel>
            <div className="bg-blue-50 rounded-lg p-8 text-center border border-blue-200">
              <span className="text-5xl mb-4 block">💰</span>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Rate Calculation Insights</h3>
              <p className="text-gray-600 mb-6">
                View the detailed pricing breakdown for any order to understand how rates are calculated
              </p>
              <p className="text-sm text-gray-500">
                Select an order from the Order Management page to view its rate explanation
              </p>
            </div>
          </TabPanel>
        </div>
      </Tabs>

      {/* Footer Info */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-sm text-gray-600">
        <p>
          <strong>💡 Tip:</strong> Use the Logistics Copilot to ask questions about your operations. Ask about delays, 
          high-risk deliveries, zone performance, and receive AI-powered recommendations instantly.
        </p>
      </div>
    </div>
  );
}
