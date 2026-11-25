"use client";

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { showToast } from '@/components/ui/Toaster';

// Query Keys
export const fractionalKeys = {
  all: ['fractional'] as const,
  requests: () => [...fractionalKeys.all, 'requests'] as const,
  proposals: () => [...fractionalKeys.all, 'proposals'] as const,
  proposal: (id: string) => [...fractionalKeys.proposals(), id] as const,
  myProposals: () => [...fractionalKeys.all, 'my-proposals'] as const,
};

// ============================================
// Public Mutations
// ============================================

// Client: Request Fractional GC
export function useRequestFractionalGC() {
  return useMutation({
    mutationFn: (data: Parameters<typeof api.requestFractionalGC>[0]) => api.requestFractionalGC(data),
    onSuccess: (data) => {
      showToast.success('Fractional GC request sent successfully! The lawyer will review and send a proposal.');
    },
    onError: (error: any) => {
      showToast.error(error.response?.data?.message || 'Failed to submit request');
    },
  });
}

// Lawyer: Create Proposal
export function useCreateFractionalProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof api.createFractionalProposal>[0]) => api.createFractionalProposal(data),
    onSuccess: (data) => {
      showToast.success('Proposal sent successfully!');
      queryClient.invalidateQueries({ queryKey: fractionalKeys.myProposals() });
    },
    onError: (error: any) => {
      showToast.error(error.response?.data?.message || 'Failed to create proposal');
    },
  });
}

// Client: Accept Proposal
export function useAcceptFractionalProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.acceptFractionalProposal(id),
    onSuccess: (data) => {
      showToast.success('Proposal accepted! Redirecting to payment...');
      // Redirect to Paystack
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      }
      queryClient.invalidateQueries({ queryKey: fractionalKeys.proposals() });
    },
    onError: (error: any) => {
      showToast.error(error.response?.data?.message || 'Failed to accept proposal');
    },
  });
}

// Client: Reject Proposal
export function useRejectFractionalProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, clientNotes }: { id: string; clientNotes?: string }) => api.rejectFractionalProposal(id, clientNotes),
    onSuccess: (data) => {
      showToast.success('Proposal rejected');
      queryClient.invalidateQueries({ queryKey: fractionalKeys.proposals() });
    },
    onError: (error: any) => {
      showToast.error(error.response?.data?.message || 'Failed to reject proposal');
    },
  });
}

// ============================================
// Public Queries
// ============================================

// Lawyer: Get Fractional Requests
export function useFractionalRequests() {
  return useQuery({
    queryKey: fractionalKeys.requests(),
    queryFn: () => api.getFractionalRequests(),
    staleTime: 30000,
  });
}

// Client: Get Proposals
export function useClientFractionalProposals() {
  return useQuery({
    queryKey: fractionalKeys.proposals(),
    queryFn: () => api.getClientFractionalProposals(),
    staleTime: 30000,
  });
}

// Get Single Proposal
export function useFractionalProposal(id: string, enabled = true) {
  return useQuery({
    queryKey: fractionalKeys.proposal(id),
    queryFn: () => api.getFractionalProposal(id),
    enabled: enabled && !!id,
  });
}

// Lawyer: Get My Proposals
export function useLawyerFractionalProposals() {
  return useQuery({
    queryKey: fractionalKeys.myProposals(),
    queryFn: () => api.getLawyerFractionalProposals(),
    staleTime: 30000,
  });
}

// ============================================
// Engagement Hooks
// ============================================

// Extended query keys for engagements
export const engagementKeys = {
  all: ['engagements'] as const,
  lists: () => [...engagementKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...engagementKeys.lists(), filters] as const,
  details: () => [...engagementKeys.all, 'detail'] as const,
  detail: (id: string) => [...engagementKeys.details(), id] as const,
  stats: () => [...engagementKeys.all, 'stats'] as const,
};

// Lawyer: Get My Engagements
export function useLawyerEngagements(filters?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: engagementKeys.list(filters || {}),
    queryFn: () => api.getLawyerEngagements(filters),
    staleTime: 30000,
  });
}

// Client: Get My Engagements
export function useClientEngagements(filters?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: engagementKeys.list(filters || {}),
    queryFn: () => api.getClientEngagements(filters),
    staleTime: 30000,
  });
}

// Get Single Engagement
export function useEngagement(id: string, enabled = true) {
  return useQuery({
    queryKey: engagementKeys.detail(id),
    queryFn: () => api.getEngagement(id),
    enabled: enabled && !!id,
  });
}

// Engagement Stats
export function useEngagementStats() {
  return useQuery({
    queryKey: engagementKeys.stats(),
    queryFn: () => api.getEngagementStats(),
    staleTime: 60000,
  });
}

// Add Hour Entry
export function useAddHourEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.addHourEntry>[1] }) => api.addHourEntry(id, data),
    onSuccess: (data, variables) => {
      showToast.success('Hours logged successfully!');
      queryClient.invalidateQueries({ queryKey: engagementKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: engagementKeys.stats() });
    },
    onError: (error: any) => {
      showToast.error(error.response?.data?.message || 'Failed to log hours');
    },
  });
}

// Add Meeting
export function useAddMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.addMeeting>[1] }) => api.addMeeting(id, data),
    onSuccess: (data, variables) => {
      showToast.success('Meeting scheduled successfully!');
      queryClient.invalidateQueries({ queryKey: engagementKeys.detail(variables.id) });
    },
    onError: (error: any) => {
      showToast.error(error.response?.data?.message || 'Failed to add meeting');
    },
  });
}

// Update Engagement Status
export function useUpdateEngagementStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.updateEngagementStatus>[1] }) => api.updateEngagementStatus(id, data),
    onSuccess: (data, variables) => {
      showToast.success('Engagement status updated!');
      queryClient.invalidateQueries({ queryKey: engagementKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: engagementKeys.lists() });
      queryClient.invalidateQueries({ queryKey: engagementKeys.stats() });
    },
    onError: (error: any) => {
      showToast.error(error.response?.data?.message || 'Failed to update status');
    },
  });
}

// Renew Engagement
export function useRenewEngagement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.renewEngagement>[1] }) => api.renewEngagement(id, data),
    onSuccess: (data, variables) => {
      showToast.success('Engagement renewed successfully!');
      queryClient.invalidateQueries({ queryKey: engagementKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: engagementKeys.lists() });
    },
    onError: (error: any) => {
      showToast.error(error.response?.data?.message || 'Failed to renew engagement');
    },
  });
}

// ============================================
// Analytics Hooks
// ============================================

// Lawyer Analytics
export function useLawyerAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'lawyer'],
    queryFn: () => api.getLawyerAnalytics(),
    staleTime: 60000,
  });
}

// Client Analytics
export function useClientAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'client'],
    queryFn: () => api.getClientAnalytics(),
    staleTime: 60000,
  });
}

// Admin Analytics
export function useAdminAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'admin'],
    queryFn: () => api.getAdminAnalytics(),
    staleTime: 60000,
  });
}

// ============================================
// Engagement Renewal Hooks
// ============================================

// Lawyer: Request renewal confirmation
export function useRequestRenewalConfirmation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.requestRenewalConfirmation(id),
    onSuccess: (data) => {
      showToast.success('Renewal confirmation request sent to client');
      queryClient.invalidateQueries({ queryKey: engagementKeys.detail(variables.id) });
    },
    onError: (error: any) => {
      showToast.error(error.response?.data?.message || 'Failed to send renewal request');
    },
  });
}

// Client: Confirm/decline renewal
export function useConfirmRenewal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'confirm' | 'decline' }) => api.confirmRenewal(id, action),
    onSuccess: (data, variables) => {
      if (variables.action === 'confirm') {
        showToast.success('Renewal confirmed! Engagement will auto-renew.');
      } else {
        showToast.success('Auto-renewal disabled. Engagement will end on the current end date.');
      }
      queryClient.invalidateQueries({ queryKey: engagementKeys.detail(variables.id) });
    },
    onError: (error: any) => {
      showToast.error(error.response?.data?.message || 'Failed to process renewal');
    },
  });
}

// Update auto-renewal setting
export function useUpdateAutoRenew() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, autoRenew }: { id: string; autoRenew: boolean }) => api.updateAutoRenew(id, autoRenew),
    onSuccess: (data, variables) => {
      showToast.success(`Auto-renewal ${variables.autoRenew ? 'enabled' : 'disabled'}`);
      queryClient.invalidateQueries({ queryKey: engagementKeys.detail(variables.id) });
    },
    onError: (error: any) => {
      showToast.error(error.response?.data?.message || 'Failed to update auto-renewal');
    },
  });
}

// Get renewal status
export function useRenewalStatus(id: string, enabled = true) {
  return useQuery({
    queryKey: [...engagementKeys.detail(id), 'renewal-status'],
    queryFn: () => api.getRenewalStatus(id),
    enabled: enabled && !!id,
    staleTime: 30000,
  });
}