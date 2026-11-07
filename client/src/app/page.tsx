'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useProfileGate } from '@/hooks/useProfileGate';

const HERO_IMAGE = '/Hero-section.jpg';

const benefits = [
  { title: 'Verified Professionals', desc: 'Professional profiles are reviewed so you can make more informed decisions when choosing support.', icon: '✅' },
  { title: 'Expertise Across Key Fields', desc: 'Find legal, accounting, and tax professionals for your personal or business needs.', icon: '⚡' },
  { title: 'Transparent Professional Profiles', desc: 'View detailed profiles including practice areas, qualifications, ratings, and reviews before making a decision.', icon: '📋' },
  { title: 'Convenient Consultations', desc: 'Schedule consultations at your convenience and communicate securely through our platform.', icon: '📅' },
  { title: 'Trusted Professional Support', desc: 'Explore services across legal, accounting, and tax specialties in one place.', icon: '🛡️' },
];

const steps = [
  { step: '01', title: 'Choose a profession', desc: 'Browse legal, accounting, or tax professionals by expertise and location.' },
  { step: '02', title: 'Review profiles', desc: 'Explore professional qualifications, services, and experience before reaching out.' },
  { step: '03', title: 'Connect with an expert', desc: 'Contact a professional whose services match your needs.' },
];

export default function HomePage() {
  const { user } = useAuth();
  const { requireAccess, GateModal } = useProfileGate();
  const [featuredLawyers, setFeaturedLawyers] = useState<any[]>([]);

  useEffect(() => {
    api.getLawyers({}).then((data) => {
      setFeaturedLawyers(data.lawyers.slice(0, 3));
    }).catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-[#1B2A4A] text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
                Find trusted professionals for your needs
              </h1>
              <p className="mt-6 text-lg md:text-xl text-white/70 leading-relaxed">
                Advisora connects individuals and businesses with professionals across legal, accounting, and tax services.
              </p>
              <p className="mt-4 text-white/50 text-base leading-relaxed">
                Explore reviewed profiles, compare expertise, and connect with the right professional for your personal or business needs.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link href="/professionals" className="inline-block bg-[#00A6A6] text-white px-8 py-3.5 rounded-lg hover:bg-[#008F8F] transition-colors font-semibold text-base shadow-lg shadow-[#00A6A6]/20 text-center">
                  Find a Professional
                </Link>
                {!user && (
                  <Link href="/register" className="inline-block bg-white text-[#1B2A4A] px-8 py-3.5 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-base text-center">
                    Register Now
                  </Link>
                )}
              </div>
            </div>
            <div className="hidden md:flex justify-center">
              <div className="relative">
                <div className="w-72 h-72 lg:w-96 lg:h-96 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10">
                  <img src={HERO_IMAGE} alt="Trusted professionals" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-[#00A6A6]/20 rounded-full blur-xl"></div>
                <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Advisora */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1B2A4A] tracking-tight">Why Advisora?</h2>
            <p className="text-[#667085] mt-3 max-w-2xl mx-auto text-lg">We make it simple to find and connect with trusted professionals across key service areas.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((item) => (
              <div key={item.title} className="bg-[#F5F7FA] border border-[#E5EAF0] rounded-xl p-6 hover:border-[#00A6A6]/30 hover:shadow-md transition-all group">
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-semibold text-[#1B2A4A] mb-2 group-hover:text-[#00A6A6] transition-colors">{item.title}</h3>
                <p className="text-[#667085] text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-28 bg-[#F5F7FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1B2A4A] tracking-tight">How It Works</h2>
            <p className="text-[#667085] mt-3 max-w-2xl mx-auto text-lg">Find the professional expertise you need in a few simple steps.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((item) => (
              <div key={item.step} className="bg-white p-8 rounded-xl border border-[#E5EAF0] text-center hover:shadow-md transition-all">
                <div className="w-16 h-16 bg-[#1B2A4A] rounded-full flex items-center justify-center mx-auto mb-5">
                  <span className="text-[#00A6A6] font-bold text-2xl">{item.step}</span>
                </div>
                <h3 className="text-xl font-semibold text-[#1B2A4A] mb-3">{item.title}</h3>
                <p className="text-[#667085] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Browse professional categories */}
      <section className="py-16 bg-[#F5F7FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#1B2A4A] tracking-tight">Explore professional services</h2>
            <p className="text-[#667085] mt-2">Choose a category to find the expertise you need.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: 'Legal professionals', category: 'legal', description: 'Lawyers and legal advisers for personal and business matters.' },
              { title: 'Accountants', category: 'accounting', description: 'Accounting professionals for reporting, bookkeeping, and business finance.' },
              { title: 'Tax consultants', category: 'tax', description: 'Tax professionals for compliance, planning, and advisory support.' },
            ].map((item) => (
              <Link key={item.category} href={`/professionals?category=${item.category}`} className="rounded-xl border border-[#E5EAF0] bg-white p-6 hover:border-[#00A6A6]/50 hover:shadow-md transition-all">
                <h3 className="text-lg font-semibold text-[#1B2A4A]">{item.title}</h3>
                <p className="mt-2 text-sm text-[#667085]">{item.description}</p>
                <span className="mt-4 inline-block text-sm font-semibold text-[#00A6A6]">Explore profiles →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Lawyers */}
      {featuredLawyers.length > 0 && (
        <section className="py-20 md:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-[#1B2A4A] tracking-tight">Featured Legal Professionals</h2>
                <p className="text-[#667085] mt-2">Lawyers featured on Advisora Connect</p>
              </div>
              <Link href="/lawyers" className="text-[#00A6A6] font-semibold hover:underline text-sm">View All →</Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {featuredLawyers.map((lawyer: any) => (
                <div key={lawyer._id} onClick={(e) => { e.preventDefault(); requireAccess(lawyer._id); }}
                  className="bg-white border border-[#E5EAF0] rounded-xl p-6 hover:shadow-md hover:border-[#00A6A6]/30 transition-all group cursor-pointer">
                  <div className="flex items-start space-x-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-[#1B2A4A] flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                      {lawyer.photo ? (
                        <img src={lawyer.photo} alt={lawyer.userId?.firstName} className="w-full h-full object-cover" />
                      ) : (
                        <span>{lawyer.userId?.firstName?.[0]}{lawyer.userId?.lastName?.[0]}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-[#1B2A4A] group-hover:text-[#00A6A6] transition-colors">{lawyer.userId?.firstName} {lawyer.userId?.lastName}</h3>
                        {lawyer.verificationBadge && (
                          <span className="bg-[#ECFDF5] text-[#166534] text-xs px-2 py-0.5 rounded-full font-semibold">Verified</span>
                        )}
                      </div>
                      <p className="text-sm text-[#667085]">{lawyer.city}, {lawyer.state}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {lawyer.practiceAreas?.slice(0, 2).map((area: string) => (
                          <span key={area} className="bg-[#EEF2F7] text-[#1B2A4A] text-xs px-2 py-1 rounded-full font-medium">{area}</span>
                        ))}
                      </div>
                      <div className="flex items-center mt-2 text-sm">
                        <span className="text-[#F59E0B]">★</span>
                        <span className="ml-1 text-[#1B2A4A] font-semibold">{lawyer.rating?.toFixed(1)}</span>
                        <span className="ml-2 text-[#94A3B8]">({lawyer.reviewCount} reviews)</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      {GateModal}
    </div>
  );
}