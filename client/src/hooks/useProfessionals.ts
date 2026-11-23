"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { LawyerFilters, LawyerListItem, CreateLeadRequest } from '@/types/api';

export type { LawyerFilters, LawyerListItem };

// ============================================
// Query Keys
// ============================================

export const professionalKeys = {
  all: ['professionals'] as const,
  lists: () => [...professionalKeys.all, 'list'] as const,
  list: (filters: LawyerFilters) => [...professionalKeys.lists(), filters] as const,
  details: () => [...professionalKeys.all, 'detail'] as const,
  detail: (id: string) => [...professionalKeys.details(), id] as const,
  availability: (id: string, date: string) => [...professionalKeys.all, 'availability', id, date] as const,
};

// ============================================
// Queries
// ============================================

export function useProfessionals(filters: LawyerFilters = {}) {
  return useQuery({
    queryKey: professionalKeys.list(filters),
    queryFn: () => api.getProfessionals(filters),
    placeholderData: (previousData) => previousData,
  });
}

// Legacy alias
export const useLawyers = useProfessionals;

export function useProfessional(id: string, enabled = true) {
  return useQuery({
    queryKey: professionalKeys.detail(id),
    queryFn: () => api.getProfessionalById(id),
    enabled: enabled && !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Legacy alias
export const useLawyer = useProfessional;

export function useProfessionalAvailability(id: string, date: string, enabled = true) {
  return useQuery({
    queryKey: professionalKeys.availability(id, date),
    queryFn: () => api.getProfessionalAvailability(id, date),
    enabled: enabled && !!id && !!date,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Legacy alias
export const useLawyerAvailability = useProfessionalAvailability;

// ============================================
// Mutations
// ============================================

export function useUpdateProfessionalProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: unknown) => api.updateProfessionalProfile(data),
    onSuccess: (updatedProfile, _variables, context) => {
      // Invalidate and refetch professional lists
      queryClient.invalidateQueries({ queryKey: professionalKeys.lists() });
      // Update the specific professional detail cache
      if (updatedProfile && typeof updatedProfile === 'object' && '_id' in updatedProfile) {
        queryClient.setQueryData(professionalKeys.detail((updatedProfile as { _id: string })._id), updatedProfile);
      }
    },
  });
}

export function useSubmitProfessionalVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      category: string;
      specialization?: string;
      categoryData?: Record<string, unknown>;
      declaration: {
        informationAccurate: boolean;
        qualifiedToPractise: boolean;
        noDisciplinaryAction: boolean;
      };
    }) => api.submitProfessionalVerification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: professionalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: professionalKeys.details() });
    },
  });
}

export function useUploadVerificationDocs() {
  return useMutation({
    mutationFn: (formData: FormData) => api.uploadVerificationDocs(formData),
  });
}

export function useUploadPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => api.uploadPhoto(formData),
    onSuccess: (data) => {
      // The photo URL will be in the response
      queryClient.invalidateQueries({ queryKey: professionalKeys.details() });
    },
  });
}

export function useAcceptOnboardingAgreement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.acceptOnboardingAgreement(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: professionalKeys.details() });
    },
  });
}

export function useSubmitDeclaration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { informationAccurate: boolean; qualifiedToPractise: boolean; noDisciplinaryAction: boolean }) =>
      api.submitDeclaration(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: professionalKeys.details() });
    },
  });
}