"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
              <div className="flex items-center space-x-4">
                <Link
                  href={user.role === 'lawyer' ? '/dashboard/lawyer' : user.role === 'admin' ? '/admin' : '/dashboard/client'}
                  className="text-gray-700 hover:text-[#1B2A4A] font-medium"
                >
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="text-gray-500 hover:text-red-600 font-medium"
                >
                  Logout
                </button>
                <div className="w-8 h-8 bg-[#1B2A4A] rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {user.firstName[0]}{user.lastName[0]}
                </div>
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
                <Link href={user.role === 'lawyer' ? '/dashboard/lawyer' : user.role === 'admin' ? '/admin' : '/dashboard/client'} className="block text-gray-700 hover:text-[#1B2A4A] py-2" onClick={() => setIsMenuOpen(false)}>
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