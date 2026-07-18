'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useProfileGate } from '@/hooks/useProfileGate';

const practiceAreas = [
  'Family Law', 'Corporate Law', 'Property Law', 'Criminal Law',
  'Civil Litigation', 'Tax Law', 'Employment Law', 'Immigration Law',
  'Intellectual Property', 'Human Rights',
];

const statesList = [
  'Lagos', 'Abuja', 'Rivers', 'Oyo', 'Kano', 'Kaduna', 'Edo', 'Enugu',
  'Anambra', 'Delta', 'Ogun', 'Plateau', 'Niger', 'Kwara', 'Borno',
];

function LawyersContent() {
  const searchParams = useSearchParams();
  const { requireAccess, GateModal } = useProfileGate();
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    name: searchParams.get('name') || '',
    practiceArea: searchParams.get('practiceArea') || '',
    location: searchParams.get('location') || '',
    state: searchParams.get('state') || '',
    isAvailable: searchParams.get('isAvailable') || '',
  });

  async function fetchLawyers() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filters.name) params.name = filters.name;
      if (filters.practiceArea) params.practiceArea = filters.practiceArea;
      if (filters.location) params.location = filters.location;
      if (filters.state) params.state = filters.state;
      if (filters.isAvailable) params.isAvailable = filters.isAvailable;

      const data = await api.getLawyers(params);
      setLawyers(data.lawyers);
    } catch {
      setLawyers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLawyers();
  }, [filters]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1B2A4A]">Find Lawyers</h1>
        <p className="text-gray-600 mt-1">Browse our directory of verified legal professionals</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Search by name..."
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
          />
          <select
            value={filters.practiceArea}
            onChange={(e) => setFilters({ ...filters, practiceArea: e.target.value })}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2A4A] bg-white"
          >
            <option value="">All Practice Areas</option>
            {practiceAreas.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="City..."
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
          />
          <select
            value={filters.state}
            onChange={(e) => setFilters({ ...filters, state: e.target.value })}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2A4A] bg-white"
          >
            <option value="">All States</option>
            {statesList.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={filters.isAvailable}
            onChange={(e) => setFilters({ ...filters, isAvailable: e.target.value })}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2A4A] bg-white"
          >
            <option value="">Any Availability</option>
            <option value="true">Available Now</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-[#1B2A4A] border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-4">Searching lawyers...</p>
        </div>
      ) : lawyers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl">
          <p className="text-xl text-gray-500">No lawyers found matching your criteria.</p>
          <p className="text-gray-400 mt-2">Try adjusting your filters.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{lawyers.length} lawyer{lawyers.length !== 1 ? 's' : ''} found</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lawyers.map((lawyer: any) => (
              <Link
                key={lawyer._id}
                href={`/lawyers/${lawyer._id}`}
                onClick={(e) => {
                  e.preventDefault();
                  requireAccess(lawyer._id);
                }}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-[#1B2A4A] rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {lawyer.userId?.firstName?.[0]}{lawyer.userId?.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#1B2A4A] truncate">
                        {lawyer.userId?.firstName} {lawyer.userId?.lastName}
                      </h3>
                      {lawyer.verificationBadge && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex-shrink-0">✓ Verified</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{lawyer.city}, {lawyer.state}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {lawyer.practiceAreas?.slice(0, 3).map((area: string) => (
                        <span key={area} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">{area}</span>
                      ))}
                    </div>
                    <div className="flex items-center mt-2 text-sm">
                      <span className="text-yellow-500">★</span>
                      <span className="ml-1 text-gray-700">{lawyer.rating?.toFixed(1)}</span>
                      <span className="ml-1 text-gray-400">({lawyer.reviewCount})</span>
                      {lawyer.subscription?.status === 'active' && (
                        <span className="ml-auto text-xs text-[#C5A55A] font-medium">{lawyer.subscription.plan}</span>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <span className="text-sm bg-[#1B2A4A]/10 text-[#1B2A4A] px-3 py-1 rounded-lg font-medium">Contact</span>
                      {lawyer.consultationFee > 0 && (
                        <span className="text-sm text-gray-500">₦{lawyer.consultationFee.toLocaleString()}/hr</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
      {GateModal}
    </div>
  );
}

export default function LawyersPage() {
  return (
    <Suspense fallback={<div className="text-center py-20">Loading...</div>}>
      <LawyersContent />
    </Suspense>
  );
}