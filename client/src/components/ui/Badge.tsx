"use client";

import { HTMLAttributes, forwardRef } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

const variantStyles = {
  default: 'bg-[#1B2A4A] text-white',
  success: 'bg-[#ECFDF5] text-[#166534]',
  warning: 'bg-[#FFFBEB] text-[#92400E]',
  danger: 'bg-[#FEF2F2] text-[#991B1B]',
  info: 'bg-[#EFF6FF] text-[#1E40AF]',
  outline: 'bg-transparent border border-[#E5EAF0] text-[#475569]',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1 text-sm',
};

const dotColors = {
  default: 'bg-[#1B2A4A]',
  success: 'bg-[#5DBB63]',
  warning: 'bg-[#F59E0B]',
  danger: 'bg-[#EF4444]',
  info: 'bg-[#00A6A6]',
  outline: 'bg-[#94A3B8]',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', size = 'md', dot = false, className = '', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center gap-1.5 font-medium rounded-full
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {dot && <span className={`
          w-1.5 h-1.5 rounded-full flex-shrink-0
          ${dotColors[variant]}
        `} aria-hidden="true" />}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';