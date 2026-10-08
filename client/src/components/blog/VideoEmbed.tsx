"use client";

import React from 'react';

interface VideoEmbedProps {
  provider: string;
  embedId: string;
  url: string;
}

export default function VideoEmbed({ provider, embedId, url }: VideoEmbedProps) {
  let src: string;
  let className = 'aspect-video';
  let title = '';

  switch (provider) {
    case 'youtube':
      src = `https://www.youtube-nocookie.com/embed/${embedId}`;
      title = 'YouTube video';
      break;
    case 'vimeo':
      src = `https://player.vimeo.com/video/${embedId}`;
      title = 'Vimeo video';
      break;
    case 'facebook':
      src = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`;
      title = 'Facebook video';
      break;
    case 'instagram':
      src = `https://www.instagram.com/p/${embedId}/embed`;
      className = 'aspect-[4/5] max-w-xs';
      title = 'Instagram video';
      break;
    case 'tiktok':
      src = `https://www.tiktok.com/embed/v2/${embedId}`;
      className = 'aspect-[4/5] max-w-xs';
      title = 'TikTok video';
      break;
    case 'x':
      src = `https://platform.twitter.com/embed/Tweet.html?id=${embedId}&related=&theme=light`;
      title = 'X video';
      break;
    default:
      return (
        <div className="rounded-xl overflow-hidden bg-black border border-border">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center text-sm text-muted hover:text-primary transition-colors"
          >
            Open video directly
          </a>
        </div>
      );
  }

  return (
    <div className={`relative rounded-xl overflow-hidden bg-black border border-border ${className}`}>
      <iframe
        src={src}
        title={title}
        className="w-full h-full"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
