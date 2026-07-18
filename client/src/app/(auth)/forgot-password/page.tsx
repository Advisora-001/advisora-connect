'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const result = await api.forgotPassword(email);
      setStatus('success');
      setMessage(result.message || 'Password reset email sent!');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to send reset email. Please try again.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 bg-primary/10">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border-2 border-primary/30 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-accent">Forgot Password</h1>
          <p className="text-gray-600 mt-2">Enter your email to receive a password reset link</p>
        </div>

        {status === 'success' && (
          <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">
            ✅ {message}
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {message}
          </div>
        )}

        {status !== 'success' && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-accent mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border-2 border-primary rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/30 focus:border-primary-dark text-accent placeholder-gray-400"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-accent text-white py-3.5 rounded-lg hover:bg-accent/90 font-bold text-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="text-center mt-6 space-y-3">
          {status === 'success' && (
            <Link
              href="/login"
              className="block w-full bg-accent text-white px-6 py-3 rounded-lg hover:bg-accent/90 font-bold text-lg shadow-md transition-all"
            >
              Back to Login
            </Link>
          )}
          <p className="text-gray-600">
            Remember your password?{' '}
            <Link href="/login" className="text-accent font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}