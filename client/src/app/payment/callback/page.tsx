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
    if (!reference) { setStatus('failed'); setMessage('No payment reference found.'); return; }
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
          case 'consultation': setMessage('Your consultation has been booked and paid successfully! You can now view the details in your dashboard.'); break;
          case 'subscription': setMessage('Your subscription has been activated successfully! You now have access to premium features.'); break;
          case 'featured': setMessage('Your featured listing has been activated! Your profile will be featured for 30 days.'); break;
          default: setMessage('Payment was successful! Thank you for your payment.');
        }
      } else { setStatus('failed'); setMessage(response.data?.gateway_response || 'Payment verification failed. Please contact support.'); }
    } catch (error) { setStatus('failed'); setMessage(error instanceof Error ? error.message : 'Payment verification failed. Please contact support.'); }
  }

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'lawyer') return '/dashboard/lawyer';
    if (user.role === 'client') return '/dashboard/client';
    if (user.role === 'admin') return '/admin';
    return '/';
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-xl border border-[#E5EAF0] p-8 text-center shadow-sm">
        {status === 'verifying' && (<>
          <div className="animate-spin w-14 h-14 border-2 border-[#1B2A4A] border-t-transparent rounded-full mx-auto"></div>
          <h1 className="text-xl font-bold text-[#1B2A4A] mt-6">Verifying Payment</h1>
          <p className="text-[#667085] mt-3 text-sm">Please wait while we verify your payment...</p>
        </>)}

        {status === 'success' && (<>
          <div className="w-16 h-16 bg-[#ECFDF5] rounded-full flex items-center justify-center mx-auto"><svg className="w-8 h-8 text-[#5DBB63]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></div>
          <h1 className="text-xl font-bold text-[#1B2A4A] mt-6">Payment Successful!</h1>
          <p className="text-[#667085] mt-3 text-sm">{message}</p>
          <div className="mt-8 space-y-3">
            <Link href={getDashboardLink()} className="block w-full bg-[#1B2A4A] text-white px-6 py-3 rounded-lg hover:bg-[#16213A] font-semibold text-sm transition-colors">Go to Dashboard</Link>
            <Link href="/" className="block w-full border border-[#E5EAF0] text-[#1B2A4A] px-6 py-3 rounded-lg hover:bg-[#F5F7FA] font-semibold text-sm transition-colors">Back to Home</Link>
          </div>
        </>)}

        {status === 'failed' && (<>
          <div className="w-16 h-16 bg-[#FEF2F2] rounded-full flex items-center justify-center mx-auto"><svg className="w-8 h-8 text-[#EF4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></div>
          <h1 className="text-xl font-bold text-[#1B2A4A] mt-6">Payment Failed</h1>
          <p className="text-[#EF4444] mt-3 text-sm">{message}</p>
          <div className="mt-8 space-y-3">
            <button onClick={() => router.back()} className="block w-full bg-[#1B2A4A] text-white px-6 py-3 rounded-lg hover:bg-[#16213A] font-semibold text-sm transition-colors">Try Again</button>
            <Link href="/" className="block w-full border border-[#E5EAF0] text-[#1B2A4A] px-6 py-3 rounded-lg hover:bg-[#F5F7FA] font-semibold text-sm transition-colors">Back to Home</Link>
          </div>
        </>)}
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return <Suspense fallback={<div className="min-h-[calc(100vh-200px)] flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-[#1B2A4A] border-t-transparent rounded-full"></div></div>}><PaymentCallbackContent /></Suspense>;
}