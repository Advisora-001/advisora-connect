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