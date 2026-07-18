'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [message, setMessage] = useState('');
  const [paymentType, setPaymentType] = useState<string>('payment');

  useEffect(() => {
    const reference = searchParams.get('reference');
    if (!reference) {
      setStatus('failed');
      setMessage('No payment reference found.');
      return;
    }

    verifyPayment(reference);
  }, [searchParams]);

  async function verifyPayment(reference: string) {
    try {
      const response = await api.verifyPayment({ reference });
      
      if (response.status === true && response.data?.status === 'success') {
        setStatus('success');
        const type = response.data.metadata?.type || "consultation";
        setPaymentType(type);
        await refreshUser();

        switch (type) {
          case 'consultation':
            setMessage('Your consultation has been booked and paid successfully! You can now view the details in your dashboard.');
            break;
          case 'subscription':
            setMessage('Your subscription has been activated successfully! You now have access to premium features.');
            break;
          case 'featured':
            setMessage('Your featured listing has been activated! Your profile will be featured for 30 days.');
            break;
          default:
            setMessage('Payment was successful! Thank you for your payment.');
        }
      } else {
        setStatus('failed');
        setMessage(response.data?.gateway_response || 'Payment verification failed. Please contact support.');
      }
    } catch (error) {
      setStatus('failed');
      setMessage(error instanceof Error ? error.message : 'Payment verification failed. Please contact support.');
    }
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'lawyer') return '/dashboard/lawyer';
    if (user.role === 'client') return '/dashboard/client';
    if (user.role === 'admin') return '/admin';
    return '/';
  };

  const primaryHref = getDashboardLink();
  const primaryLabel = 'Go to Dashboard';

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 bg-primary/10">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border-2 border-primary/30 p-8 text-center">
        {status === 'verifying' && (
          <>
            <div className="animate-spin w-16 h-16 border-4 border-primary border-t-accent rounded-full mx-auto"></div>
            <h1 className="text-2xl font-bold text-accent mt-6">Verifying Payment</h1>
            <p className="text-gray-600 mt-3">Please wait while we verify your payment...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-accent mt-6">Payment Successful!
            <p className="text-gray-600 mt-3">{message}</p>
            <div className="mt-8 space-y-3">
              <Link
                href={primaryHref}
                className="block w-full bg-accent text-white px-6 py-3 rounded-lg hover:bg-accent/90 font-bold text-lg shadow-md transition-all"
              >
                {primaryLabel}
              </Link>
              <Link
                href="/"
                className="block w-full border-2 border-primary text-accent px-6 py-3 rounded-lg hover:bg-primary/10 font-semibold transition-all"
              >
                Back to Home
              </Link>
            </div>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-accent mt-6">Payment Failed</h1>
            <p className="text-red-600 mt-3">{message}</p>
            <div className="mt-8 space-y-3">
              <button
                onClick={() => router.back()}
                className="block w-full bg-accent text-white px-6 py-3 rounded-lg hover:bg-accent/90 font-bold text-lg shadow-md transition-all"
              >
                Try Again
              </button>
              <Link
                href="/"
                className="block w-full border-2 border-primary text-accent px-6 py-3 rounded-lg hover:bg-primary/10 font-semibold transition-all"
              >
                Back to Home
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-primary/10">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-accent rounded-full"></div>
      </div>
    }>
      <PaymentCallbackContent />
    </Suspense>
  );
}


