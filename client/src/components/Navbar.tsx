"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
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
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/advisora.png"
              alt="Advisora Connect"
              width={140}
              height={35}
              className="object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/lawyers" className="text-gray-700 hover:text-[#1B2A4A] font-medium transition-colors">
              Find Lawyers
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-[#1B2A4A] font-medium transition-colors">
              About Us
            </Link>

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-9 h-9 rounded-full overflow-hidden bg-[#1B2A4A] flex items-center justify-center text-white text-sm font-semibold border-2 border-transparent hover:border-[#C5A55A] transition-all focus:outline-none"
                >
                  {userPhoto ? (
                    <img
                      src={userPhoto}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>
                      {user.firstName[0]}
                      {user.lastName[0]}
                    </span>
                  )}
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 animate-fadeIn">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-[#1B2A4A] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                          {userPhoto ? (
                            <img
                              src={userPhoto}
                              alt={`${user.firstName} ${user.lastName}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>
                              {user.firstName[0]}
                              {user.lastName[0]}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-accent text-sm truncate">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          <p className="text-xs text-[#C5A55A] capitalize mt-0.5 font-medium">{user.role}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <Link
                      href={dashboardPath}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-primary/5 hover:text-accent transition-colors"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                      }}
                      className="flex items-center w-full px-4 py-2.5 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-[#1B2A4A] font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-[#1B2A4A] text-white px-5 py-2 rounded-lg hover:bg-[#2a3f6a] transition-colors font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-700"
          >
            {isMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 space-y-3">
            <Link href="/lawyers" className="block text-gray-700 hover:text-[#1B2A4A] py-2" onClick={() => setIsMenuOpen(false)}>
              Find Lawyers
            </Link>
            <Link href="/about" className="block text-gray-700 hover:text-[#1B2A4A] py-2" onClick={() => setIsMenuOpen(false)}>
              About Us
            </Link>
            {user ? (
              <>
                <Link href={dashboardPath} className="block text-gray-700 hover:text-[#1B2A4A] py-2" onClick={() => setIsMenuOpen(false)}>
                  Dashboard
                </Link>
                <button onClick={() => { logout(); setIsMenuOpen(false); }} className="text-gray-500 hover:text-red-600 py-2">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block text-gray-700 hover:text-[#1B2A4A] py-2" onClick={() => setIsMenuOpen(false)}>
                  Login
                </Link>
                <Link href="/register" className="block bg-[#1B2A4A] text-white text-center px-5 py-2 rounded-lg" onClick={() => setIsMenuOpen(false)}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}