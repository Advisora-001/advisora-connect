"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Wallet } from '@/types/api';

// ============================================
// Query Keys
// ============================================

export const walletKeys = {
  all: ['wallet'] as const,
  detail: () => [...walletKeys.all, 'detail'] as const,
};

// ============================================
// Queries
// ============================================

export function useWallet() {
  return useQuery({
    queryKey: walletKeys.detail(),
    queryFn: () => api.getWallet(),
    staleTime: 30 * 1000, // 30 seconds
    select: (data) => data?.wallet,
  });
}

// ============================================
// Mutations
// ============================================

export function useRequestPayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (amount: number) => api.requestPayout(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.detail() });
    },
  });
}