"use client";

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { showToast } from '@/components/ui/Toaster';

// Query Keys
export const proBonoKeys = {
  all: ['pro-bono'] as const,
  applications: () => [...proBonoKeys.all, 'applications'] as const,
  application: (id: string) => [...proBonoKeys.applications(), id] as const,
  volunteers: () => [...proBonoKeys.all, 'volunteers'] as const,
  volunteer: (id: string) => [...proBonoKeys.volunteers(), id] as const,
  stats: () => [...proBonoKeys.all, 'stats'] as const,
};

// ============================================
// Public Mutations
// ============================================

// Submit Pro Bono Application
export function useSubmitProBonoApplication() {
  return useMutation({
    mutationFn: (data: Parameters<typeof api.submitProBonoApplication>[0]) => api.submitProBonoApplication(data),
    onSuccess: (data) => {
      showToast.success('Application submitted successfully! Our team will review and contact you within 5 business days.');
    },
    onError: (error: any) => {
      showToast.error(error.response?.data?.message || 'Failed to submit application');
    },
  });
}

// Register Volunteer Lawyer
export function useRegisterVolunteerLawyer() {
  return useMutation({
    mutationFn: (data: Parameters<typeof api.registerVolunteerLawyer>[0]) => api.registerVolunteerLawyer(data),
    onSuccess: (data) => {
      showToast.success('Volunteer registration submitted successfully! Our team will review and contact you within 5 business days.');
    },
    onError: (error: any) => {
      showToast.error(error.response?.data?.message || 'Failed to submit volunteer registration');
    },
  });
}

// ============================================
// Public Queries
// ============================================

// Get Pro Bono Application Status
export function useProBonoApplication(id: string, enabled = true) {
  return useQuery({
    queryKey: proBonoKeys.application(id),
    queryFn: () => api.getProBonoApplication(id),
    enabled: enabled && !!id,
    retry: false,
  });
}

// ============================================
// Admin Queries
// ============================================

// Get Admin Pro Bono Applications
export function useAdminProBonoApplications(params?: { status?: string; category?: string; urgency?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...proBonoKeys.applications(), params],
    queryFn: () => api.getAdminProBonoApplications(params),
    staleTime: 30000,
  });
}

// Get Admin Pro Bono Application Detail
export function useAdminProBonoApplication(id: string, enabled = true) {
  return useQuery({
    queryKey: proBonoKeys.application(id),
    queryFn: () => api.getAdminProBonoApplication(id),
    enabled: enabled && !!id,
  });
}

// Get Admin Volunteer Lawyers
export function useAdminVolunteerLawyers(params?: { status?: string; category?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...proBonoKeys.volunteers(), params],
    queryFn: () => api.getAdminVolunteerLawyers(params),
    staleTime: 30000,
  });
}

// Get Admin Volunteer Lawyer Detail
export function useAdminVolunteerLawyer(id: string, enabled = true) {
  return useQuery({
    queryKey: proBonoKeys.volunteer(id),
    queryFn: () => api.getAdminVolunteerLawyer(id),
    enabled: enabled && !!id,
  });
}

// Get Pro Bono Stats
export function useProBonoStats() {
  return useQuery({
    queryKey: proBonoKeys.stats(),
    queryFn: () => api.getProBonoStats(),
    staleTime: 60000,
  });
}

// ============================================
// Admin Mutations
// ============================================

// Update Pro Bono Application (Admin)
export function useUpdateProBonoApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.updateProBonoApplication>[1] }) => api.updateProBonoApplication(id, data),
    onSuccess: (data, variables) => {
      showToast.success('Application updated successfully');
      queryClient.invalidateQueries({ queryKey: proBonoKeys.applications() });
      queryClient.invalidateQueries({ queryKey: proBonoKeys.application(variables.id) });
      queryClient.invalidateQueries({ queryKey: proBonoKeys.stats() });
    },
    onError: (error: any) => {
      showToast.error(error.response?.data?.message || 'Failed to update application');
    },
  });
}

// Update Volunteer Lawyer (Admin)
export function useUpdateVolunteerLawyer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.updateVolunteerLawyer>[1] }) => api.updateVolunteerLawyer(id, data),
    onSuccess: (data, variables) => {
      showToast.success('Volunteer updated successfully');
      queryClient.invalidateQueries({ queryKey: proBonoKeys.volunteers() });
      queryClient.invalidateQueries({ queryKey: proBonoKeys.volunteer(variables.id) });
      queryClient.invalidateQueries({ queryKey: proBonoKeys.stats() });
    },
    onError: (error: any) => {
      showToast.error(error.response?.data?.message || 'Failed to update volunteer');
    },
  });
}