import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { CreditCard, DollarSign, Clock, CheckCircle2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BillingPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillingOrders();
  }, []);

  const fetchBillingOrders = async () => {
    try {
      const res = await api.get('/orders');
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      toast.error('Failed to load billing history');
    } finally {
      setLoading(false);
    }
  };

  const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const prepaidAmount = orders.filter((o) => o.paymentType === 'PREPAID').reduce((sum, o) => sum + o.totalAmount, 0);
  const codAmount = orders.filter((o) => o.paymentType === 'COD').reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingCount = orders.filter((o) => o.paymentType === 'COD' && o.status !== 'DELIVERED').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">Billing & Payments</h1>
        <p className="text-xs text-slate-500">View your shipment charges, itemized rate cards, and payment history</p>
      </div>

      {/* Top Billing KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-sky-600" /> Total Shipping Spend
          </span>
          <span className="text-2xl font-extrabold text-slate-900">₹{totalSpent.toFixed(2)}</span>
          <span className="text-[10px] text-slate-400 block">{orders.length} total shipments</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Prepaid Paid
          </span>
          <span className="text-2xl font-extrabold text-emerald-600">₹{prepaidAmount.toFixed(2)}</span>
          <span className="text-[10px] text-slate-400 block">Direct online payments</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-amber-600" /> COD Cash Total
          </span>
          <span className="text-2xl font-extrabold text-amber-700">₹{codAmount.toFixed(2)}</span>
          <span className="text-[10px] text-slate-400 block">Cash on delivery collection</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-purple-600" /> Pending COD Collections
          </span>
          <span className="text-2xl font-extrabold text-purple-700">{pendingCount} orders</span>
          <span className="text-[10px] text-slate-400 block">Pending agent collection</span>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden space-y-0">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-600" /> Payment & Billing History
          </h2>
          <span className="text-xs text-slate-500 font-mono">{orders.length} transactions</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs animate-pulse">Loading payment history...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No billing records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Shipment ID</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Delivery Charge</th>
                  <th className="p-4">COD Surcharge</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Payment Type</th>
                  <th className="p-4 text-right">Payment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80">
                    <td className="p-4 font-mono font-bold text-sky-700">{o.orderNumber}</td>
                    <td className="p-4 font-mono">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 font-medium text-slate-900">₹{o.deliveryCharge.toFixed(2)}</td>
                    <td className="p-4 font-medium text-amber-700">
                      {o.codSurcharge > 0 ? `₹${o.codSurcharge.toFixed(2)}` : '₹0.00'}
                    </td>
                    <td className="p-4 font-extrabold text-slate-900">₹{o.totalAmount.toFixed(2)}</td>
                    <td className="p-4 font-bold uppercase">{o.paymentType}</td>
                    <td className="p-4 text-right">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        o.paymentType === 'PREPAID' || o.status === 'DELIVERED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {o.paymentType === 'PREPAID' || o.status === 'DELIVERED' ? 'PAID' : 'PENDING'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
