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
        <button
          key={star}
          type={interactive ? 'button' : 'button'}
          disabled={!interactive}
          onClick={() => interactive && onChange?.(star)}
          className={`text-xl ${interactive ? 'cursor-pointer hover:scale-110' : ''} transition-transform ${
            star <= rating ? 'text-yellow-500' : 'text-gray-300'
          }`}
        >
          ★
        </button>
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
    if (!newRating) {
      setError('Please select a rating');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const review = await api.createReview({
        lawyerId,
        rating: newRating,
        comment: newComment,
      });
      setReviews([review, ...reviews]);
      setShowForm(false);
      setNewRating(0);
      setNewComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
    : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-[#1B2A4A]">Reviews & Ratings</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={Math.round(averageRating)} />
              <span className="text-lg font-semibold text-[#1B2A4A]">{averageRating}</span>
              <span className="text-gray-500">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
            </div>
          )}
        </div>
        {user?.role === 'client' && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#1B2A4A] text-white px-4 py-2 rounded-lg hover:bg-[#2a3f6a] transition-colors text-sm font-semibold"
          >
            Write a Review
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
          <h3 className="font-semibold text-[#1B2A4A] mb-3">Rate Your Experience</h3>
          <div className="mb-3">
            <StarRating rating={newRating} interactive onChange={setNewRating} />
          </div>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your experience (optional)..."
            rows={3}
            maxLength={500}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2A4A] resize-none"
          />
          <p className="text-xs text-gray-500 mt-1 text-right">{newComment.length}/500</p>
          <div className="flex gap-3 mt-3">
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(''); }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !newRating}
              className="px-4 py-2 bg-[#C5A55A] text-[#1B2A4A] rounded-lg hover:bg-[#d4b36a] font-semibold text-sm disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No reviews yet. Be the first to review!</div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review._id} className="border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-[#1B2A4A] rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {review.clientId?.firstName?.[0]}{review.clientId?.lastName?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-[#1B2A4A] text-sm">
                    {review.clientId?.firstName} {review.clientId?.lastName}
                  </p>
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} />
                    <span className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              {review.comment && (
                <p className="text-gray-700 text-sm ml-13">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}