"use client";

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';

interface MediaPayload {
  type: 'image' | 'video';
  url: string;
  publicId?: string;
  provider?: string;
  embedId?: string;
  caption?: string;
}

interface AdminPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  publishedAt?: string;
  isPublished: boolean;
  media?: MediaPayload[];
  coverImage?: string;
  createdAt: string;
  _id: string;
}

interface FileWithPreview extends File {
  preview?: string;
}

export default function BlogManager() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingPost, setEditingPost] = useState<AdminPost | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [images, setImages] = useState<FileWithPreview[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [videoErrors, setVideoErrors] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    coverImage: '',
    media: [] as MediaPayload[],
    isPublished: false,
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      const data = await api.getAllBlogPosts();
      setPosts(data.posts || []);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load posts' });
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({
      title: '',
      excerpt: '',
      content: '',
      category: '',
      coverImage: '',
      media: [],
      isPublished: false,
    });
    setImages([]);
    setVideoUrls([]);
    setVideoErrors([]);
  }

  const openCreate = () => {
    setEditingPost(null);
    resetForm();
    setShowCreate(true);
  };

  const openEdit = (post: AdminPost) => {
    setEditingPost(post);
    setForm({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      coverImage: post.coverImage || '',
      media: post.media || [],
      isPublished: post.isPublished,
    });
    setImages([]);
    setVideoUrls((post.media || []).filter((m) => m.type === 'video').map((m) => m.url));
    setVideoErrors([]);
    setShowCreate(true);
  };

  async function handleCreate() {
    setSaving(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('excerpt', form.excerpt.trim());
      formData.append('content', form.content.trim());
      formData.append('category', form.category.trim());
      formData.append('isPublished', String(form.isPublished));
      if (form.coverImage) formData.append('coverImage', form.coverImage.trim());

      images.forEach((file) => formData.append('images', file));
      videoUrls.forEach((url) => {
        formData.append('media', JSON.stringify({ type: 'video', url }));
      });

      await api.createBlogPost(formData);
      setMessage({ type: 'success', text: 'Post created successfully' });
      setShowCreate(false);
      resetForm();
      await fetchPosts();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to create post' });
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate() {
    if (!editingPost) return;
    setSaving(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('excerpt', form.excerpt.trim());
      formData.append('content', form.content.trim());
      formData.append('category', form.category.trim());
      formData.append('isPublished', String(form.isPublished));
      if (form.coverImage) formData.append('coverImage', form.coverImage.trim());

      images.forEach((file) => formData.append('images', file));
      videoUrls.forEach((url) => {
        formData.append('media', JSON.stringify({ type: 'video', url }));
      });

      await api.updateBlogPost(editingPost._id, formData);
      setMessage({ type: 'success', text: 'Post updated successfully' });
      setEditingPost(null);
      setShowCreate(false);
      resetForm();
      await fetchPosts();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update post' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;

    try {
      await api.deleteBlogPost(id);
      setMessage({ type: 'success', text: 'Post deleted' });
      await fetchPosts();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete post' });
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const mapped = files.map((file) => Object.assign(file, { preview: URL.createObjectURL(file) }));
    setImages((prev) => [...prev, ...mapped]);
    event.target.value = '';
  };

  const addVideoUrl = () => {
    const url = window.prompt('Enter a video URL');
    if (!url) return;
    const trimmed = url.trim();
    if (!trimmed) return;
    setVideoUrls((prev) => [...prev, trimmed]);
  };

  const removeVideoUrl = (index: number) => {
    setVideoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`px-4 py-3 rounded-lg text-sm font-semibold ${
            message.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Blog</h1>
          <p className="text-muted text-sm">{posts.length} post{posts.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-secondary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-secondary-hover transition-colors"
        >
          + New Post
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-secondary border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-6 text-center text-muted">
          No blog posts yet.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <div key={post._id} className="bg-white rounded-xl border border-border p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-primary truncate">{post.title}</h2>
                  <p className="text-xs text-muted mt-1">
                    {post.category} &middot; {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'draft'}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEdit(post)} className="btn-secondary text-xs py-1.5 px-3">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(post._id, post.title)} className="btn-danger text-xs py-1.5 px-3">
                    Delete
                  </button>
                </div>
              </div>

              <p className="text-sm text-muted mt-3 line-clamp-2">{post.excerpt}</p>

              {post.media && post.media.length > 0 && (
                <div className="mt-3 flex gap-2 text-xs text-muted">
                  {post.media.filter((m) => m.type === 'image').length > 0 && (
                    <span>{post.media.filter((m) => m.type === 'image').length} image{post.media.filter((m) => m.type === 'image').length > 1 ? 's' : ''}</span>
                  )}
                  {post.media.filter((m) => m.type === 'video').length > 0 && (
                    <span>{post.media.filter((m) => m.type === 'video').length} video{post.media.filter((m) => m.type === 'video').length > 1 ? 's' : ''}</span>
                  )}
                </div>
              )}

              <div className="mt-3 text-xs text-muted">{post.isPublished ? 'Published' : 'Draft'}</div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="bg-white rounded-xl border border-border p-6">
          <h2 className="text-xl font-bold text-primary mb-4">
            {editingPost ? 'Edit Post' : 'New Post'}
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-muted mb-1">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-border rounded-md px-3 py-2"
                placeholder="Post title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1">Category *</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-border rounded-md px-3 py-2"
                placeholder="e.g. Family Law"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1">Cover Image URL</label>
              <input
                type="url"
                value={form.coverImage}
                onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                className="w-full border border-border rounded-md px-3 py-2"
                placeholder="https://..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-muted mb-1">Excerpt *</label>
              <textarea
                rows={3}
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                className="w-full border border-border rounded-md px-3 py-2"
                placeholder="Short excerpt"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-muted mb-1">Content *</label>
              <textarea
                rows={8}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full border border-border rounded-md px-3 py-2"
                placeholder="Full article content"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-muted mb-1">Images</label>
              <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="w-full" />
              {images.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {images.map((file, i) => (
                    <div key={`${file.name}-${i}`} className="text-xs text-muted bg-slate-100 rounded px-2 py-1">
                      {file.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-muted">Videos</label>
                <button type="button" onClick={addVideoUrl} className="text-sm text-secondary font-semibold">+ Add video</button>
              </div>

              {videoUrls.length === 0 ? (
                <p className="text-sm text-muted">No videos added yet.</p>
              ) : (
                <div className="space-y-2">
                  {videoUrls.map((url, i) => (
                    <div key={`${url}-${i}`} className="flex items-center gap-2">
                      <input value={url} readOnly className="flex-1 border border-border rounded-md px-3 py-2 text-sm" />
                      <button type="button" onClick={() => removeVideoUrl(i)} className="text-red-600 text-sm font-medium">Remove</button>
                    </div>
                  ))}
                </div>
              )}

              {videoErrors.length > 0 && (
                <div className="mt-2 text-sm text-red-600">{videoErrors.join(', ')}</div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-muted">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                />
                Publish immediately
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => { setShowCreate(false); resetForm(); setEditingPost(null); }} className="px-4 py-2 rounded-lg border border-border text-muted">
              Cancel
            </button>
            <button
              type="button"
              onClick={editingPost ? handleUpdate : handleCreate}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-secondary text-white font-semibold disabled:opacity-60"
            >
              {saving ? 'Saving...' : editingPost ? 'Update Post' : 'Create Post'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
