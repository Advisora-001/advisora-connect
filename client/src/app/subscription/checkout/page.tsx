"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCreateSubscriptionCheckout } from '@/hooks/useSubscription';
import { Button } from '@/components/ui';
import { formatPrice } from '@/hooks/useSubscription';

export default function SubscriptionCheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planKey = searchParams.get('planKey');
  const type = searchParams.get('type') || 'individual';
  const billingInterval = searchParams.get('billingInterval') || 'monthly';

  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutate: createCheckout, isPending } = useCreateSubscriptionCheckout();

  useEffect(() => {
    if (!planKey) {
      router.push('/subscription');
      return;
    }
    setLoading(false);
  }, [planKey, router]);

  const handleCheckout = async () => {
    if (!planKey) return;

    setInitializing(true);
    setError(null);

    try {
      await createCheckout({ planKey, billingInterval: billingInterval as 'monthly' | 'yearly' });
    } catch (err) {
      // Error handled by mutation
    } finally {
      setInitializing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-2 border-[#1B2A4A] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-200px)] py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl border border-[#E5EAF0] p-8 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#1B2A4A]">Complete Your Subscription</h1>
            <p className="text-[#667085] mt-2">You're about to subscribe via Paystack</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-[#FEF2F2] border border-[#EF4444]/20 rounded-lg text-[#EF4444] text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4 mb-8">
            <div className="bg-[#F5F7FA] rounded-xl p-5">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-[#667085]">Plan</span>
                <span className="font-semibold text-[#1B2A4A] capitalize">{new URLSearchParams(window.location.search).get('planKey')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#667085]">Billing</span>
                <span className="font-semibold text-[#1B2A4A] capitalize">{new URLSearchParams(window.location.search).get('billingInterval') || 'monthly'}</span>
              </div>
            </div>

            <div className="bg-[#EFF6FF] border border-[#2476B8]/20 rounded-xl p-4">
              <p className="text-sm text-[#1E40AF] flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                You will be redirected to Paystack to complete payment securely.
              </p>
            </div>

            <Button
              onClick={handleCheckout}
              disabled={initializing || isPending}
              className="w-full"
              size="lg"
            >
              {initializing || isPending ? 'Redirecting to Paystack...' : 'Proceed to Paystack'}
            </Button>

            <p className="text-center text-xs text-[#94A3B8] mt-4">
              By proceeding, you agree to our{' '}
              <a href="/terms-of-use" className="underline hover:text-[#1B2A4A]">Terms of Service</a>
              {' and '}
              <a href="/privacy-policy" className="underline hover:text-[#1B2A4A]">Privacy Policy</a>
            </p>

            <div className="mt-6 pt-6 border-t border-[#E5EAF0]">
              <p className="text-center text-xs text-[#94A3B8]">
                Secure payment powered by <strong>Paystack</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}