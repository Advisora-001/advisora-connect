'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Props {
  slug: string;
}

export default function LegalDocumentPage({ slug: initialSlug }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const slug = initialSlug || (params?.slug as string | undefined);
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [alreadyAccepted, setAlreadyAccepted] = useState(false);

  useEffect(() => {
    async function fetchDocument() {
      if (!slug) {
        setError('Document slug not provided');
        setLoading(false);
        return;
      }

      try {
        const doc = await api.getLegalDocumentBySlug(slug);
        setDocument(doc);
        setError('');

        // Check if user already accepted this version
        if (user) {
          try {
            const status = await api.getLegalAcceptanceStatus();
            const thisDoc = status.documents.find((d: any) => d.slug === slug);
            if (thisDoc?.accepted) {
              setAlreadyAccepted(true);
              setAccepted(true);
            }
          } catch {
            // Not authenticated or error - fine
          }
        }
      } catch {
        setError('Document not found');
      } finally {
        setLoading(false);
      }
    }
    fetchDocument();
  }, [slug, user]);

  const handleAccept = async () => {
    if (!slug) {
      alert('Document identifier missing');
      return;
    }

    if (!user) {
      const redirectPath = `/${slug}`;
      router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
      return;
    }

    setAccepting(true);
    try {
      await api.acceptLegalDocument(slug);
      setAccepted(true);
    } catch (err: any) {
      alert(err.message || 'Failed to accept. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-spin w-8 h-8 border-4 border-[#1B2A4A] border-t-transparent rounded-full mx-auto"></div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-[#1B2A4A] mb-4">Document Not Found</h1>
        <p className="text-gray-500">{error || 'The requested document could not be found.'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1B2A4A]">{document.title}</h1>
        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
          <span>Version: {document.version}</span>
          <span>Effective: {new Date(document.effectiveDate).toLocaleDateString()}</span>
          <span>Last updated: {new Date(document.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Content */}
      <div
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 leading-relaxed text-gray-700 whitespace-pre-wrap font-sans"
        style={{ lineHeight: '1.8' }}
      >
        {document.content}
      </div>

      {/* Acceptance */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {!user ? (
          <div className="text-center">
            <p className="text-gray-600 mb-4">Please log in to accept this document.</p>
            <button
              onClick={() => {
                const redirectPath = slug ? `/${slug}` : '/';
                router.push(`/login?redirect=${encodeURIComponent(redirectPath as string)}`);
              }}
              className="bg-[#1B2A4A] text-white px-6 py-3 rounded-lg hover:bg-[#2a3f6a] font-semibold transition-all"
            >
              Log In to Accept
            </button>
          </div>
        ) : accepted ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-green-700">
              {alreadyAccepted ? 'You have accepted this version' : 'Document Accepted Successfully'}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Version {document.version} accepted
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              By clicking "Accept", you confirm that you have read and agree to the{' '}
              <strong>{document.title}</strong>.
            </p>
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="bg-[#1B2A4A] text-white px-8 py-3 rounded-lg hover:bg-[#2a3f6a] font-semibold transition-all disabled:opacity-50"
            >
              {accepting ? 'Accepting...' : `Accept ${document.title}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}