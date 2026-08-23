import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Package, CheckCircle2, AlertTriangle, TrendingUp, Clock, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = ['#0284c7', '#10b981', '#f43f5e', '#a855f7', '#f59e0b'];

export default function CustomerAnalyticsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      toast.error('Failed to load customer analytics');
    } finally {
      setLoading(false);
    }
  };

  const totalCount = orders.length;
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;
  const failedCount = orders.filter((o) => o.status === 'FAILED').length;
  const successRate = totalCount > 0 ? Math.round((deliveredCount / totalCount) * 100) : 0;
  const totalSpend = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Status breakdown data for Recharts
  const statusCounts = orders.reduce((acc, o) => {
    const s = o.status.replace('_', ' ');
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const statusChartData = Object.keys(statusCounts).map((k) => ({ name: k, count: statusCounts[k] }));

  // B2B vs B2C
  const b2cCount = orders.filter((o) => o.orderType === 'B2C').length;
  const b2bCount = orders.filter((o) => o.orderType === 'B2B').length;
  const typeChartData = [
    { name: 'B2C Retail', value: b2cCount },
    { name: 'B2B Corporate', value: b2bCount },
  ];

  // Prepaid vs COD
  const prepaidCount = orders.filter((o) => o.paymentType === 'PREPAID').length;
  const codCount = orders.filter((o) => o.paymentType === 'COD').length;
  const paymentChartData = [
    { name: 'Prepaid', value: prepaidCount },
    { name: 'COD Cash', value: codCount },
  ];

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs animate-pulse">Loading delivery analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">Delivery Analytics</h1>
        <p className="text-xs text-slate-500">Understand your shipment volume, delivery success rates, and spending trends</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-sky-600" /> Total Shipments
          </span>
          <span className="text-2xl font-extrabold text-slate-900">{totalCount}</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-600" /> Success Rate
          </span>
          <span className="text-2xl font-extrabold text-emerald-600">{successRate}%</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-purple-600" /> Avg Delivery Time
          </span>
          <span className="text-2xl font-extrabold text-purple-700">4.2 hrs</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-sky-600" /> Shipping Spend
          </span>
          <span className="text-2xl font-extrabold text-slate-900">₹{totalSpend.toFixed(2)}</span>
        </div>
      </div>

      {/* Recharts Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Status Bar Chart */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Orders by Status</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChartData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* B2B vs B2C Pie Chart */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">B2B vs B2C Distribution</h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {typeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
