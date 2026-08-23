import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CreateOrderPage from './pages/customer/CreateOrderPage';
import MyShipmentsPage from './pages/customer/MyShipmentsPage';
import LiveTrackingPage from './pages/customer/LiveTrackingPage';
import NotificationsPage from './pages/customer/NotificationsPage';
import BillingPage from './pages/customer/BillingPage';
import CustomerAnalyticsPage from './pages/customer/CustomerAnalyticsPage';
import CustomerSettingsPage from './pages/customer/CustomerSettingsPage';
import SupportPage from './pages/customer/SupportPage';
import OrderDetailsPage from './pages/customer/OrderDetailsPage';
import CreateOrderWizard from './pages/customer/CreateOrderWizard';
import SavedAddressesPage from './pages/customer/SavedAddressesPage';
import PublicTrackingPage from './pages/public/PublicTrackingPage';

// Agent Pages
import AgentDashboard from './pages/agent/AgentDashboard';
import AgentActiveDeliveryPage from './pages/agent/AgentActiveDeliveryPage';
import AgentHistoryPage from './pages/agent/AgentHistoryPage';
import AgentProfilePage from './pages/agent/AgentProfilePage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminAgentsPage from './pages/admin/AdminAgentsPage';
import AdminZonesPage from './pages/admin/AdminZonesPage';
import AdminRateCardsPage from './pages/admin/AdminRateCardsPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminLiveOperationsPage from './pages/admin/AdminLiveOperationsPage';
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage';
import AdminSimulationPage from './pages/admin/AdminSimulationPage';
import AdminBulkOrdersPage from './pages/admin/AdminBulkOrdersPage';
import AdminSettlementsPage from './pages/admin/AdminSettlementsPage';
import AdminSupportPage from './pages/admin/AdminSupportPage';
import AdminSystemHealthPage from './pages/admin/AdminSystemHealthPage';
import AdminRiskRadarPage from './pages/admin/AdminRiskRadarPage';
import AdminMissionControlPage from './pages/admin/AdminMissionControlPage';
import AdminOptimizationPage from './pages/admin/AdminOptimizationPage';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-xs">Loading session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'AGENT') return <Navigate to="/agent" replace />;
    return <Navigate to="/customer" replace />;
  }

  return children;
};

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: '#0f172a', color: '#f8fafc' } }} />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/track/:token" element={<PublicTrackingPage />} />

        {/* Customer Routes */}
        <Route path="/customer" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><DashboardLayout><CustomerDashboard /></DashboardLayout></ProtectedRoute>} />
        <Route path="/customer/create-order" element={<ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}><DashboardLayout><CreateOrderWizard /></DashboardLayout></ProtectedRoute>} />
        <Route path="/customer/shipments" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><DashboardLayout><MyShipmentsPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/customer/addresses" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><DashboardLayout><SavedAddressesPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/customer/tracking" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><DashboardLayout><LiveTrackingPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/customer/notifications" element={<ProtectedRoute allowedRoles={['CUSTOMER', 'AGENT']}><DashboardLayout><NotificationsPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/customer/billing" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><DashboardLayout><BillingPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/customer/analytics" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><DashboardLayout><CustomerAnalyticsPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/customer/settings" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><DashboardLayout><CustomerSettingsPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/customer/support" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><DashboardLayout><SupportPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/customer/orders" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><DashboardLayout><MyShipmentsPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/customer/orders/:id" element={<ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN', 'AGENT']}><DashboardLayout><OrderDetailsPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN', 'AGENT']}><DashboardLayout><OrderDetailsPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin/orders/:id" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><OrderDetailsPage /></DashboardLayout></ProtectedRoute>} />

        {/* Agent Routes */}
        <Route path="/agent" element={<ProtectedRoute allowedRoles={['AGENT']}><DashboardLayout><AgentDashboard /></DashboardLayout></ProtectedRoute>} />
        <Route path="/agent/deliveries" element={<ProtectedRoute allowedRoles={['AGENT']}><DashboardLayout><AgentDashboard /></DashboardLayout></ProtectedRoute>} />
        <Route path="/agent/active-delivery" element={<ProtectedRoute allowedRoles={['AGENT']}><DashboardLayout><AgentActiveDeliveryPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/agent/history" element={<ProtectedRoute allowedRoles={['AGENT']}><DashboardLayout><AgentHistoryPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/agent/profile" element={<ProtectedRoute allowedRoles={['AGENT']}><DashboardLayout><AgentProfilePage /></DashboardLayout></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminDashboard /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminOrdersPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin/agents" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminAgentsPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin/zones" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminZonesPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin/rate-cards" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminRateCardsPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminAnalyticsPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminNotificationsPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminSettingsPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin/live" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminLiveOperationsPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminAuditLogsPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin/simulation" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminSimulationPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin/bulk-orders" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminBulkOrdersPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin/settlements" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminSettlementsPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin/support" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminSupportPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin/system-health" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminSystemHealthPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin/risk-radar" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminRiskRadarPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin/mission-control" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminMissionControlPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin/optimization" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminOptimizationPage /></DashboardLayout></ProtectedRoute>} />

        {/* Default Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
