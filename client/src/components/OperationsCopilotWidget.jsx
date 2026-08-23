import React, { useState } from 'react';
import api from '../api/axios';
import { Bot, Send, Sparkles, AlertCircle, ArrowRight, RefreshCw, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function OperationsCopilotWidget({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const navigate = useNavigate();

  const sampleQuestions = [
    'Why are deliveries delayed today?',
    'Which zone is performing worst?',
    'Which agents are overloaded?',
    'Show overall operations summary',
  ];

  const handleAsk = async (textToAsk) => {
    const q = textToAsk || query;
    if (!q.trim()) return;

    setLoading(true);
    setResponse(null);

    try {
      const res = await api.post('/admin/copilot/query', { query: q });
      if (res.data.success) {
        setResponse(res.data.response);
      }
    } catch (err) {
      toast.error('Copilot query failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col justify-between p-6">
      <div className="space-y-6 overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-100 text-sky-600">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                OPERATIONS COPILOT <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              </h2>
              <p className="text-[11px] text-slate-400">AI-assisted logistics intelligence & recommendations</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Suggested Prompts */}
        <div className="space-y-2">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">SUGGESTED QUESTIONS</span>
          <div className="flex flex-col gap-1.5">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(q);
                  handleAsk(q);
                }}
                className="text-left p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium transition-all"
              >
                • {q}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 flex items-center gap-3 text-sky-900 text-xs">
            <RefreshCw className="w-4 h-4 animate-spin text-sky-600 shrink-0" />
            <span>Analyzing real backend logistics database metrics...</span>
          </div>
        )}

        {/* AI Response Card */}
        {response && (
          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-4 shadow-xl border border-slate-800 animate-in fade-in duration-200">
            <div className="font-extrabold text-xs text-amber-400 tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-400" /> {response.title}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{response.summary}</p>

            {response.factors && response.factors.length > 0 && (
              <div className="space-y-2 border-t border-slate-800 pt-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase">IDENTIFIED FACTORS</span>
                <div className="space-y-1.5 text-xs">
                  {response.factors.map((f, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-slate-800/80 text-slate-200 space-y-0.5">
                      <div className="font-bold text-sky-300">{f.title}</div>
                      <div className="text-[11px] text-slate-400">{f.detail}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {response.recommendations && response.recommendations.length > 0 && (
              <div className="space-y-1.5 border-t border-slate-800 pt-3">
                <span className="text-[10px] font-bold text-emerald-400 uppercase">RECOMMENDED ACTIONS</span>
                <ul className="text-xs text-slate-200 space-y-1 list-disc list-inside">
                  {response.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {response.actionLink && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(response.actionLink);
                }}
                className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                {response.actionText || 'Take Action'} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Query Input */}
      <div className="pt-4 border-t border-slate-100">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about orders, zones, risks..."
            className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 outline-hidden bg-slate-50"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="p-2.5 rounded-xl bg-slate-900 text-white disabled:opacity-50 hover:bg-slate-800 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
