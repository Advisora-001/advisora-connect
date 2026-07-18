'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function LegalDocumentsManager() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDoc, setEditingDoc] = useState<any | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    content: '',
    version: '1.0',
    effectiveDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchDocuments();
    fetchStats();
  }, []);

  async function fetchDocuments() {
    try {
      const data = await api.getAllLegalDocuments();
      setDocuments(data.documents);
    } catch (error) {
      console.error('Failed to fetch legal documents:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const data = await api.getLegalAcceptanceStats();
      setStats(data.stats);
    } catch {
      // Stats are optional
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createLegalDocument(formData);
      setShowCreate(false);
      setFormData({ slug: '', title: '', content: '', version: '1.0', effectiveDate: new Date().toISOString().split('T')[0] });
      await fetchDocuments();
    } catch (err: any) {
      alert(err.message || 'Failed to create document');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingDoc) return;
    setSaving(true);
    try {
      await api.updateLegalDocument(editingDoc._id, editingDoc);
      setEditingDoc(null);
      await fetchDocuments();
    } catch (err: any) {
      alert(err.message || 'Failed to update document');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border-2 border-primary/20 p-12 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-accent rounded-full mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Acceptance Stats */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.slug} className="bg-white p-4 rounded-xl shadow-md border-l-4 border-blue-500">
              <p className="text-xs font-medium text-gray-500 uppercase truncate">{s.title}</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{s.acceptanceRate}%</p>
              <p className="text-xs text-gray-400">{s.acceptedCount}/{s.totalUsers} users</p>
            </div>
          ))}
        </div>
      )}

      {/* Documents List */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-primary/20">
        <div className="p-6 border-b-2 border-primary/20 bg-primary/5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-accent">Legal Documents</h2>
            <p className="text-gray-600 text-sm mt-1">{documents.length} document{documents.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-[#1B2A4A] text-white px-5 py-2.5 rounded-lg hover:bg-[#2a3f6a] font-semibold transition-all"
          >
            {showCreate ? 'Cancel' : '+ New Document'}
          </button>
        </div>

        {/* Create Form */}
        {showCreate && (
          <div className="p-6 border-b-2 border-primary/10">
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-accent mb-1">Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="terms-of-use"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-accent mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Terms of Use"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-accent mb-1">Version</label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    placeholder="1.0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-accent mb-1">Effective Date</label>
                  <input
                    type="date"
                    value={formData.effectiveDate}
                    onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-accent mb-1">Content (Markdown)</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={10}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2A4A] font-mono text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="bg-[#1B2A4A] text-white px-6 py-2.5 rounded-lg hover:bg-[#2a3f6a] font-semibold transition-all disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Document'}
              </button>
            </form>
          </div>
        )}

        {/* Edit Form */}
        {editingDoc && (
          <div className="p-6 border-b-2 border-primary/10 bg-amber-50">
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-accent mb-1">Title</label>
                  <input
                    type="text"
                    value={editingDoc.title}
                    onChange={(e) => setEditingDoc({ ...editingDoc, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-accent mb-1">Version</label>
                  <input
                    type="text"
                    value={editingDoc.version}
                    onChange={(e) => setEditingDoc({ ...editingDoc, version: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-accent mb-1">Effective Date</label>
                  <input
                    type="date"
                    value={editingDoc.effectiveDate?.split('T')[0] || ''}
                    onChange={(e) => setEditingDoc({ ...editingDoc, effectiveDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-accent mb-1">Active</label>
                  <select
                    value={editingDoc.isActive ? 'true' : 'false'}
                    onChange={(e) => setEditingDoc({ ...editingDoc, isActive: e.target.value === 'true' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2A4A] bg-white"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-accent mb-1">Content</label>
                <textarea
                  value={editingDoc.content}
                  onChange={(e) => setEditingDoc({ ...editingDoc, content: e.target.value })}
                  rows={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2A4A] font-mono text-sm"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 font-semibold transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-300 font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        {documents.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-xl text-gray-500 font-medium">No documents yet</p>
            <p className="text-gray-400 mt-2">Create your first legal document.</p>
          </div>
        ) : (
          <div className="divide-y divide-primary/10">
            {documents.map((doc: any) => (
              <div key={doc._id} className="p-6 hover:bg-primary/5 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-accent text-lg">{doc.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        doc.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {doc.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{doc.slug}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>Version: {doc.version}</span>
                      <span>Effective: {new Date(doc.effectiveDate).toLocaleDateString()}</span>
                      <span>Updated: {new Date(doc.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-2">
                      <a
                        href={`/${doc.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View page →
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingDoc(doc)}
                    className="text-sm text-accent hover:text-accent/70 font-semibold px-4 py-2 rounded-lg hover:bg-primary/10 transition-all"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}