"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Notification } from '@/types/api';

// ============================================
// Query Keys
// ============================================

export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationKeys.all, 'list'] as const,
};

// ============================================
// Queries
// ============================================

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: () => api.getNotifications(),
    refetchInterval: 30000, // Poll every 30 seconds
    staleTime: 10000, // 10 seconds
  });
}

// ============================================
// Mutations
// ============================================

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids?: string[]) => api.markNotificationsRead(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
    },
  });
}