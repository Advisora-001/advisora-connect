"use client";

import { HTMLAttributes, forwardRef } from 'react';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ variant = 'text', width, height, lines, className = '', style, ...props }, ref) => {
    const baseStyle = {
      ...style,
      width: width ? `${width}px` : undefined,
      height: height ? `${height}px` : undefined,
    };

    if (variant === 'circular') {
      return (
        <div
          ref={ref}
          className={`
            rounded-full bg-[#E5EAF0] animate-pulse
            ${className}
          `}
          style={{ width: width || 40, height: height || 40, ...style }}
          {...props}
        />
      );
    }

    if (variant === 'rectangular') {
      return (
        <div
          ref={ref}
          className={`
            rounded-lg bg-[#E5EAF0] animate-pulse
            ${className}
          `}
          style={baseStyle}
          {...props}
        />
      );
    }

    if (variant === 'card') {
      return (
        <div
          ref={ref}
          className={`
            bg-white border border-[#E5EAF0] rounded-xl p-5 animate-pulse
            ${className}
          `}
          {...props}
        >
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 rounded-full bg-[#E5EAF0] flex-shrink-0 animate-pulse" />
            <div className="flex-1 space-y-3">
              <div className="h-5 bg-[#E5EAF0] rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-[#E5EAF0] rounded w-1/2 animate-pulse" />
              <div className="flex gap-2">
                <div className="h-5 bg-[#E5EAF0] rounded-full w-20 animate-pulse" />
                <div className="h-5 bg-[#E5EAF0] rounded-full w-20 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Text variant - multiple lines
    if (lines && lines > 1) {
      return (
        <div
          ref={ref}
          className={className}
          {...props}
        >
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={`
                h-4 bg-[#E5EAF0] rounded animate-pulse mb-2
                ${i === lines - 1 ? 'w-3/4' : 'w-full'}
              `}
              style={{ width: i === lines - 1 ? width ? `${width}px` : '75%' : '100%' }}
            />
          ))}
        </div>
      );
    }

    // Single line text
    return (
      <div
        ref={ref}
        className={`
          h-4 bg-[#E5EAF0] rounded animate-pulse
          ${className}
        `}
        style={baseStyle}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

// Pre-built skeleton components for common patterns
export const ProfessionalCardSkeleton = () => (
  <Skeleton variant="card" />
);

export const ProfessionalListSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
    {Array.from({ length: count }).map((_, i) => (
      <ProfessionalCardSkeleton key={i} />
    ))}
  </div>
);

export const DashboardStatSkeleton = () => (
  <Skeleton variant="rectangular" className="rounded-xl bg-white border border-[#E5EAF0] p-6" style={{ minHeight: 100 }} />
);

export const DashboardStatsSkeleton = () => (
  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
    {Array.from({ length: 4 }).map((_, i) => (
      <DashboardStatSkeleton key={i} />
    ))}
  </div>
);

export const AppointmentRowSkeleton = () => (
  <Skeleton variant="rectangular" className="rounded-xl bg-white border border-[#E5EAF0] p-5" style={{ minHeight: 120 }} />
);

export const NotificationItemSkeleton = () => (
  <Skeleton variant="rectangular" className="rounded-lg bg-white border border-[#E5EAF0] p-4" style={{ minHeight: 80 }} />
);

export const TableRowSkeleton = ({ columns = 5 }: { columns?: number }) => (
  <tr>
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <Skeleton variant="text" width={100} />
      </td>
    ))}
  </tr>
);