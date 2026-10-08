import Image from 'next/image';
import Link from 'next/link';

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  caption?: string;
}

interface BlogPostPreview {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt?: string;
  coverImage?: string;
  media?: MediaItem[];
  imageCount?: number;
  videoCount?: number;
  imageUrls?: string[];
  videoUrls?: string[];
}

interface BlogCardProps {
  post: BlogPostPreview;
}

function formatDate(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getCoverImage(post: BlogPostPreview): string | null {
  if (post.coverImage) return post.coverImage;
  if (post.imageUrls && post.imageUrls.length > 0) return post.imageUrls[0];
  if (post.videoUrls && post.videoUrls.length > 0) return post.videoUrls[0];
  return null;
}

export default function BlogCard({ post }: BlogCardProps) {
  const coverImage = getCoverImage(post);
  const hasMedia = post.media && post.media.length > 0;
  const imageCount = post.imageCount ?? (post.media?.filter((m: MediaItem) => m.type === 'image').length ?? 0);
  const videoCount = post.videoCount ?? (post.media?.filter((m: MediaItem) => m.type === 'video').length ?? 0);

  return (
    <article className="group flex flex-col h-full bg-white rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="relative overflow-hidden bg-[#EEF2F7] aspect-[16/10] min-h-[160px]">
        {coverImage ? (
          <Link href={`/blog/${post.slug}`} className="block w-full h-full">
            <Image
              src={coverImage}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
        ) : hasMedia && post.media?.[0]?.type === 'video' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-secondary/80 to-primary/60 text-white">
            <svg className="w-12 h-12 mb-2 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium">Video</span>
            <span className="text-xs opacity-75">{post.category}</span>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-secondary/20 to-primary/10 text-5xl">
            <span className="text-muted">No cover</span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className="badge badge-neutral text-[11px]">{post.category}</span>
        </div>
        {imageCount > 0 && (
          <span className="absolute bottom-3 left-3 bg-white/90 text-primary text-[10px] font-semibold px-2 py-1 rounded-full">
            {imageCount} photos
          </span>
        )}
        {videoCount > 0 && (
          <span className="absolute bottom-3 right-3 bg-black/70 text-white text-[10px] font-semibold px-2 py-1 rounded-full">
            {videoCount} video{videoCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h2 className="text-lg font-bold text-primary leading-snug hover:text-secondary transition-colors line-clamp-2">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h2>
        <p className="text-sm text-muted mt-2 line-clamp-2">{post.excerpt}</p>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <span className="text-xs text-muted">{formatDate(post.publishedAt)}</span>
          <Link
            href={`/blog/${post.slug}`}
            className="text-sm font-semibold text-secondary hover:text-secondary-hover transition-colors"
          >
            Read more
            <svg className="inline ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
