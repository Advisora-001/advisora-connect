'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

interface Review {
  _id: string;
  lawyerId: string;
  clientId: { _id: string; firstName: string; lastName: string; avatar?: string };
  rating: number;
  comment: string;
  createdAt: string;
}

interface Props {
  lawyerId: string;
  reviews: Review[];
  setReviews: (reviews: Review[]) => void;
  loading: boolean;
}

function StarRating({ rating, interactive, onChange }: { rating: number; interactive?: boolean; onChange?: (r: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type={interactive ? 'button' : 'button'} disabled={!interactive}
          onClick={() => interactive && onChange?.(star)}
          className={`text-lg ${interactive ? 'cursor-pointer hover:scale-110' : ''} transition-transform ${star <= rating ? 'text-[#F59E0B]' : 'text-[#E5EAF0]'}`}>★</button>
      ))}
    </div>
  );
}

export default function ReviewSection({ lawyerId, reviews, setReviews, loading }: Props) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRating) { setError('Please select a rating'); return; }
    setSubmitting(true); setError('');
    try {
      const review = await api.createReview({ lawyerId, rating: newRating, comment: newComment });
      setReviews([review, ...reviews]);
      setShowForm(false); setNewRating(0); setNewComment('');
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to submit review'); }
    finally { setSubmitting(false); }
  };

  const averageRating = reviews.length > 0 ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[#1B2A4A]">Reviews & Ratings</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={Math.round(averageRating)} />
              <span className="text-lg font-semibold text-[#1B2A4A]">{averageRating}</span>
              <span className="text-[#94A3B8] text-sm">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
            </div>
          )}
        </div>
        {user?.role === 'client' && !showForm && (
          <button onClick={() => setShowForm(true)} className="bg-[#1B2A4A] text-white px-4 py-2 rounded-lg hover:bg-[#16213A] transition-colors text-sm font-semibold">Write a Review</button>
        )}
      </div>

      {error && <div className="bg-[#FEF2F2] text-[#EF4444] p-3 rounded-lg mb-4 text-sm">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#F5F7FA] rounded-lg p-4 mb-6 border border-[#E5EAF0]">
          <h3 className="font-semibold text-[#1B2A4A] mb-3 text-sm">Rate Your Experience</h3>
          <div className="mb-3"><StarRating rating={newRating} interactive onChange={setNewRating} /></div>
          <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Share your experience (optional)..." rows={3} maxLength={500}
            className="w-full px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] resize-none text-sm" />
          <p className="text-xs text-[#94A3B8] mt-1 text-right">{newComment.length}/500</p>
          <div className="flex gap-3 mt-3">
            <button type="button" onClick={() => { setShowForm(false); setError(''); }} className="px-4 py-2 border border-[#E5EAF0] rounded-lg text-[#475569] hover:bg-[#F5F7FA] text-sm font-medium">Cancel</button>
            <button type="submit" disabled={submitting || !newRating} className="px-4 py-2 bg-[#00A6A6] text-white rounded-lg hover:bg-[#008F8F] font-semibold text-sm disabled:opacity-50 transition-colors">{submitting ? 'Submitting...' : 'Submit Review'}</button>
          </div>
        </form>
      )}

      {loading ? (<div className="text-center py-8 text-[#667085] text-sm">Loading reviews...</div>)
      : reviews.length === 0 ? (<div className="text-center py-8 text-[#667085] text-sm">No reviews yet. Be the first to review!</div>)
      : (<div className="space-y-4">
          {reviews.map((review) => (
            <div key={review._id} className="border-b border-[#E5EAF0] pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-[#1B2A4A] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{review.clientId?.firstName?.[0]}{review.clientId?.lastName?.[0]}</div>
                <div>
                  <p className="font-semibold text-[#1B2A4A] text-sm">{review.clientId?.firstName} {review.clientId?.lastName}</p>
                  <div className="flex items-center gap-2"><StarRating rating={review.rating} /><span className="text-xs text-[#94A3B8]">{new Date(review.createdAt).toLocaleDateString()}</span></div>
                </div>
              </div>
              {review.comment && <p className="text-[#475569] text-sm ml-12">{review.comment}</p>}
            </div>
          ))}
        </div>)}
    </div>
  );
}