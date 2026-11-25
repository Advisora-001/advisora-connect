"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePlans, Plan } from '@/hooks/useSubscription';
import { Button, Card, Badge } from '@/components/ui';
import { formatPrice, getBillingLabel } from '@/hooks/useSubscription';

const features = [
  { key: 'listing', label: 'Professional Listing', basic: true, professional: true, premium: true },
  { key: 'searchVisibility', label: 'Search Visibility', basic: true, professional: true, premium: true },
  { key: 'enquiryManagement', label: 'Enquiry Management', basic: true, professional: true, premium: true },
  { key: 'appointmentManagement', label: 'Appointment Management', basic: false, professional: true, premium: true },
  { key: 'analytics', label: 'Analytics & Insights', basic: false, professional: true, premium: true },
  { key: 'enhancedPlacement', label: 'Enhanced Placement', basic: false, professional: true, premium: true },
  { key: 'documentStorage', label: 'Document Storage', basic: false, professional: false, premium: true },
  { key: 'crm', label: 'Client CRM', basic: false, professional: false, premium: true },
  { key: 'teamManagement', label: 'Team Management', basic: false, professional: false, premium: true },
  { key: 'prioritySupport', label: 'Priority Support', basic: false, professional: false, premium: true },
];

const limits = [
  { label: 'Max Profiles', basic: 1, professional: 3, premium: 10 },
  { label: 'Max Services', basic: 3, professional: 10, premium: 50 },
  { label: 'Enquiries/Month', basic: 50, professional: 200, premium: 1000 },
  { label: 'Team Seats', basic: 1, professional: 3, premium: 10 },
];

export default function SubscriptionPage() {
  const { data: plans, isLoading } = usePlans();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-2 border-[#1B2A4A] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const sortedPlans = plans
    ?.filter((p: Plan) => p.isActive)
    .sort((a: Plan, b: Plan) => (a.isFree ? -1 : 1) * (a.price.amount - b.price.amount)) || [];

  return (
    <div className="min-h-[calc(100vh-200px)] py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1B2A4A] tracking-tight">
            Choose Your Plan
          </h1>
          <p className="text-[#667085] mt-3 max-w-2xl mx-auto">
            Unlock powerful tools to grow your practice. Start free, upgrade anytime.
          </p>

          {/* Billing Toggle */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${billingInterval === 'monthly' ? 'text-[#1B2A4A]' : 'text-[#94A3B8]'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#00A6A6] focus:ring-offset-2 ${
                billingInterval === 'yearly' ? 'bg-[#00A6A6]' : 'bg-[#E5EAF0]'
              }`}
              role="switch"
              aria-checked={billingInterval === 'yearly'}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  billingInterval === 'yearly' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingInterval === 'yearly' ? 'text-[#1B2A4A]' : 'text-[#94A3B8]'}`}>
              Yearly
            </span>
            <Badge variant="success" size="sm" className="ml-2">
              Save 10%
            </Badge>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {sortedPlans.map((plan) => (
            <PlanCard
              key={plan.key}
              plan={plan}
              billingInterval={billingInterval}
              isPopular={plan.key === 'professional'}
            />
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="mt-16 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-[#1B2A4A] text-center mb-8">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#E5EAF0]">
                  <th className="p-4 font-semibold text-[#1B2A4A]">Feature</th>
                  {sortedPlans.map((plan) => (
                    <th key={plan.key} className="p-4 font-semibold text-center text-[#1B2A4A]">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((feature) => (
                  <tr key={feature.key} className="border-b border-[#E5EAF0]">
                    <td className="p-4 text-[#475569]">{feature.label}</td>
                    {sortedPlans.map((plan) => (
                      <td key={plan.key} className="p-4 text-center">
                        {plan.entitlements[feature.key as keyof typeof plan.entitlements] ? (
                          <svg className="w-5 h-5 text-[#5DBB63] mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-[#E5EAF0] mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.707-4.707a1 1 0 011.414 1.414L11.414 10l4.707 4.707a1 1 0 01-1.414 1.414L10 11.414l-4.707 4.707a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                {limits.map((limit) => (
                  <tr key={limit.label} className="border-b border-[#E5EAF0]">
                    <td className="p-4 text-[#475569]">{limit.label}</td>
                    {sortedPlans.map((plan) => (
                      <td key={plan.key} className="p-4 text-center font-medium text-[#1B2A4A]">
                        {plan.limits[limit.label.toLowerCase().replace(/[^a-z]/g, '') as keyof typeof plan.limits] || 0}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-[#1B2A4A] text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details key={faq.q} className="group bg-white border border-[#E5EAF0] rounded-lg p-5">
                <summary className="font-semibold text-[#1B2A4A] cursor-pointer list-none flex items-center justify-between">
                  {faq.q}
                  <svg className="w-5 h-5 text-[#94A3B8] transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-3 text-[#667085] text-sm">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface PlanCardProps {
  plan: Plan;
  billingInterval: 'monthly' | 'yearly';
  isPopular: boolean;
}

function PlanCard({ plan, billingInterval, isPopular }: PlanCardProps) {
  const isFree = plan.isFree;
  const amount = billingInterval === 'yearly' ? plan.price.amount * 12 * 0.9 : plan.price.amount;
  const firmAmount = billingInterval === 'yearly' ? plan.firmPrice.amount * 12 * 0.9 : plan.firmPrice.amount;

  return (
    <div className={`relative rounded-2xl border p-6 transition-all ${
      isPopular ? 'border-[#00A6A6] shadow-lg shadow-[#00A6A6]/10' : 'border-[#E5EAF0]'
    }`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="info">Most Popular</Badge>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-[#1B2A4A]">{plan.name}</h3>
        <p className="text-[#667085] text-sm mt-1">{plan.description}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold text-[#1B2A4A]">
            {isFree ? 'Free' : `₦${amount.toLocaleString()}`}
          </span>
          <span className="text-[#94A3B8]">/month</span>
        </div>
        {billingInterval === 'yearly' && !isFree && (
          <p className="text-center text-sm text-[#5DBB63] mt-1">
            ₦{Math.round(amount * 12).toLocaleString()}/year (10% off)
          </p>
        )}
      </div>

      {isFree ? (
        <Button variant="outline" className="w-full">
          <Link href="/register?role=professional">Get Started Free</Link>
        </Button>
      ) : (
        <>
          <Button variant="primary" className="w-full mb-3">
            <Link href={`/subscription/checkout?planKey=${plan.key}`}>Choose Plan</Link>
          </Button>
          {plan.firmPrice.amount > 0 && (
            <Button variant="outline" className="w-full">
              <Link href={`/subscription/checkout?planKey=${plan.key}&type=firm`}>
                Firm Plan: ₦{billingInterval === 'yearly' ? Math.round(plan.firmPrice.amount * 12 * 0.9) : plan.firmPrice.amount.toLocaleString()}{billingInterval === 'yearly' ? '/yr' : '/mo'}
              </Link>
            </Button>
          )}
        </>
      )}

      {/* Limits */}
      <div className="mt-6 pt-6 border-t border-[#E5EAF0]">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between text-[#667085]">
            <span>Profiles</span>
            <span className="font-medium text-[#1B2A4A]">{plan.limits.maxProfiles}</span>
          </div>
          <div className="flex justify-between text-[#667085]">
            <span>Services</span>
            <span className="font-medium text-[#1B2A4A]">{plan.limits.maxServices}</span>
          </div>
          <div className="flex justify-between text-[#667085]">
            <span>Enquiries/mo</span>
            <span className="font-medium text-[#1B2A4A]">{plan.limits.maxEnquiriesPerMonth}</span>
          </div>
          <div className="flex justify-between text-[#667085]">
            <span>Team Seats</span>
            <span className="font-medium text-[#1B2A4A]">{plan.includedSeats}</span>
          </div>
        </div>
      </div>

      {/* Entitlements */}
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-[#1B2A4A] mb-3">Includes</h4>
        <ul className="space-y-2 text-sm text-[#667085]">
          {Object.entries(plan.entitlements)
            .filter(([, value]) => value)
            .map(([key]) => (
              <li key={key} className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#5DBB63]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}

const faqs = [
  { q: 'Can I change plans later?', a: 'Yes, you can upgrade or downgrade at any time. Changes take effect immediately, and we\'ll prorate the difference.' },
  { q: 'What happens when my subscription expires?', a: 'You\'ll lose access to premium features but keep your data. You can renew anytime to restore access.' },
  { q: 'Is there a free trial?', a: 'The Basic plan is free forever. For paid plans, we offer a 14-day money-back guarantee.' },
  { q: 'Can I cancel anytime?', a: 'Yes, cancel anytime from your dashboard. You\'ll retain access until the end of your billing period.' },
  { q: 'What payment methods are accepted?', a: 'We accept all major cards, bank transfers, and USSD via Paystack.' },
];