import React, { useState } from 'react';
import api from '../api/axios';
import { Star, Check, X, ThumbsUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomerRatingModal({ orderId, isOpen, onClose, onRatingSubmitted }) {
  const [rating, setRating] = useState(5);
  const [fastDelivery, setFastDelivery] = useState(true);
  const [professionalAgent, setProfessionalAgent] = useState(true);
  const [easyTracking, setEasyTracking] = useState(true);
  const [goodCommunication, setGoodCommunication] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await api.post(`/customer/orders/${orderId}/rating`, {
        rating,
        fastDelivery,
        professionalAgent,
        easyTracking,
        goodCommunication,
        feedback,
      });

      if (res.data.success) {
        toast.success('Thank you for rating your delivery!');
        if (onRatingSubmitted) onRatingSubmitted(res.data.rating);
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-between">
          <h3 className="font-extrabold text-base flex items-center gap-2">
            <Star className="w-5 h-5 fill-white" /> HOW WAS YOUR DELIVERY?
          </h3>
          <button type="button" onClick={onClose} className="text-white/80 hover:text-white font-bold text-lg">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Star Rating selector */}
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Rate Delivery Partner</span>
            <div className="flex justify-center items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 transform hover:scale-125 transition-all"
                >
                  <Star
                    className={`w-8 h-8 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Tag Chips */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">WHAT WENT WELL?</span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => setFastDelivery(!fastDelivery)}
                className={`py-2 px-3 rounded-xl font-extrabold border transition-all ${fastDelivery ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
              >
                ⚡ Fast Delivery
              </button>
              <button
                type="button"
                onClick={() => setProfessionalAgent(!professionalAgent)}
                className={`py-2 px-3 rounded-xl font-extrabold border transition-all ${professionalAgent ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
              >
                👔 Professional Agent
              </button>
              <button
                type="button"
                onClick={() => setEasyTracking(!easyTracking)}
                className={`py-2 px-3 rounded-xl font-extrabold border transition-all ${easyTracking ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
              >
                📍 Easy Tracking
              </button>
              <button
                type="button"
                onClick={() => setGoodCommunication(!goodCommunication)}
                className={`py-2 px-3 rounded-xl font-extrabold border transition-all ${goodCommunication ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
              >
                💬 Good Communication
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Additional Feedback</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us what you liked about the delivery..."
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none font-bold"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold">Cancel</button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold flex items-center justify-center gap-1.5 shadow-md"
            >
              {submitting ? <ThumbsUp className="w-4 h-4 animate-bounce" /> : <Check className="w-4 h-4" />}
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
