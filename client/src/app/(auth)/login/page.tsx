'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      if (err instanceof Error && err.message === 'Please verify your email before logging in') {
        setError('Please verify your email before logging in. <a href="/resend-verification" class="text-blue-900 underline">Resend verification email</a>');
      } else {
        setError(err instanceof Error ? err.message : 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 bg-primary/10">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border-2 border-primary/30 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1B2A4A]">WELCOME BACK</h1>
          <p className="text-gray-600 mt-2">Sign in to your Advisora Connect account</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
            <div dangerouslySetInnerHTML={{ __html: error }} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2A4A] focus:border-[#1B2A4A]"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1"><label className="block text-sm font-semibold text-gray-700">Password</label><Link href="/forgot-password" className="text-sm text-[#1B2A4A] hover:underline font-medium">Forgot Password?</Link></div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2A4A] focus:border-[#1B2A4A]"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1B2A4A] text-white py-3 rounded-lg hover:bg-[#2a3f6a] transition-colors font-semibold disabled:opacity-50 mt-4"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-[#1B2A4A] font-semibold hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

