"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { AdminUser, Payout, ProfessionalCategory } from '@/types/api';

// ============================================
// Query Keys
// ============================================

export const adminKeys = {
  all: ['admin'] as const,
  analytics: () => [...adminKeys.all, 'analytics'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
  verifications: () => [...adminKeys.all, 'verifications'] as const,
  revenue: () => [...adminKeys.all, 'revenue'] as const,
  payouts: () => [...adminKeys.all, 'payouts'] as const,
  membershipConfig: () => [...adminKeys.all, 'membership-config'] as const,
  categories: () => [...adminKeys.all, 'categories'] as const,
};

// ============================================
// Queries
// ============================================

export function useAdminAnalytics() {
  return useQuery({
    queryKey: adminKeys.analytics(),
    queryFn: () => api.getAnalytics(),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: adminKeys.users(),
    queryFn: () => api.getAdminUsers(),
    staleTime: 60 * 1000,
  });
}

export function usePendingVerifications() {
  return useQuery({
    queryKey: adminKeys.verifications(),
    queryFn: () => api.getPendingVerifications(),
    staleTime: 30 * 1000,
  });
}

export function useAdminRevenue() {
  return useQuery({
    queryKey: adminKeys.revenue(),
    queryFn: () => api.getRevenue(),
    staleTime: 60 * 1000,
  });
}

export function useAdminPayouts() {
  return useQuery({
    queryKey: adminKeys.payouts(),
    queryFn: () => api.getPayouts(),
    staleTime: 60 * 1000,
  });
}

export function useMembershipConfig() {
  return useQuery({
    queryKey: adminKeys.membershipConfig(),
    queryFn: () => api.getMembershipConfig(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminCategories() {
  return useQuery({
    queryKey: adminKeys.categories(),
    queryFn: () => api.getAdminProfessionalCategories(),
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================
// Mutations
// ============================================

export function useVerifyProfessional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'verified' | 'rejected' }) =>
      api.verifyProfessional(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.verifications() });
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
    },
  });
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.toggleUserStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

export function useProcessPayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, adminNote }: { id: string; status: string; adminNote?: string }) =>
      api.processPayout(id, status, adminNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.payouts() });
      queryClient.invalidateQueries({ queryKey: adminKeys.revenue() });
    },
  });
}

export function useSaveMembershipPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, data }: { key: string; data: Record<string, unknown> }) => api.saveMembershipPlan(key, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.membershipConfig() });
    },
  });
}

export function useSavePlatformFeePolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transactionType, data }: { transactionType: string; data: Record<string, unknown> }) =>
      api.savePlatformFeePolicy(transactionType, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.membershipConfig() });
    },
  });
}

export function useCreateProfessionalCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof api.createProfessionalCategory>[0]) =>
      api.createProfessionalCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.categories() });
    },
  });
}

export function useUpdateProfessionalCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      api.updateProfessionalCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.categories() });
    },
  });
}