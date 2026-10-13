import Link from 'next/link';
import { Metadata } from 'next';
import api from '@/lib/api';
import BlogCard from '@/components/blog/BlogCard';

export const metadata: Metadata = {
  title: 'Blog — Advisora Connect',
  description: 'Insights, legal tips, and updates from the Advisora team.',
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const category = typeof params?.category === 'string' ? params.category : '';
  const page = parseInt(typeof params?.page === 'string' ? params.page : '1', 10) || 1;
  const limit = 12;

  const { posts, pages, page: currentPage } = await api.getBlogPosts({ category, page, limit });
  const categories = Array.from(new Set(posts.map((p: any) => p.category))).sort();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <section className="bg-[#1B2A4A] text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="text-secondary uppercase tracking-widest text-xs font-semibold mb-2">
                Blog &amp; Updates
              </p>
              <h1 className="text-3xl md:text-5xl font-bold leading-tight">
                {category ? `Category: ${category}` : 'From the Blog'}
              </h1>
              <p className="text-white/70 mt-4 max-w-xl text-lg">
                Insights, legal tips, and updates from the Advisora team.
              </p>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <div className="w-24 h-24 rounded-2xl bg-white/10 flex items-center justify-center">
                <svg className="w-10 h-10 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-2.95.512v14.078a2.997 2.997 0 002.95.512 8.966 8.966 0 008.966 8.967c.189.179.44.273.7.273.26 0 .511-.094.7-.273A8.967 8.967 0 0021 14.25c-1.052 0-2.062.18-2.95.512V3.75c-.888-.332-1.898-.512-2.95-.512a8.967 8.967 0 00-8.966 8.967l-2.09-2.092z" />
                </svg>
              </div>
              <div className="flex -space-x-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-[#1B2A4A] bg-secondary flex items-center justify-center text-white text-sm font-bold">
                    A
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/blog"
              className="px-4 py-2 rounded-full text-sm font-medium bg-white text-[#1B2A4A] hover:bg-[#EEF2F7] transition-colors"
            >
              All
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat}
                href={category === cat ? '/blog?page=1' : `/blog?category=${encodeURIComponent(cat)}&page=1`}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  category === cat
                    ? 'bg-[#1B2A4A] text-white'
                    : 'text-[#475569] hover:bg-[#EEF2F7] hover:text-primary'
                }`}
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {posts.length > 0 ? (
        <section className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post: any) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>

            {pages > 1 && (
              <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
                <a
                  href={currentPage > 1 ? `/blog?page=${currentPage - 1}${category ? `&category=${encodeURIComponent(category)}` : ''}` : '#'}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-border text-[#475569] hover:bg-[#EEF2F7] transition-colors disabled:opacity-40"
                  aria-disabled={currentPage === 1}
                  onClick={(e) => {
                    if (currentPage === 1) e.preventDefault();
                  }}
                >
                  Previous
                </a>
                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                  <a
                    key={p}
                    href={`/blog?page=${p}${category ? `&category=${encodeURIComponent(category)}` : ''}`}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      p === currentPage
                        ? 'bg-[#1B2A4A] text-white'
                        : 'bg-white border border-border text-[#475569] hover:bg-[#EEF2F7]'
                    }`}
                  >
                    {p}
                  </a>
                ))}
                <a
                  href={currentPage < pages ? `/blog?page=${currentPage + 1}${category ? `&category=${encodeURIComponent(category)}` : ''}` : '#'}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-border text-[#475569] hover:bg-[#EEF2F7] transition-colors disabled:opacity-40"
                  aria-disabled={currentPage === pages}
                  onClick={(e) => {
                    if (currentPage === pages) e.preventDefault();
                  }}
                >
                  Next
                </a>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="py-16 md:py-20">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <div className="w-16 h-16 bg-[#EEF2F7] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-2.95.512v14.078a2.997 2.997 0 002.95.512 8.966 8.966 0 008.966 8.967c.189.179.44.273.7.273.26 0 .511-.094.7-.273A8.967 8.967 0 0021 14.25c-1.052 0-2.062.18-2.95.512V3.75c-.888-.332-1.898-.512-2.95-.512a8.967 8.967 0 00-8.966 8.967l-2.09-2.092z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-primary">No posts found</h2>
            <p className="text-muted mt-2">
              {category ? 'There are no posts in this category yet.' : 'We have not published any posts yet.'}
            </p>
            {category && (
              <Link
                href="/blog"
                className="mt-6 inline-block text-sm font-semibold text-secondary hover:text-secondary-hover transition-colors"
              >
                Back to all posts
              </Link>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
