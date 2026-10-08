import Image from 'next/image';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import api from '@/lib/api';
import MediaGallery from '@/components/blog/MediaGallery';

interface Params {
  slug: string;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await api.getBlogPost(slug);

  if (!post) {
    return { title: 'Post not found — Advisora Connect' };
  }

  return {
    title: `${post.title} — Advisora Connect`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [post.coverImage] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = await api.getBlogPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <div>
      {/* Hero with cover image */}
      {post.coverImage && (
        <div className="relative h-[420px] md:h-[520px] overflow-hidden">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1B2A4A]/80 via-transparent to-transparent" />
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-10 md:py-16">
        <div className="text-center">
          <p className="text-secondary text-sm font-semibold uppercase tracking-widest">
            {post.category}
          </p>
          <h1 className="text-3xl md:text-5xl font-bold text-primary mt-3 leading-tight">
            {post.title}
          </h1>
          <p className="text-muted mt-4 text-lg">
            {post.author?.firstName || 'Advisora'} &middot; {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
          </p>
        </div>

        <div
          className="mt-8 text-[#475569] leading-relaxed whitespace-pre-wrap"
        >
          {post.content}
        </div>

        {post.author && post.author.firstName && (
          <p className="mt-8 text-center text-sm text-muted">
            Written by{' '}
            <span className="font-semibold text-secondary">
              {post.author.firstName} {post.author.lastName}
            </span>
          </p>
        )}

        {/* Media gallery */}
        {post.media && post.media.length > 0 && (
          <MediaGallery
            images={post.imageUrls || []}
            videos={post.media.filter((m: { type: string }) => m.type === 'video')}
            caption={post.coverImage ? `${post.title} cover image` : undefined}
          />
        )}
      </div>
    </div>
  );
}
