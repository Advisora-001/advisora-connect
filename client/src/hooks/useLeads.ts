"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Lead, CreateLeadRequest, RespondToLeadRequest } from '@/types/api';

// ============================================
// Query Keys
// ============================================

export const leadKeys = {
  all: ['leads'] as const,
  lists: () => [...leadKeys.all, 'list'] as const,
  list: (params?: Record<string, string>) => [...leadKeys.lists(), params] as const,
  myEnquiries: () => [...leadKeys.all, 'my-enquiries'] as const,
  detail: (id: string) => [...leadKeys.all, 'detail', id] as const,
};

// ============================================
// Queries
// ============================================

export function useLeads(params?: Record<string, string>) {
  return useQuery({
    queryKey: leadKeys.list(params),
    queryFn: () => api.getLeads(),
  });
}

export function useMyEnquiries() {
  return useQuery({
    queryKey: leadKeys.myEnquiries(),
    queryFn: () => api.getMyEnquiries(),
  });
}

// ============================================
// Mutations
// ============================================

export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLeadRequest) => api.createLead(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.myEnquiries() });
    },
  });
}

export function useCreateBookingRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof api.createBookingRequest>[0]) => api.createBookingRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.myEnquiries() });
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
    },
  });
}

export function useRespondToLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'accepted' | 'declined' }) => api.respondToLead(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.myEnquiries() });
    },
  });
}

export function useBookConsultation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.bookConsultation>[1] }) => api.bookConsultation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.myEnquiries() });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}