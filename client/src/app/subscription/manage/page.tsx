"use client";

import React, { useState } from 'react';
import { useCurrentSubscription, useSubscriptionUsageQuery, useCancelSubscription, useReactivateSubscription, useChangePlan } from '@/hooks/useSubscription';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Modal, Badge } from '@/components/ui';
import { showToast } from '@/components/ui/Toaster';
import { formatPrice, getBillingLabel, hasEntitlement } from '@/hooks/useSubscription';

export default function SubscriptionManagePage() {
  const { data: subscription, isLoading: subLoading, refetch: refetchSub } = useCurrentSubscription();
  const { data: usage, isLoading: usageLoading } = useSubscriptionUsageQuery();
  const cancelMutation = useCancelSubscription();
  const reactivateMutation = useReactivateSubscription();
  const changePlanMutation = useChangePlan();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'professional' | 'premium'>('professional');

  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
  const isCancelled = subscription?.status === 'cancelled';
  const isPastDue = subscription?.status === 'past_due';
  const isExpired = subscription?.status === 'expired';

  if (subLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-2 border-[#1B2A4A] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-[calc(100vh-200px)] py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-[#F5F7FA] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1B2A4A] mb-2">No Active Subscription</h1>
          <p className="text-[#667085] mb-6">You're currently on the Free plan. Upgrade to unlock premium features.</p>
          <a href="/subscription" className="inline-block bg-[#1B2A4A] text-white px-6 py-3 rounded-lg hover:bg-[#16213A] font-semibold text-sm transition-colors">
            View Plans
          </a>
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (subscription?.status) {
      case 'active': return <Badge variant="success" dot>Active</Badge>;
      case 'trialing': return <Badge variant="info" dot>Trial</Badge>;
      case 'past_due': return <Badge variant="warning" dot>Past Due</Badge>;
      case 'cancelled': return <Badge variant="danger" dot>Cancelled</Badge>;
      case 'expired': return <Badge variant="outline" dot>Expired</Badge>;
      case 'pending': return <Badge variant="warning" dot>Pending</Badge>;
      default: return <Badge variant="outline">{subscription?.status}</Badge>;
    }
  };

  const getPlanDisplayName = (key: string) => {
    const names: Record<string, string> = { basic: 'Basic', professional: 'Professional', premium: 'Premium' };
    return names[key] || key;
  };

  return (
    <div className="min-h-[calc(100vh-200px)] py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1B2A4A]">Subscription Management</h1>
            <p className="text-[#667085] mt-1">Manage your subscription, billing, and plan</p>
          </div>
          {subscription?.status === 'cancelled' && (
            <Button onClick={() => reactivateMutation.mutate()}>
              Reactivate
            </Button>
          )}
        </div>

        {/* Current Plan */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="capitalize">{subscription.plan}</CardTitle>
                <CardDescription className="mt-1">
                  <span className="mr-2">{getBillingLabel(subscription.billingInterval)}</span>
                  {getStatusBadge()}
                  {subscription.cancelAtPeriodEnd && (
                    <Badge variant="warning" className="ml-2">Cancels at period end</Badge>
                  )}
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-[#1B2A4A]">
                  {subscription.planSnapshot?.price?.amount ? formatPrice(subscription.planSnapshot.price.amount) : 'Free'}
                </p>
                <p className="text-sm text-[#667085]">{getBillingLabel(subscription.billingInterval)}</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Billing Period */}
            <div className="grid md:grid-cols-2 gap-4 p-4 bg-[#F5F7FA] rounded-xl">
              <div>
                <p className="text-sm text-[#667085]">Current Period</p>
                <p className="font-semibold text-[#1B2A4A]">
                  {new Date(subscription.startDate).toLocaleDateString()} - {new Date(subscription.endDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#667085]">Next Billing</p>
                <p className="font-semibold text-[#1B2A4A]">
                  {new Date(subscription.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {subscription.status === 'active' && (
                <React.Fragment>
                  <Button variant="outline" onClick={() => setShowChangePlanModal(true)}>
                    Change Plan
                  </Button>
                  <Button variant="outline" onClick={() => setShowCancelModal(true)} className="text-[#EF4444] border-[#EF4444] hover:bg-[#FEF2F2]">
                    Cancel Subscription
                  </Button>
                </React.Fragment>
              )}
              {subscription.status === 'cancelled' && (
                <Button onClick={() => reactivateMutation.mutate()} className="bg-[#5DBB63] hover:bg-[#4CA652]">
                  Reactivate Now
                </Button>
              )}
              {subscription.status === 'past_due' && (
                <Button variant="primary" onClick={() => {/* TODO: update payment method */}}>
                  Update Payment Method
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage */}
        {usage && (
          <Card>
            <CardHeader>
              <CardTitle>Usage This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <UsageBar
                  label="Profiles"
                  current={usage.usage.profiles.current}
                  limit={usage.usage.profiles.limit}
                />
                <UsageBar
                  label="Services"
                  current={usage.usage.services.current}
                  limit={usage.usage.services.limit}
                />
                <UsageBar
                  label="Enquiries"
                  current={usage.usage.enquiries.current}
                  limit={usage.usage.enquiries.limit}
                />
                <UsageBar
                  label="Team Seats"
                  current={usage.usage.teamSeats.current}
                  limit={usage.usage.teamSeats.limit}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Your Plan Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {Object.entries({
                listing: 'Professional Listing',
                searchVisibility: 'Search Visibility',
                enquiryManagement: 'Enquiry Management',
                appointmentManagement: 'Appointment Management',
                analytics: 'Analytics & Insights',
                enhancedPlacement: 'Enhanced Placement',
                documentStorage: 'Document Storage',
                crm: 'Client CRM',
                teamManagement: 'Team Management',
                prioritySupport: 'Priority Support',
              }).map(([key, label]) => (
                <div key={key} className="flex items-center gap-3 p-3 bg-[#F5F7FA] rounded-lg">
                  <svg className={`w-5 h-5 ${hasEntitlement(subscription, key as any) ? 'text-[#5DBB63]' : 'text-[#E5EAF0]'}`} fill="currentColor" viewBox="0 0 20 20">
                    {hasEntitlement(subscription, key as any) ? (
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    ) : (
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.707-4.707a1 1 0 011.414 1.414L11.414 10l4.707 4.707a1 1 0 01-1.414 1.414L10 11.414l-4.707 4.707a1 1 0 01-1.414-1.414L10 11.414l-4.707 4.707a1 1 0 01-1.414-1.414L10 11.414l-4.707 4.707a1 1 0 01-1.414-1.414L10 11.414l-4.707 4.707a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    )}
                  </svg>
                  <span className={`text-sm ${hasEntitlement(subscription, key as any) ? 'text-[#1B2A4A]' : 'text-[#94A3B8]'}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-[#667085] py-8">Billing history coming soon. Check your email for receipts.</p>
          </CardContent>
        </Card>
      </div>

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Subscription"
        description="Your subscription will remain active until the end of the current billing period. You can reactivate anytime before then."
      >
        <div className="space-y-4">
          <p className="text-[#667085]">You'll lose access to premium features at the end of your billing period.</p>
          <p className="text-[#667085]">Your data will be saved and you can reactivate anytime.</p>
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => setShowCancelModal(false)}>Keep Subscription</Button>
            <Button variant="danger" onClick={() => { cancelMutation.mutate(); setShowCancelModal(false); }}>
              Cancel Subscription
            </Button>
          </div>
        </div>
      </Modal>

      {/* Change Plan Modal */}
      <Modal
        isOpen={showChangePlanModal}
        onClose={() => setShowChangePlanModal(false)}
        title="Change Plan"
        description="Select a new plan. Changes take effect immediately with prorated billing."
      >
        <div className="space-y-3">
          {(['professional', 'premium'] as const).map((planKey) => (
            <button
              key={planKey}
              onClick={() => { changePlanMutation.mutate(planKey); setShowChangePlanModal(false); }}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                selectedPlan === planKey
                  ? 'border-[#00A6A6] bg-[#00A6A6]/5'
                  : 'border-[#E5EAF0] hover:border-[#00A6A6]'
              }`}
            >
              <div className="font-semibold text-[#1B2A4A] capitalize">{planKey}</div>
              <div className="text-sm text-[#667085] mt-1">Click to select</div>
            </button>
          ))}
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => setShowChangePlanModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => { changePlanMutation.mutate(selectedPlan); setShowChangePlanModal(false); }}>
              Switch to {getPlanDisplayName(selectedPlan)}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function UsageBar({ label, current, limit }: { label: string; current: number; limit: number }) {
  const percentage = limit > 0 ? Math.min(100, (current / limit) * 100) : 0;
  const isNearLimit = percentage > 80;
  const isOverLimit = current > limit;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-[#667085]">{label}</span>
        <span className={`font-semibold ${isOverLimit ? 'text-[#EF4444]' : 'text-[#1B2A4A]'}`}>
          {current} / {limit}
        </span>
      </div>
      <div className="h-2 bg-[#E5EAF0] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isOverLimit ? 'bg-[#EF4444]' : isNearLimit ? 'bg-[#F59E0B]' : 'bg-[#5DBB63]'}`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
      {isOverLimit && <p className="text-xs text-[#EF4444]">Over limit</p>}
    </div>
  );
}