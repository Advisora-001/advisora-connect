'use client';

import React, { useState, useEffect } from 'react';

const COOKIE_CONSENT_KEY = 'advisora_cookie_consent';

export default function CookieConsent() {
  const [show, setShow] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Delay showing the banner slightly so it doesn't appear during page transition
      const timer = setTimeout(() => setShow(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setAnimatingOut(true);
    setTimeout(() => setShow(false), 300);
  };

  const handleReject = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');
    setAnimatingOut(true);
    setTimeout(() => setShow(false), 300);
  };

  if (!show) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 p-4 transition-all duration-300 ${
        animatingOut ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
      }`}
    >
      <div className="max-w-7xl mx-auto bg-[#1B2A4A] text-white rounded-xl shadow-2xl p-6 border border-[#C5A55A]/20">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex-1">
            <p className="font-semibold text-lg">Cookie Consent</p>
            <p className="text-sm text-gray-300 mt-1">
              We use essential cookies to ensure our platform functions properly. We do not use tracking or advertising cookies. By clicking "Accept All", you consent to the use of essential cookies. You can learn more in our{' '}
              <a href="/privacy-policy" className="text-[#C5A55A] hover:underline font-medium">
                Privacy Policy
              </a>.
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <button
              onClick={handleReject}
              className="px-5 py-2.5 rounded-lg border-2 border-white/30 text-white hover:bg-white/10 font-medium transition-all text-sm"
            >
              Reject All
            </button>
            <button
              onClick={handleAccept}
              className="px-5 py-2.5 rounded-lg bg-[#C5A55A] text-[#1B2A4A] hover:bg-[#d4b36a] font-bold transition-all text-sm"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}