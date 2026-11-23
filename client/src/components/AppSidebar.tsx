"use client";

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui';

interface SidebarConfig {
  items: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    href?: string;
    badge?: string | number;
    badgeVariant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
    onClick?: () => void;
    disabled?: boolean;
  }>;
  userInfo?: {
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  footer?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'danger';
  };
}

interface AppSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  config: SidebarConfig;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  className?: string;
}

const defaultIcons = {
  dashboard: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h11.25A2.25 2.25 0 0116.5 5.25V16.5m-13-13h2.25A2.25 2.25 0 016 5.25V16.5m13-13H15a2.25 2.25 0 00-2.25 2.25V16.5M3.75 16.5h11.25A2.25 2.25 0 0016.5 18.75v-2.25M3.75 16.5H15a2.25 2.25 0 012.25-2.25V5.25M6 12a2.25 2.25 0 114.5 0 2.25 2.25 0 01-4.5 0zM18 12a2.25 2.25 0 114.5 0 2.25 2.25 0 01-4.5 0z" /></svg>,
  enquiries: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>,
  appointments: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>,
  profile: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>,
  wallet: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 10.5a3 3 0 11-6 0 3 3 0 016 0zM3.75 21A4.5 4.5 0 007.5 16.5H12m-12 0h9a3 3 0 000-6h-3.75a3 3 0 000-6h.25a4.5 4.5 0 018.042 1.029 3 3 0 012.956 3.971M18 16.5a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  payout: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182L15 6m-3 2.818l-.879.659c-1.171.879-3.07.879-4.242 0-1.172-.879-1.172-2.303 0-3.182L9 6m4.5 9l3-3m0 0l-3-3m3 3H9" /></svg>,
  verifications: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
  users: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>,
  reports: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h11.25A2.25 2.25 0 0116.5 5.25V16.5m-13-13h2.25A2.25 2.25 0 016 5.25V16.5m13-13H15a2.25 2.25 0 00-2.25 2.25V16.5M6 12a2.25 2.25 0 114.5 0 2.25 2.25 0 01-4.5 0zM18 12a2.25 2.25 0 114.5 0 2.25 2.25 0 01-4.5 0z" /></svg>,
  configuration: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  revenue: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182L15 6m-3 2.818l-.879.659c-1.171.879-3.07.879-4.242 0-1.172-.879-1.172-2.303 0-3.182L9 6m4.5 9l3-3m0 0l-3-3m3 3H9" /></svg>,
  guide: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18.95 7.5 18.95s3.332-.473 4.5-1.253v-13z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  logout: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>,
} as const;

function getDefaultIcon(key: string) {
  return defaultIcons[key as keyof typeof defaultIcons] || defaultIcons.dashboard;
}

export function AppSidebar({
  activeSection,
  onSectionChange,
  config,
  mobileOpen,
  onMobileClose,
  className = '',
}: AppSidebarProps) {
  const { logout } = useAuth();

  const handleClick = (item: SidebarConfig['items'][0]) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.href) {
      // Navigation handled by Link
    } else {
      onSectionChange(item.id);
    }
    if (onMobileClose) onMobileClose();
  };

  const handleLogout = () => {
    logout();
    if (onMobileClose) onMobileClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          w-64 bg-[#1B2A4A] min-h-screen border-r border-[#2D3E5F] flex flex-col flex-shrink-0
          fixed md:relative z-50 transition-transform duration-200
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${className}
        `}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo/Header */}
        <div className="p-6 border-b border-[#2D3E5F]">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-[#00A6A6] rounded-lg flex items-center justify-center text-white font-bold text-sm">
              A
            </div>
            <h1 className="text-xl font-bold text-white">AdvisoryConnect</h1>
          </div>
          <p className="text-xs text-[#94A3B8]">{config.userInfo?.role || 'Panel'}</p>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto" aria-label="Main menu">
          {config.items.map((item) => (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              disabled={item.disabled}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left text-sm font-medium
                ${activeSection === item.id
                  ? 'bg-[#00A6A6] text-white shadow-lg'
                  : 'text-[#94A3B8] hover:bg-[#2D3E5F] hover:text-white'
                }
                ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              aria-current={activeSection === item.id ? 'page' : undefined}
            >
              <span className="text-lg flex-shrink-0">{item.icon || getDefaultIcon(item.id)}</span>
              <span className="truncate">{item.label}</span>
              {item.badge !== undefined && (
                <Badge variant={item.badgeVariant || 'default'} size="sm" className="ml-auto">
                  {item.badge}
                </Badge>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#2D3E5F]">
          {config.userInfo && (
            <div className="mb-3 px-2">
              <p className="text-xs text-[#94A3B8] truncate">{config.userInfo.email}</p>
            </div>
          )}
          {config.footer ? (
            <button
              onClick={config.footer.onClick}
              className={`
                w-full text-left text-xs font-medium transition-colors py-2
                ${config.footer.variant === 'danger'
                  ? 'text-[#EF4444] hover:text-white hover:bg-[#EF4444]/10'
                  : 'text-[#94A3B8] hover:text-white'
                }
              `}
            >
              {config.footer.label}
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full text-left text-xs text-[#94A3B8] hover:text-white transition-colors py-2"
            >
              ← Logout
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// Pre-configured sidebar configs for each role
export const sidebarConfigs = {
  client: (activeSection: string, onSectionChange: (section: string) => void, user: { name: string; email: string }) => ({
    activeSection,
    onSectionChange: onSectionChange as (section: string) => void,
    config: {
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: defaultIcons.dashboard, badge: 0 },
        { id: 'enquiries', label: 'My Enquiries', icon: defaultIcons.enquiries },
        { id: 'appointments', label: 'Appointments', icon: defaultIcons.appointments },
        { id: 'profile', label: 'Profile', icon: defaultIcons.profile },
      ],
      userInfo: { name: user.name, email: user.email, role: 'Client' },
    },
  }),

  professional: (activeSection: string, onSectionChange: (section: "dashboard" | "enquiries" | "appointments" | "profile" | "wallet" | "payout") => void, user: { name: string; email: string }) => ({
    activeSection,
    onSectionChange: onSectionChange as (section: string) => void,
    config: {
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: defaultIcons.dashboard },
        { id: 'enquiries', label: 'Enquiries', icon: defaultIcons.enquiries },
        { id: 'appointments', label: 'Appointments', icon: defaultIcons.appointments },
        { id: 'profile', label: 'Profile', icon: defaultIcons.profile },
        { id: 'wallet', label: 'Wallet', icon: defaultIcons.wallet },
        { id: 'payout', label: 'Payout', icon: defaultIcons.payout },
      ],
      userInfo: { name: user.name, email: user.email, role: 'Professional' },
    },
  }),

  admin: (activeSection: string, onSectionChange: (section: string) => void, user: { name: string; email: string }) => ({
    activeSection,
    onSectionChange: onSectionChange as (section: string) => void,
    config: {
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: defaultIcons.dashboard },
        { id: 'verifications', label: 'Verifications', icon: defaultIcons.verifications },
        { id: 'users', label: 'Users', icon: defaultIcons.users },
        { id: 'reports', label: 'Reports', icon: defaultIcons.reports },
        { id: 'configuration', label: 'Configuration', icon: defaultIcons.configuration },
        { id: 'payouts', label: 'Payouts', icon: defaultIcons.payout },
        { id: 'revenue', label: 'Revenue', icon: defaultIcons.revenue },
        { id: 'guide', label: 'Platform Guide', icon: defaultIcons.guide },
      ],
      userInfo: { name: user.name, email: user.email, role: 'Admin' },
      footer: { label: '← Back to Dashboard', onClick: () => onSectionChange('dashboard') },
    },
  }),
};