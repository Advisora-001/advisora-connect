"use client";

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useVerifySubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui';
import Link from 'next/link';

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get('reference');
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [message, setMessage] = useState('');
  const { mutate: verifySubscription, isPending } = useVerifySubscription();

  useEffect(() => {
    if (reference) {
      verifySubscription({ reference });
    } else {
      setStatus('failed');
      setMessage('No payment reference found');
    }
  }, [reference]);

  const handleRedirect = () => {
    router.push('/dashboard/professional');
  };

  if (status === 'verifying') {
    return (
      <div className="min-h-[calc(100vh-200px)] py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl border border-[#E5EAF0] p-8 text-center shadow-sm">
            <div className="animate-spin w-14 h-14 border-2 border-[#1B2A4A] border-t-transparent rounded-full mx-auto"></div>
            <h1 className="text-xl font-bold text-[#1B2A4A] mt-6">Verifying Payment</h1>
            <p className="text-[#667085] mt-3 text-sm">Please wait while we verify your subscription payment...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-200px)] py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl border border-[#E5EAF0] p-8 text-center shadow-sm">
          {status === 'success' ? (
            <>
              <div className="w-16 h-16 bg-[#ECFDF5] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-[#5DBB63]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-[#1B2A4A] mb-2">Subscription Activated!</h1>
              <p className="text-[#667085] mb-6">Your subscription has been successfully activated.</p>
              <Button onClick={handleRedirect} className="w-full" size="lg">
                Go to Dashboard
              </Button>
              <p className="mt-4 text-sm text-[#94A3B8]">
                <Link href="/subscription/manage" className="text-[#00A6A6] hover:underline">
                  Manage Subscription
                </Link>
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-[#FEF2F2] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-[#EF4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-[#1B2A4A] mb-2">Payment Verification Failed</h1>
              <p className="text-[#667085] mb-6">{message || 'Unable to verify your payment. Please try again or contact support.'}</p>
              <div className="space-y-3">
                <Button variant="outline" onClick={() => router.push('/subscription')} className="w-full">
                  Try Again
                </Button>
                <Link href="/subscription" className="block text-center text-[#00A6A6] hover:underline">
                  Back to Plans
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}