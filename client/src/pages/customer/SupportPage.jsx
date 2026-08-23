import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Mail, Phone, MessageSquare, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState(0);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const faqs = [
    {
      q: 'How is my delivery charge calculated?',
      a: 'Delivery charges depend on Chargeable Weight (maximum of actual weight vs volumetric weight), Pickup & Drop Zone relationship (INTRA vs INTER zone), B2B/B2C order classification, and COD surcharges configured in the dynamic database rate cards.',
    },
    {
      q: 'What is volumetric weight?',
      a: 'Volumetric weight measures package volume rather than physical weight using the industry standard formula: (Length × Breadth × Height in cm) / 5000.',
    },
    {
      q: 'What happens after a failed delivery attempt?',
      a: 'If an agent records a failed delivery (e.g. door locked / customer unreachable), the shipment status updates to FAILED and frees the agent. You can select a new delivery date from your dashboard to trigger auto-assignment of Attempt #2.',
    },
    {
      q: 'How do I reschedule a delivery?',
      a: 'Open the failed shipment details from your dashboard or "My Shipments" page and click "Reschedule Delivery". Pick a new date and enter any special instructions for the new agent.',
    },
    {
      q: 'How is a delivery agent assigned?',
      a: 'The system uses an automated geographic algorithm (Haversine formula) to locate the nearest AVAILABLE delivery agent from your pickup location and updates the assignment in real-time.',
    },
    {
      q: 'How do I track my shipment in real-time?',
      a: 'Navigate to "Live Tracking" from the sidebar and search by your Shipment ID (e.g. ORD-1787403978856-8733) to view live status nodes, agent location map, and delivery health metrics.',
    },
  ];

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!subject || !message) {
      toast.error('Please enter subject and message');
      return;
    }
    toast.success('Support message sent. Our logistics operations team will reply shortly!');
    setSubject('');
    setMessage('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">Support Center</h1>
        <p className="text-xs text-slate-500">Frequently asked questions and direct assistance from our logistics team</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* FAQ Accordion Column */}
        <div className="lg:col-span-7 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
            <HelpCircle className="w-4 h-4 text-sky-600" /> FREQUENTLY ASKED QUESTIONS
          </h2>

          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left font-bold text-xs text-slate-900 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contact Support Form Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <MessageSquare className="w-4 h-4 text-purple-600" /> CONTACT LOGISTICS SUPPORT
            </h2>

            <form onSubmit={handleContactSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject / Issue Type</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Question about order #ORD-1001"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Message Details</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your inquiry..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 h-28"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Send className="w-4 h-4" /> Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
