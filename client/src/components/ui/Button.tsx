"use client";

import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

const variantStyles = {
  primary: 'bg-[#1B2A4A] text-white hover:bg-[#16213A] active:bg-[#111A2E] focus:ring-[#1B2A4A]',
  secondary: 'bg-[#00A6A6] text-white hover:bg-[#008F8F] active:bg-[#007A7A] focus:ring-[#00A6A6]',
  success: 'bg-[#5DBB63] text-white hover:bg-[#4CA652] active:bg-[#3D9142] focus:ring-[#5DBB63]',
  outline: 'border-2 border-[#1B2A4A] text-[#1B2A4A] hover:bg-[#1B2A4A]/5 active:bg-[#1B2A4A]/10 focus:ring-[#1B2A4A]',
  ghost: 'text-[#1B2A4A] hover:bg-[#EEF2F7] active:bg-[#E5EAF0] focus:ring-[#1B2A4A]',
  danger: 'bg-[#EF4444] text-white hover:bg-[#DC2626] active:bg-[#B91C1C] focus:ring-[#EF4444]',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, fullWidth = false, disabled, className = '', children, ...props }, ref) => {
    const isDisabled = disabled || loading;
    const classNames = [
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      fullWidth ? 'w-full' : '',
      className,
    ].filter(Boolean).join(' ');

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={classNames}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';