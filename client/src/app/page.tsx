'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const practiceAreas = [
  'Family Law',
  'Corporate Law',
  'Property Law',
  'Criminal Law',
  'Civil Litigation',
  'Tax Law',
  'Employment Law',
  'Immigration Law',
  'Intellectual Property',
  'Human Rights',
];

const stats = [
  { number: '500+', label: 'Verified Lawyers' },
  { number: '10,000+', label: 'Clients Served' },
  { number: '50+', label: 'Practice Areas' },
  { number: '36', label: 'States Covered' },
];

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchArea, setSearchArea] = useState('');
  const [featuredLawyers, setFeaturedLawyers] = useState<any[]>([]);

  useEffect(() => {
    api.getLawyers({}).then((data) => {
      setFeaturedLawyers(data.lawyers.slice(0, 3));
    }).catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('name', searchQuery);
    if (searchLocation) params.set('location', searchLocation);
    if (searchArea) params.set('practiceArea', searchArea);
    router.push(`/lawyers?${params.toString()}`);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-accent to-accent/80 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Find Trusted Legal Professionals Across Africa
            </h1>
            <p className="mt-6 text-lg md:text-xl text-primary/80">
              Discover verified lawyers, book consultations, and get the legal support you need — all in one place.
            </p>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="mt-10 bg-white rounded-xl p-3 shadow-2xl flex flex-col md:flex-row gap-3">
              <input
                type="text"
                placeholder="Search by lawyer name or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-3 text-accent rounded-lg border-2 border-primary focus:outline-none focus:ring-4 focus:ring-primary/30"
              />
              <select
                value={searchArea}
                onChange={(e) => setSearchArea(e.target.value)}
                className="px-4 py-3 text-accent rounded-lg border-2 border-primary focus:outline-none focus:ring-4 focus:ring-primary/30 bg-white"
              >
                <option value="">All Practice Areas</option>
                {practiceAreas.map((area) => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Location (City/State)..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="px-4 py-3 text-accent rounded-lg border-2 border-primary focus:outline-none focus:ring-4 focus:ring-primary/30"
              />
              <button
                type="submit"
                className="bg-primary text-accent px-8 py-3 rounded-lg hover:bg-primary-dark transition-colors font-bold whitespace-nowrap shadow-md"
              >
                Find Lawyers
              </button>
            </form>

            <div className="mt-6 flex flex-wrap gap-2">
              {practiceAreas.slice(0, 5).map((area) => (
                <Link
                  key={area}
                  href={`/lawyers?practiceArea=${encodeURIComponent(area)}`}
                  className="text-sm bg-white/20 text-white px-3 py-1.5 rounded-full hover:bg-white/30 transition-colors border border-white/30"
                >
                  {area}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-accent">{stat.number}</p>
                <p className="text-gray-600 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-accent">How It Works</h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              Getting legal help has never been easier. Follow these simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: '01', title: 'Search & Discover', desc: 'Browse our directory of verified lawyers by practice area, location, or expertise.' },
                { step: '02', title: 'Compare & Connect', desc: 'View profiles, check ratings, and send an enquiry to the right lawyer for your needs.' },
                { step: '03', title: 'Get Legal Support', desc: 'Schedule a consultation, share documents securely, and get the legal help you need.' },
              ].map((item) => (
                <div key={item.step} className="bg-white p-8 rounded-xl shadow-lg border-2 border-primary/20 text-center hover:shadow-xl transition-shadow">
                  <div className="w-14 h-14 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-primary font-bold text-xl">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-accent mb-3">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Featured Lawyers */}
      {featuredLawyers.length > 0 && (
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold text-accent">Featured Lawyers</h2>
                <p className="text-gray-600 mt-2">Top-rated legal professionals on Advisora Connect</p>
              </div>
              <Link href="/lawyers" className="text-accent font-bold hover:underline">
                View All &rarr;
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {featuredLawyers.map((lawyer: any) => (
                <Link key={lawyer._id} href={`/lawyers/${lawyer._id}`} className="bg-white border-2 border-primary/20 rounded-xl p-6 hover:shadow-xl hover:border-primary transition-all">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {lawyer.userId?.firstName?.[0]}{lawyer.userId?.lastName?.[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg text-accent">
                          {lawyer.userId?.firstName} {lawyer.userId?.lastName}
                        </h3>
                        {lawyer.verificationBadge && (
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold">Verified</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{lawyer.city}, {lawyer.state}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {lawyer.practiceAreas?.slice(0, 2).map((area: string) => (
                          <span key={area} className="bg-primary/10 text-accent text-xs px-2 py-1 rounded-full font-medium">{area}</span>
                        ))}
                      </div>
                      <div className="flex items-center mt-2 text-sm">
                        <span className="text-yellow-500 text-lg">★</span>
                        <span className="ml-1 text-gray-700 font-semibold">{lawyer.rating?.toFixed(1)}</span>
                        <span className="ml-2 text-gray-500">({lawyer.reviewCount} reviews)</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-accent text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">Are You a Legal Professional?</h2>
          <p className="mt-4 text-primary/80 max-w-2xl mx-auto text-lg">
            Join Advisora Connect and grow your practice with digital tools, client enquiries, and enhanced visibility.
          </p>
          <Link
            href="/register?role=lawyer"
            className="inline-block mt-8 bg-primary text-accent px-8 py-3 rounded-lg hover:bg-primary-dark transition-colors font-bold text-lg shadow-lg"
          >
            Register as a Lawyer
          </Link>
        </div>
      </section>

      {/* Practice Areas Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-accent">Practice Areas</h2>
            <p className="text-gray-600 mt-2">Find specialized legal expertise for every need</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {practiceAreas.map((area) => (
              <Link
                key={area}
                href={`/lawyers?practiceArea=${encodeURIComponent(area)}`}
                className="bg-white border-2 border-primary/30 rounded-xl p-4 text-center hover:shadow-lg hover:border-primary transition-all"
              >
                <p className="font-medium text-accent">{area}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}