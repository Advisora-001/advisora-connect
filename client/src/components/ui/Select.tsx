"use client";

import { forwardRef } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  options: SelectOption[];
  placeholder?: string;
  // Native select props we want to allow
  disabled?: boolean;
  required?: boolean;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  onBlur?: React.FocusEventHandler<HTMLSelectElement>;
  value?: string;
  defaultValue?: string;
  name?: string;
  id?: string;
  className?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, fullWidth = true, options, placeholder, className = '', id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    // Explicitly define native select props to avoid spreading custom props
    const nativeProps: React.SelectHTMLAttributes<HTMLSelectElement> = {
      disabled: props.disabled,
      required: props.required,
      onChange: props.onChange,
      onBlur: props.onBlur,
      value: props.value,
      defaultValue: props.defaultValue,
      name: props.name,
      id: selectId,
      className: className,
      'aria-invalid': error ? 'true' : 'false',
      'aria-describedby': error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined,
    };

    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label htmlFor={selectId} className="block text-sm font-semibold text-[#1B2A4A] mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          {...nativeProps}
          className={`
            w-full px-4 py-3 rounded-lg border appearance-none bg-white transition-colors
            focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6]
            disabled:bg-[#F5F7FA] disabled:cursor-not-allowed
            ${error ? 'border-red-500 focus:ring-red-200 focus:border-red-500' : 'border-[#E5EAF0]'}
            ${className}
          `}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={`${selectId}-error`} className="mt-1.5 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${selectId}-helper`} className="mt-1.5 text-sm text-[#94A3B8]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';