import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { LifeBuoy, MessageSquare, CheckCircle2, Clock, Send, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [nextStatus, setNextStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await api.get('/admin/support/tickets');
      if (res.data.success) {
        setTickets(res.data.tickets || []);
      }
    } catch {
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSendResponse = async () => {
    if (!selectedTicket || !responseText.trim()) {
      toast.error('Response text is required');
      return;
    }
    try {
      const res = await api.patch(`/admin/support/tickets/${selectedTicket.id}`, {
        message: responseText,
        status: nextStatus || 'IN_PROGRESS',
      });

      if (res.data.success) {
        toast.success('Response sent to customer');
        setResponseText('');
        fetchTickets();
        setSelectedTicket(res.data.ticket);
      }
    } catch {
      toast.error('Failed to send response');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-purple-600" /> Customer Support Desk & Ticket Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage customer issue reports, respond to delivery ticket threads, and resolve support queries.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
            Support Tickets ({tickets.length})
          </h3>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs animate-pulse">Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">No active support tickets.</div>
          ) : (
            <div className="space-y-2 max-h-128 overflow-y-auto">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedTicket(t);
                    setNextStatus(t.status);
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                    selectedTicket?.id === t.id
                      ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-purple-700">{t.ticketNumber}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        t.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : t.status === 'IN_PROGRESS'
                          ? 'bg-sky-100 text-sky-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 line-clamp-1">{t.category}</div>
                  <div className="text-[11px] text-slate-500 line-clamp-2">{t.description}</div>
                  <div className="text-[10px] text-slate-400 font-mono pt-1">
                    Customer: {t.customer?.name} • {new Date(t.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ticket Details & Response Thread */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
          {selectedTicket ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-mono font-bold text-purple-700">{selectedTicket.ticketNumber}</span>
                  <h2 className="text-lg font-extrabold text-slate-900">{selectedTicket.category} Issue</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Order #{selectedTicket.order?.orderNumber || 'N/A'} • Customer: {selectedTicket.customer?.name} ({selectedTicket.customer?.email})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value)}
                    className="p-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>

              {/* Original Issue Description */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">CUSTOMER DESCRIPTION</span>
                <p className="text-xs text-slate-800 leading-relaxed">{selectedTicket.description}</p>
              </div>

              {/* Ticket Response Thread */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">THREAD HISTORY</span>
                {selectedTicket.responses && selectedTicket.responses.length > 0 ? (
                  selectedTicket.responses.map((resp) => (
                    <div
                      key={resp.id}
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                        resp.senderRole === 'ADMIN' ? 'bg-purple-50 border-purple-200 ml-6' : 'bg-slate-50 border-slate-200 mr-6'
                      }`}
                    >
                      <div className="flex justify-between font-bold text-[11px] text-slate-600">
                        <span>{resp.sender?.name || resp.senderRole} ({resp.senderRole})</span>
                        <span className="font-mono text-slate-400">{new Date(resp.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-800">{resp.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 italic">No response history yet.</div>
                )}
              </div>

              {/* Reply Box */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <textarea
                  rows={3}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Type your response to the customer..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 outline-hidden"
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleSendResponse}
                    disabled={!responseText.trim()}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Send Response & Update Ticket
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-slate-400 text-xs space-y-2">
              <LifeBuoy className="w-8 h-8 text-slate-300 mx-auto" />
              <p>Select a support ticket from the list to view thread details and respond.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
