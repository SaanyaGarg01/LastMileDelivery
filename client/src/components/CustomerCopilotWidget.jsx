import React, { useState } from 'react';
import api from '../api/axios';
import { Bot, Send, X, RefreshCw, Sparkles, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomerCopilotWidget({ orderId, isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      sender: 'AI',
      text: 'Hello! I am your AI Delivery Assistant. Ask me anything about your package location, ETA, delivery partner, or pricing.',
      time: 'Just now',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const suggestedQuestions = [
    'Where is my package?',
    'When will it arrive?',
    'Who is delivering it?',
    'What happens if delivery fails?',
    'Why did it cost this much?',
  ];

  const handleSendQuery = async (queryText) => {
    const prompt = queryText || inputQuery;
    if (!prompt.trim()) return;

    const userMsg = { sender: 'USER', text: prompt, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await api.post('/customer/copilot/query', { orderId, question: prompt });
      if (res.data.success) {
        const aiMsg = {
          sender: 'AI',
          text: res.data.answer,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actions: res.data.suggestedActions || [],
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err) {
      toast.error('AI assistant was unable to process query');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-sky-500 text-slate-950">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm flex items-center gap-1.5">
              AI Delivery Assistant <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h3>
            <p className="text-[10px] text-slate-400">Order-scoped intelligence assistant</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex flex-col ${m.sender === 'USER' ? 'items-end' : 'items-start'}`}>
            <div
              className={`p-3 rounded-2xl max-w-[85%] space-y-1 ${
                m.sender === 'USER' ? 'bg-sky-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-900 rounded-bl-none border border-slate-200'
              }`}
            >
              <p className="font-medium leading-relaxed">{m.text}</p>
              <span className="text-[9px] opacity-70 block text-right font-mono">{m.time}</span>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs italic p-2">
            <RefreshCw className="w-4 h-4 animate-spin text-sky-600" /> AI is analyzing shipment data...
          </div>
        )}
      </div>

      {/* Suggested Questions */}
      <div className="p-3 border-t border-slate-100 bg-slate-50 space-y-1.5">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">SUGGESTED QUESTIONS</span>
        <div className="flex flex-wrap gap-1">
          {suggestedQuestions.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => handleSendQuery(q)}
              className="text-[11px] font-bold text-slate-700 bg-white hover:bg-sky-50 hover:text-sky-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendQuery();
        }}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask AI about your shipment..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-300"
        />
        <button
          type="submit"
          disabled={loading || !inputQuery.trim()}
          className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white shadow-md transition-all shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
