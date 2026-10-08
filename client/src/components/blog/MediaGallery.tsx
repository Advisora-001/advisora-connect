"use client";

import Image from 'next/image';
import { useEffect, useState } from 'react';
import Lightbox from './Lightbox';
import VideoEmbed from './VideoEmbed';

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  caption?: string;
  provider?: string;
  embedId?: string;
}

interface MediaGalleryProps {
  images: string[];
  videos: MediaItem[];
  caption?: string;
}

export default function MediaGallery({ images, videos, caption }: MediaGalleryProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleOpenLightbox = (e: Event) => {
      const detail = (e as CustomEvent).detail as { url: string; index: number; caption?: string };
      setSelectedIndex(detail.index);
      setIsLightboxOpen(true);
    };

    const handleNavigate = (e: Event) => {
      const next = (e as CustomEvent).detail as number;
      setSelectedIndex(next);
    };

    window.addEventListener('blog-open-lightbox', handleOpenLightbox);
    window.addEventListener('blog-lightbox-navigate', handleNavigate);
    return () => {
      window.removeEventListener('blog-open-lightbox', handleOpenLightbox);
      window.removeEventListener('blog-lightbox-navigate', handleNavigate);
    };
  }, []);

  if (images.length === 0 && videos.length === 0) {
    return null;
  }

  return (
    <div className="mt-10">
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((url, i) => (
            <button
              key={i}
              onClick={() => {
                setSelectedIndex(i);
                setIsLightboxOpen(true);
              }}
              className="group relative aspect-video rounded-lg overflow-hidden border border-border focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"
            >
              <Image
                src={url}
                alt={caption || `Media ${i + 1}`}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      )}

      {videos.length > 0 && (
        <div className="mt-8 space-y-4">
          {videos.map((video, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-border">
              <VideoEmbed provider={video.provider || ''} embedId={video.embedId || ''} url={video.url} />
            </div>
          ))}
        </div>
      )}

      <Lightbox
        images={images}
        currentIndex={selectedIndex}
        caption={caption}
        onClose={() => setIsLightboxOpen(false)}
      />
    </div>
  );
}

