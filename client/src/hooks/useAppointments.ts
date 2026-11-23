"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Appointment } from '@/types/api';

// ============================================
// Query Keys
// ============================================

export const appointmentKeys = {
  all: ['appointments'] as const,
  myAppointments: () => [...appointmentKeys.all, 'my'] as const,
  professionalAppointments: () => [...appointmentKeys.all, 'professional'] as const,
  detail: (id: string) => [...appointmentKeys.all, 'detail', id] as const,
};

// ============================================
// Queries
// ============================================

export function useMyAppointments() {
  return useQuery({
    queryKey: appointmentKeys.myAppointments(),
    queryFn: () => api.getMyAppointments(),
  });
}

export function useProfessionalAppointments() {
  return useQuery({
    queryKey: appointmentKeys.professionalAppointments(),
    queryFn: () => api.getProfessionalAppointments(),
  });
}

// Legacy alias
export const useLawyerAppointments = useProfessionalAppointments;

// ============================================
// Mutations
// ============================================

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.cancelAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.myAppointments() });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.professionalAppointments() });
      queryClient.invalidateQueries({ queryKey: leadKeys.myEnquiries() });
    },
  });
}

export function useGenerateMeetingLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (appointmentId: string) => api.generateMeetingLink(appointmentId),
    onSuccess: (data, appointmentId) => {
      if (data.meetingLink) {
        queryClient.setQueryData(appointmentKeys.detail(appointmentId), (old: Appointment | undefined) => {
          if (!old) return old;
          return { ...old, meetingLink: data.meetingLink };
        });
      }
      queryClient.invalidateQueries({ queryKey: appointmentKeys.professionalAppointments() });
    },
  });
}

export function useSetMeetingLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ appointmentId, meetingLink }: { appointmentId: string; meetingLink: string }) =>
      api.setMeetingLink(appointmentId, meetingLink),
    onSuccess: (_, { appointmentId }) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.professionalAppointments() });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(appointmentId) });
    },
  });
}

export function useCompleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (appointmentId: string) => api.completeAppointment(appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.professionalAppointments() });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.myAppointments() });
    },
  });
}

// Import leadKeys for cross-invalidation
import { leadKeys } from './useLeads';