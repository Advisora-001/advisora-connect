"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    api.getNotifications().then(data => {
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dashboardPath =
    user?.role === 'lawyer'
      ? '/dashboard/lawyer'
      : user?.role === 'admin'
      ? '/admin'
      : '/dashboard/client';

  const userPhoto = profile?.photo || user?.avatar;

  return (
    <nav className="bg-white border-b border-[#E5EAF0] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <Image
              src="/advisora.png"
              alt="Advisora Connect"
              width={140}
              height={35}
              className="object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link href="/lawyers" className="px-4 py-2 text-[#475569] hover:text-[#1B2A4A] font-medium text-sm transition-colors rounded-lg hover:bg-[#EEF2F7]">
              Find Lawyers
            </Link>
            <Link href="/about" className="px-4 py-2 text-[#475569] hover:text-[#1B2A4A] font-medium text-sm transition-colors rounded-lg hover:bg-[#EEF2F7]">
              About Us
            </Link>

            {user ? (
              <div className="flex items-center space-x-1 ml-2">
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => { setNotifOpen(!notifOpen); setDropdownOpen(false); }}
                    className="relative p-2 text-[#667085] hover:text-[#1B2A4A] hover:bg-[#EEF2F7] rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 bg-[#EF4444] text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-lg border border-[#E5EAF0] z-50 max-h-96 overflow-y-auto animate-fadeIn">
                      <div className="p-4 border-b border-[#E5EAF0] flex justify-between items-center">
                        <p className="font-semibold text-[#1B2A4A] text-sm">Notifications</p>
                        {notifications.length > 0 && (
                          <button onClick={async () => { await api.markNotificationsRead(); setUnreadCount(0); }}
                            className="text-xs text-[#00A6A6] hover:underline font-medium">Mark all read</button>
                        )}
                      </div>
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-[#667085] text-sm">No notifications yet</div>
                      ) : (
                        notifications.slice(0, 10).map((n: any) => (
                          <div key={n._id} className={`px-4 py-3 border-b border-[#F0F2F5] hover:bg-[#F5F7FA] cursor-pointer ${!n.read ? 'bg-[#EFF6FF]' : ''}`}>
                            <p className="text-sm font-medium text-[#1B2A4A]">{n.title}</p>
                            <p className="text-xs text-[#667085] mt-0.5">{n.message}</p>
                            <p className="text-xs text-[#94A3B8] mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => { setDropdownOpen(!dropdownOpen); setNotifOpen(false); }}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#EEF2F7] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-[#1B2A4A] flex items-center justify-center text-white text-xs font-semibold">
                      {userPhoto ? (
                        <img src={userPhoto} alt={`${user.firstName} ${user.lastName}`} className="w-full h-full object-cover" />
                      ) : (
                        <span>{user.firstName[0]}{user.lastName[0]}</span>
                      )}
                    </div>
                    <svg className="w-4 h-4 text-[#667085]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-lg border border-[#E5EAF0] py-2 z-50 animate-fadeIn">
                      <div className="px-4 py-3 border-b border-[#E5EAF0]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-[#1B2A4A] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                            {userPhoto ? (
                              <img src={userPhoto} alt={`${user.firstName} ${user.lastName}`} className="w-full h-full object-cover" />
                            ) : (
                              <span>{user.firstName[0]}{user.lastName[0]}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#1B2A4A] text-sm truncate">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-[#667085] truncate">{user.email}</p>
                            <p className="text-xs text-[#00A6A6] capitalize mt-0.5 font-medium">{user.role}</p>
                          </div>
                        </div>
                      </div>
                      <Link href={dashboardPath} onClick={() => setDropdownOpen(false)}
                        className="flex items-center px-4 py-2.5 text-[#475569] hover:bg-[#EEF2F7] hover:text-[#1B2A4A] transition-colors text-sm">
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                        </svg>
                        Dashboard
                      </Link>
                      <button onClick={() => { setDropdownOpen(false); logout(); }}
                        className="flex items-center w-full px-4 py-2.5 text-[#475569] hover:bg-[#FEF2F2] hover:text-[#EF4444] transition-colors text-sm">
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3 ml-2">
                <Link href="/login" className="px-4 py-2 text-[#475569] hover:text-[#1B2A4A] font-medium text-sm transition-colors rounded-lg hover:bg-[#EEF2F7]">
                  Login
                </Link>
                <Link href="/register" className="bg-[#1B2A4A] text-white px-5 py-2.5 rounded-lg hover:bg-[#16213A] transition-colors font-semibold text-sm shadow-sm">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-[#475569] hover:text-[#1B2A4A] rounded-lg hover:bg-[#EEF2F7]">
            {isMenuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 space-y-1 animate-fadeIn">
            <Link href="/lawyers" className="block px-4 py-2.5 text-[#475569] hover:text-[#1B2A4A] hover:bg-[#EEF2F7] rounded-lg text-sm font-medium" onClick={() => setIsMenuOpen(false)}>
              Find Lawyers
            </Link>
            <Link href="/about" className="block px-4 py-2.5 text-[#475569] hover:text-[#1B2A4A] hover:bg-[#EEF2F7] rounded-lg text-sm font-medium" onClick={() => setIsMenuOpen(false)}>
              About Us
            </Link>
            {user && (
              <div className="pt-3 mt-3 border-t border-[#E5EAF0]">
                <div className="flex items-center justify-between px-4 py-2">
                  <p className="text-xs font-semibold text-[#667085] uppercase tracking-wide">Notifications</p>
                  {unreadCount > 0 && (
                    <span className="bg-[#EF4444] text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <p className="px-4 pb-2 text-xs text-[#94A3B8]">No notifications</p>
                ) : (
                  <>
                    {notifications.slice(0, 5).map((n: any) => (
                      <div key={n._id} className={`px-4 py-2.5 border-b border-[#F0F2F5] ${!n.read ? 'bg-[#EFF6FF]' : ''}`}>
                        <p className="text-sm font-medium text-[#1B2A4A]">{n.title}</p>
                        <p className="text-xs text-[#667085] mt-0.5">{n.message}</p>
                        <p className="text-xs text-[#94A3B8] mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                    {notifications.length > 0 && (
                      <button onClick={() => api.markNotificationsRead().then(() => setUnreadCount(0)).catch(() => {})}
                        className="block w-full text-left px-4 py-2.5 text-xs text-[#00A6A6] font-medium hover:underline">
                        Mark all as read
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
            {user ? (
              <>
                <Link href={dashboardPath} className="block px-4 py-2.5 text-[#475569] hover:text-[#1B2A4A] hover:bg-[#EEF2F7] rounded-lg text-sm font-medium" onClick={() => setIsMenuOpen(false)}>
                  Dashboard
                </Link>
                <button onClick={() => { logout(); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-2.5 text-[#EF4444] hover:bg-[#FEF2F2] rounded-lg text-sm font-medium">
                  Logout
                </button>
              </>
            ) : (
              <div className="space-y-2 pt-2">
                <Link href="/login" className="block px-4 py-2.5 text-center text-[#475569] hover:text-[#1B2A4A] hover:bg-[#EEF2F7] rounded-lg text-sm font-medium" onClick={() => setIsMenuOpen(false)}>
                  Login
                </Link>
                <Link href="/register" className="block bg-[#1B2A4A] text-white text-center px-5 py-2.5 rounded-lg text-sm font-semibold" onClick={() => setIsMenuOpen(false)}>
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}