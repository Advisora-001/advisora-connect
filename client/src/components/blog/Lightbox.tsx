"use client";

import React, { useEffect, useState } from 'react';

interface LightboxProps {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  caption?: string;
}

export default function Lightbox({ images, currentIndex, onClose, caption }: LightboxProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && images.length > 1) {
        const next = (currentIndex + 1) % images.length;
        window.dispatchEvent(new CustomEvent('blog-lightbox-navigate', { detail: next }));
      } else if (e.key === 'ArrowLeft' && images.length > 1) {
        const prev = (currentIndex - 1 + images.length) % images.length;
        window.dispatchEvent(new CustomEvent('blog-lightbox-navigate', { detail: prev }));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, currentIndex, images.length, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={caption || 'Image lightbox'}
    >
      <>
        <button
          className="absolute top-4 left-4 w-10 h-10 flex items-center justify-center bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          onClick={onClose}
          aria-label="Close lightbox"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <button
          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          onClick={() => {
            if (images.length > 1) {
              const prev = (currentIndex - 1 + images.length) % images.length;
              window.dispatchEvent(new CustomEvent('blog-lightbox-navigate', { detail: prev }));
            }
          }}
          aria-label="Previous image"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          onClick={() => {
            if (images.length > 1) {
              const next = (currentIndex + 1) % images.length;
              window.dispatchEvent(new CustomEvent('blog-lightbox-navigate', { detail: next }));
            }
          }}
          aria-label="Next image"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <img
          src={images[currentIndex]}
          alt={caption || ''}
          className="max-w-full max-h-full object-contain"
        />

        {caption && (
          <p className="absolute bottom-6 left-6 text-white text-sm max-w-md px-4 py-2 rounded-lg bg-black/50">
            {caption}
          </p>
        )}
      </>
    </div>
  );
}
