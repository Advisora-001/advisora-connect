"use client";

import { Toaster as SonnerToaster, toast, type ToastT } from 'sonner';

export { toast };

// Custom toast variants for consistent usage
export const showToast = {
  success: (message: string, options?: { description?: string; action?: { label: string; onClick: () => void } }) =>
    toast.success(message, options),

  error: (message: string, options?: { description?: string; action?: { label: string; onClick: () => void } }) =>
    toast.error(message, options),

  info: (message: string, options?: { description?: string }) =>
    toast.info(message, options),

  warning: (message: string, options?: { description?: string }) =>
    toast.warning(message, options),

  loading: (message: string, options?: { description?: string }) =>
    toast.loading(message, options),

  promise: <T,>(
    promise: Promise<T>,
    messages: { loading: string; success: string | ((data: T) => string); error: string | ((error: Error) => string) }
  ) =>
    toast.promise(promise, messages),

  dismiss: (toastId?: string | number) => toast.dismiss(toastId),
};

// Toast component to render in layout
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      theme="light"
      className="z-[100]"
      toastOptions={{
        classNames: {
          toast: 'rounded-xl border border-[#E5EAF0] bg-white shadow-lg',
          title: 'text-[#1B2A4A] font-semibold',
          description: 'text-[#667085] text-sm',
          closeButton: 'text-[#94A3B8] hover:text-[#1B2A4A]',
        },
        duration: 4000,
      }}
    />
  );
}