import { Response } from 'express';
import BlogPost, { IBlogPost, MediaItem } from '../models/BlogPost';
import { parseVideoUrl } from '../utils/videoEmbed';

interface MediaPayload {
  type: 'image' | 'video';
  url: string;
  publicId?: string;
  provider?: string;
  embedId?: string;
  caption?: string;
}

const serializePost = (post: IBlogPost) => ({
  ...post.toJSON(),
  coverImage: post.coverImage ?? null,
  media: post.media || [],
  imageUrls: (post.media || []).filter((m: MediaItem) => m.type === 'image').map((m: MediaItem) => m.url),
  videoUrls: (post.media || []).filter((m: MediaItem) => m.type === 'video').map((m: MediaItem) => m.url),
  imagePublicIds: (post.media || []).filter((m: MediaItem) => m.type === 'image').map((m: MediaItem) => m.publicId),
  videoProviders: (post.media || []).filter((m: MediaItem) => m.type === 'video').map((m: MediaItem) => m.provider),
  videoEmbedIds: (post.media || []).filter((m: MediaItem) => m.type === 'video').map((m: MediaItem) => m.embedId),
  imageCount: (post.media || []).filter((m: MediaItem) => m.type === 'image').length,
  videoCount: (post.media || []).filter((m: MediaItem) => m.type === 'video').length,
  mediaCount: post.media?.length || 0,
  featuredImage: post.coverImage,
});

const getPublishedPosts = async (req: any, res: Response) => {
  try {
    const { category, page = 1, limit = 6 } = req.query;
    const pageNum = typeof page === 'string' ? Math.max(1, parseInt(page, 10)) : 1;
    const requestedLimit = typeof limit === 'string' ? parseInt(limit, 10) : 6;
    const limitNum = Math.min(50, Math.max(1, Number.isFinite(requestedLimit) ? requestedLimit : 6));
    const skip = (pageNum - 1) * limitNum;

    const query: any = { isPublished: true };
    if (category && typeof category === 'string' && category.trim()) {
      query.category = new RegExp(`^${category.trim()}$`, 'i');
    }

    const [posts, total] = await Promise.all([
      BlogPost.find(query)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select('title slug excerpt category publishedAt coverImage media'),
      BlogPost.countDocuments(query),
    ]);

    const serialized = posts.map((post) => serializePost(post as IBlogPost));

    res.json({
      count: serialized.length,
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum) || 1,
      posts: serialized,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getPostBySlug = async (req: any, res: Response) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug, isPublished: true })
      .populate('author', 'firstName lastName avatar role')
      .select('+author');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    return res.json(serializePost(post as IBlogPost));
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const getAllPosts = async (req: any, res: Response) => {
  try {
    const posts = await BlogPost.find().sort({ publishedAt: -1, createdAt: -1 });
    res.json({
      count: posts.length,
      posts: posts.map((post) => serializePost(post as IBlogPost)),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createPost = async (req: any, res: Response) => {
  try {
    const { title, excerpt, content, category, coverImage, media, isPublished } = req.body || {};

    if (!title || !excerpt || !content || !category) {
      return res.status(400).json({ message: 'Title, excerpt, content and category are required' });
    }

    const slugBase = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'post';
    const slug = `${slugBase}-${Date.now()}`;

    const resolvedMedia: MediaItem[] = Array.isArray(media)
      ? media
          .filter((item): item is MediaPayload => Boolean(item && typeof item === 'object' && typeof item.url === 'string'))
          .map((item) => {
            const parsed = parseVideoUrl(item.url);
            return {
              type: 'video',
              url: item.url,
              publicId: item.publicId,
              provider: parsed ? parsed.provider : item.provider,
              embedId: parsed ? parsed.embedId : item.embedId,
              caption: item.caption,
            } as MediaItem;
          })
      : [];

    const post = await BlogPost.create({
      title: title.trim(),
      slug,
      excerpt: excerpt.trim(),
      content: content.trim(),
      category: category.trim(),
      coverImage: coverImage || null,
      media: resolvedMedia,
      isPublished: isPublished ?? false,
      author: req.user?._id,
    });

    return res.status(201).json(serializePost(post as IBlogPost));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create post' });
  }
};

const updatePost = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const post = await BlogPost.findById(id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const { title, excerpt, content, category, coverImage, media, isPublished } = req.body || {};

    if (title && typeof title === 'string') post.title = title.trim();
    if (excerpt && typeof excerpt === 'string') post.excerpt = excerpt.trim();
    if (content && typeof content === 'string') post.content = content.trim();
    if (category && typeof category === 'string') post.category = category.trim();
    if (typeof coverImage === 'string') post.coverImage = coverImage;
    if (typeof isPublished === 'boolean') {
      post.isPublished = isPublished;
      if (post.isPublished && !post.publishedAt) post.publishedAt = new Date();
      if (!post.isPublished) post.publishedAt = undefined;
    }

    if (Array.isArray(media)) {
      post.media = media
        .filter((item): item is MediaPayload => Boolean(item && typeof item === 'object' && typeof item.url === 'string'))
        .map((item) => {
          const parsed = parseVideoUrl(item.url);
          return {
            type: item.type || 'image',
            url: item.url,
            publicId: item.publicId,
            provider: parsed ? parsed.provider : item.provider,
            embedId: parsed ? parsed.embedId : item.embedId,
            caption: item.caption,
          } as MediaItem;
        });
    }

    if (post.title && post.slug === undefined) {
      post.slug = `${post.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now()}`;
    }

    await post.save();
    return res.json(serializePost(post as IBlogPost));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update post' });
  }
};

const deletePost = async (req: any, res: Response) => {
  try {
    const post = await BlogPost.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    return res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete post' });
  }
};

export { getPublishedPosts, getPostBySlug, getAllPosts, createPost, updatePost, deletePost };
