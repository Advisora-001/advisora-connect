"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { showToast } from '@/components/ui/Toaster';

// Types
export interface Plan {
  key: string;
  name: string;
  description: string;
  isFree: boolean;
  billingInterval: 'monthly' | 'yearly';
  price: { amount: number; currency: string };
  firmPrice: { amount: number; currency: string };
  entitlements: {
    listing: boolean;
    searchVisibility: boolean;
    enhancedPlacement: boolean;
    appointmentManagement: boolean;
    analytics: boolean;
    enquiryManagement: boolean;
    documentStorage?: boolean;
    crm?: boolean;
    teamManagement?: boolean;
    prioritySupport?: boolean;
  };
  limits: {
    maxProfiles: number;
    maxServices: number;
    maxEnquiriesPerMonth: number;
  };
  includedSeats: number;
  additionalSeatPrice: { amount: number; currency: string };
  isActive?: boolean;
}

export interface Subscription {
  _id: string;
  userId: string;
  planId: string;
  plan: string;
  status: 'pending' | 'active' | 'trialing' | 'past_due' | 'cancelled' | 'expired';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  cancelAtPeriodEnd: boolean;
  paystackRef: string;
  paystackSubscriptionCode?: string;
  paystackCustomerCode?: string;
  amount: number;
  currency: string;
  billingInterval: 'monthly' | 'yearly';
  planSnapshot?: {
    name: string;
    key: string;
    entitlements: Plan['entitlements'];
    limits: Plan['limits'];
    price: Plan['price'];
  };
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionUsage {
  subscription: Subscription | null;
  usage: {
    profiles: { current: number; limit: number };
    services: { current: number; limit: number };
    enquiries: { current: number; limit: number };
    teamSeats: { current: number; limit: number };
  };
}

export interface CreateCheckoutParams {
  planKey: string;
  billingInterval?: 'monthly' | 'yearly';
}

export interface CreateCheckoutResponse {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
  subscriptionId: string;
}

export interface VerifySubscriptionParams {
  reference: string;
}

// Query Keys
export const subscriptionKeys = {
  all: ['subscriptions'] as const,
  plans: () => [...subscriptionKeys.all, 'plans'] as const,
  current: () => [...subscriptionKeys.all, 'current'] as const,
  usage: () => [...subscriptionKeys.all, 'usage'] as const,
};

// Plans
export function usePlans() {
  return useQuery({
    queryKey: subscriptionKeys.plans(),
    queryFn: async () => {
      const response = await api.get('/subscriptions/plans') as { plans: Plan[] };
      return response.plans;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Current Subscription
export function useCurrentSubscription() {
  return useQuery({
    queryKey: subscriptionKeys.current(),
    queryFn: async () => {
      const response = await api.get('/subscriptions/current') as { subscription: Subscription | null };
      return response.subscription;
    },
    retry: false,
  });
}

// Subscription Usage
export function useSubscriptionUsageQuery() {
  return useQuery({
    queryKey: subscriptionKeys.usage(),
    queryFn: async () => {
      const response = await api.get('/subscriptions/usage') as SubscriptionUsage | null;
      return response;
    },
    enabled: false,
  });
}

// Create Subscription Checkout
export function useCreateSubscriptionCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateCheckoutParams) => {
      const response = await api.post('/subscriptions/checkout', params) as CreateCheckoutResponse;
      return response;
    },
    onSuccess: (data) => {
      // Redirect to Paystack checkout
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      }
    },
    onError: (error: any) => {
      showToast.error(error.response?.data?.message || 'Failed to initialize checkout');
    },
  });
}

// Verify Subscription Payment
export function useVerifySubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: VerifySubscriptionParams) => {
      const response = await api.post('/subscriptions/verify', params) as {
        success: boolean;
        subscription: Subscription;
        message: string;
      };
      return response;
    },
    onSuccess: (data) => {
      if (data.success) {
        showToast.success('Subscription activated successfully!');
        queryClient.invalidateQueries({ queryKey: subscriptionKeys.current() });
        queryClient.invalidateQueries({ queryKey: subscriptionKeys.usage() });
      }
    },
    onError: (error: any) => {
      showToast.error(error.response?.data?.message || 'Verification failed');
    },
  });
}

// Cancel Subscription
export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/subscriptions/cancel') as { message: string };
      return response;
    },
    onSuccess: (data) => {
      showToast.success(data.message || 'Subscription cancelled');
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.current() });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.usage() });
    },
    onError: (error: any) => {
      showToast.error(error.response?.data?.message || 'Failed to cancel subscription');
    },
  });
}

// Reactivate Subscription
export function useReactivateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/subscriptions/reactivate') as { message: string };
      return response;
    },
    onSuccess: (data) => {
      showToast.success('Subscription reactivated');
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.current() });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.usage() });
    },
    onError: (error: any) => {
      showToast.error(error.response?.data?.message || 'Failed to reactivate');
    },
  });
}

// Change Plan
export function useChangePlan() {
  return useMutation({
    mutationFn: async (newPlanKey: string) => {
      const response = await api.post('/subscriptions/change-plan', { newPlanKey }) as {
        message: string;
        redirectTo?: string;
      };
      return response;
    },
    onSuccess: (data) => {
      if (data.redirectTo) {
        window.location.href = data.redirectTo;
      }
    },
    onError: (error: any) => {
      showToast.error(error.response?.data?.message || 'Failed to change plan');
    },
  });
}

// Format price helper
export function formatPrice(amount: number, currency = 'NGN'): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Get billing interval label
export function getBillingLabel(interval: 'monthly' | 'yearly'): string {
  return interval === 'yearly' ? '/year' : '/month';
}

// Check if feature is available in subscription
export function hasEntitlement(
  subscription: Subscription | null,
  entitlement: keyof Plan['entitlements']
): boolean {
  if (!subscription) return false;
  if (subscription.plan === 'basic' || subscription.status !== 'active') return false;
  const planSnapshot = subscription.planSnapshot;
  return planSnapshot?.entitlements?.[entitlement] ?? false;
}

// Get usage percentage
export function getUsagePercentage(current: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min(100, (current / limit) * 100);
}