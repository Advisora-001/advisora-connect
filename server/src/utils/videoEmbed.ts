import { MediaItem } from '../models/BlogPost';

export type VideoProvider = 'youtube' | 'vimeo' | 'facebook' | 'instagram' | 'tiktok' | 'x';

export interface ParsedVideo {
  provider: VideoProvider;
  embedId: string;
  url: string;
}

const ALLOWED_HOSTS: Record<VideoProvider, string[]> = {
  youtube: ['youtube.com', 'youtu.be', 'www.youtube.com', 'm.youtube.com'],
  vimeo: ['vimeo.com'],
  facebook: ['facebook.com'],
  instagram: ['instagram.com'],
  tiktok: ['tiktok.com'],
  x: ['x.com', 'twitter.com'],
};

function normalize(host: string, lower: string): string {
  return host.replace(/^www\./, '').replace(/^m\./, '');
}

function extractIdFromYoutube(url: string): { id: string; provider: VideoProvider } | null {
  const watch = /youtu\.be\/([^\s?/]+)/.exec(url);
  if (watch && watch[1]) return { id: watch[1].split(/[?&]/)[0], provider: 'youtube' };

  const v = /youtube\.com\/watch\?v=([^&\s]+)/.exec(url);
  if (v && v[1]) return { id: v[1].split(/[?&]/)[0], provider: 'youtube' };

  const shorts = /youtube\.com\/shorts\/([^\s?/]+)/.exec(url);
  if (shorts && shorts[1]) return { id: shorts[1].split(/[?&]/)[0], provider: 'youtube' };

  const embed = /youtube\.com\/embed\/([^\s?/]+)/.exec(url);
  if (embed && embed[1]) return { id: embed[1].split(/[?&]/)[0], provider: 'youtube' };

  const live = /youtube\.com\/live\/([^\s?/]+)/.exec(url);
  if (live && live[1]) return { id: live[1].split(/[?&]/)[0], provider: 'youtube' };

  return null;
}

function extractIdFromVimeo(url: string): string | null {
  const match = /vimeo\.com\/(?:video\/)?([0-9]+)/.exec(url);
  return match?.[1] ?? null;
}

function extractIdFromFacebook(url: string): string | null {
  const video = /facebook\.com\/(?:(?:video|consumer)?\/)?video\.php\?v=(\d+)/.exec(url);
  if (video?.[1]) return video[1];

  const reel = /facebook\.com\/(?:(?:\w+\/)?(?:reel|photos|profile))\/([a-zA-Z0-9._-]+)/.exec(url);
  if (reel?.[1]) return reel[1];

  const fbwatch = /fb\.watch\/([a-zA-Z0-9_-]+)/.exec(url);
  if (fbwatch?.[1]) return fbwatch[1];

  const generic = /facebook\.com\/[a-zA-Z0-9._-]+\/videos\/([0-9]+)/.exec(url);
  return generic?.[1] ?? null;
}

function extractIdFromInstagram(url: string): string | null {
  const p = /instagram\.com\/p\/([a-zA-Z0-9_-]+)/.exec(url);
  if (p?.[1]) return p[1];

  const reel = /instagram\.com\/reel\/([a-zA-Z0-9_-]+)/.exec(url);
  if (reel?.[1]) return reel[1];

  const tv = /instagram\.com\/tv\/([a-zA-Z0-9_-]+)/.exec(url);
  if (tv?.[1]) return tv[1];

  return null;
}

function extractIdFromTiktok(url: string): string | null {
  const match = /tiktok\.com\/@[\w.-]+\/video\/(\d+)/.exec(url);
  return match?.[1] ?? null;
}

function extractIdFromX(url: string): string | null {
  const status = /x\.com\/@?[\w.]+\/status\/(\d+)/.exec(url);
  if (status?.[1]) return status[1];

  const status2 = /twitter\.com\/@?[\w.]+\/status\/(\d+)/.exec(url);
  if (status2?.[1]) return status2[1];

  return null;
}

export function parseVideoUrl(rawUrl: string): ParsedVideo | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;

  const trimmed = rawUrl.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;

  const url = new URL(trimmed);
  const host = normalize(url.hostname, url.hostname.toLowerCase());

  if (host === 'youtube.com' || host === 'youtu.be' || host === 'm.youtube.com') {
    const result = extractIdFromYoutube(trimmed);
    if (result) return { provider: 'youtube', embedId: result.id, url: trimmed };
  }

  if (host === 'vimeo.com') {
    const id = extractIdFromVimeo(trimmed);
    if (id) return { provider: 'vimeo', embedId: id, url: trimmed };
  }

  if (host === 'facebook.com') {
    const id = extractIdFromFacebook(trimmed);
    if (id) return { provider: 'facebook', embedId: id, url: trimmed };
  }

  if (host === 'instagram.com') {
    const id = extractIdFromInstagram(trimmed);
    if (id) return { provider: 'instagram', embedId: id, url: trimmed };
  }

  if (host === 'tiktok.com') {
    const id = extractIdFromTiktok(trimmed);
    if (id) return { provider: 'tiktok', embedId: id, url: trimmed };
  }

  if (host === 'x.com' || host === 'twitter.com') {
    const id = extractIdFromX(trimmed);
    if (id) return { provider: 'x', embedId: id, url: trimmed };
  }

  return null;
}

export function buildVideoUrl(media: MediaItem): string {
  const embedId = media.embedId ?? '';

  if (media.provider === 'youtube') {
    return `https://www.youtube.com/watch?v=${embedId}`;
  }
  if (media.provider === 'vimeo') {
    return `https://vimeo.com/${embedId}`;
  }
  if (media.provider === 'facebook') {
    if (embedId.startsWith('video.php?v=')) {
      return media.url;
    }
    return `https://www.facebook.com/${embedId}`;
  }
  if (media.provider === 'instagram') {
    return `https://www.instagram.com/p/${embedId}`;
  }
  if (media.provider === 'tiktok') {
    return `https://www.tiktok.com/@unknown/video/${embedId}`;
  }
  if (media.provider === 'x') {
    return `https://x.com/unknown/status/${embedId}`;
  }
  return media.url;
}

export function isAllowedProvider(provider: string | undefined): provider is VideoProvider {
  return Boolean(provider && ALLOWED_HOSTS[provider as VideoProvider].length > 0);
}
