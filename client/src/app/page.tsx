'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

// Unsplash images for hero section
const HERO_IMAGE = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop&crop=faces';

const benefits = [
  {
    title: 'Verified Lawyers',
    desc: 'Every lawyer on our platform undergoes a thorough verification process including license confirmation and professional standing checks.',
    icon: '✅',
  },
  {
    title: 'Easy Access to Legal Expertise',
    desc: 'Find the right lawyer for your needs quickly and easily, without relying on limited personal recommendations.',
    icon: '⚡',
  },
  {
    title: 'Transparent Professional Profiles',
    desc: 'View detailed profiles including practice areas, qualifications, ratings, and reviews before making a decision.',
    icon: '📋',
  },
  {
    title: 'Convenient Consultations',
    desc: 'Schedule consultations at your convenience and communicate securely through our platform.',
    icon: '📅',
  },
  {
    title: 'Trusted Legal Solutions',
    desc: 'Access quality legal expertise across a wide range of practice areas, from business law to family matters.',
    icon: '🛡️',
  },
];

const steps = [
  {
    step: '01',
    title: 'Search for a Lawyer',
    desc: 'Browse our directory by practice area, location, or expertise to find legal professionals that match your needs.',
  },
  {
    step: '02',
    title: 'Review Lawyer Profiles',
    desc: 'Read detailed profiles, verify credentials, check ratings, and compare lawyers before reaching out.',
  },
  {
    step: '03',
    title: 'Connect and Get Legal Support',
    desc: 'Send an enquiry, schedule a consultation, and get the legal guidance you need from a trusted professional.',
  },
];

export default function HomePage() {
  const { user } = useAuth();
  const [featuredLawyers, setFeaturedLawyers] = useState<any[]>([]);

  useEffect(() => {
    api.getLawyers({}).then((data) => {
      setFeaturedLawyers(data.lawyers.slice(0, 3));
    }).catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-accent via-accent to-accent/90 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-24">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* Left Column - Text */}
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Find Trusted Lawyers Across Africa
              </h1>
              <p className="mt-6 text-lg md:text-xl text-primary/80">
                Need legal guidance? Advisora connects individuals and
                businesses with trusted and verified lawyers, making it
                easier to access quality legal expertise when you need it.
              </p>
              <p className="mt-4 text-primary/70 text-base">
                Whether you need support with business matters, contracts,
                property transactions, employment issues, family matters,
                compliance, or legal advisory services, Advisora helps you
                find the right legal professional.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link
                  href="/lawyers"
                  className="inline-block bg-[#C5A55A] text-[#1B2A4A] px-10 py-4 rounded-lg hover:bg-[#d4b36a] transition-colors font-bold text-lg shadow-lg text-center"
                >
                  Find a Lawyer
                </Link>
                {!user && (
                  <Link
                    href="/register"
                    className="inline-block bg-white text-accent px-10 py-4 rounded-lg hover:bg-gray-100 transition-colors font-bold text-lg shadow-lg border-2 border-white/30 text-center"
                  >
                    Register Now
                  </Link>
                )}
              </div>
            </div>

            {/* Right Column - Image */}
            <div className="hidden md:flex justify-center">
              <div className="relative">
                <div className="w-72 h-72 lg:w-96 lg:h-96 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20">
                  <img
                    src={HERO_IMAGE}
                    alt="Trusted Legal Professionals"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Decorative floating elements */}
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-[#C5A55A]/30 rounded-full blur-xl"></div>
                <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute top-1/2 -left-8 w-16 h-16 bg-[#C5A55A]/20 rounded-full blur-lg"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="relative h-16">
          <svg className="absolute bottom-0 w-full h-16 text-white" viewBox="0 0 1440 48" fill="currentColor" preserveAspectRatio="none">
            <path d="M0,48 C240,0 480,48 720,48 C960,48 1200,0 1440,48 L1440,48 L0,48 Z" />
          </svg>
        </div>
      </section>

      {/* Why Advisora Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-accent">
              Why Advisora?
            </h2>
            <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
              We make it simple to find and connect with trusted legal
              professionals across Africa.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((item) => (
              <div
                key={item.title}
                className="bg-primary/5 border-2 border-primary/10 rounded-xl p-6 hover:border-primary/30 hover:shadow-lg transition-all group"
              >
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-bold text-accent mb-2 group-hover:text-[#C5A55A] transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-accent">
              How It Works
            </h2>
            <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
              Getting legal help has never been easier. Follow these simple
              steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((item) => (
              <div
                key={item.step}
                className="bg-white p-8 rounded-xl shadow-lg border-2 border-primary/10 text-center hover:shadow-xl hover:border-primary/30 transition-all"
              >
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-5">
                  <span className="text-[#C5A55A] font-bold text-2xl">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-accent mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Lawyers */}
      {featuredLawyers.length > 0 && (
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-accent">
                  Featured Lawyers
                </h2>
                <p className="text-gray-600 mt-2">
                  Top-rated legal professionals on Advisora Connect
                </p>
              </div>
              <Link
                href="/lawyers"
                className="text-accent font-bold hover:underline"
              >
                View All &rarr;
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {featuredLawyers.map((lawyer: any) => (
                <Link
                  key={lawyer._id}
                  href={`/lawyers/${lawyer._id}`}
                  className="bg-white border-2 border-primary/10 rounded-xl p-6 hover:shadow-xl hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-accent flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                      {lawyer.photo ? (
                        <img
                          src={lawyer.photo}
                          alt={lawyer.userId?.firstName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>
                          {lawyer.userId?.firstName?.[0]}
                          {lawyer.userId?.lastName?.[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg text-accent group-hover:text-[#C5A55A] transition-colors">
                          {lawyer.userId?.firstName}{' '}
                          {lawyer.userId?.lastName}
                        </h3>
                        {lawyer.verificationBadge && (
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {lawyer.city}, {lawyer.state}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {lawyer.practiceAreas
                          ?.slice(0, 2)
                          .map((area: string) => (
                            <span
                              key={area}
                              className="bg-primary/10 text-accent text-xs px-2 py-1 rounded-full font-medium"
                            >
                              {area}
                            </span>
                          ))}
                      </div>
                      <div className="flex items-center mt-2 text-sm">
                        <span className="text-yellow-500 text-lg">★</span>
                        <span className="ml-1 text-gray-700 font-semibold">
                          {lawyer.rating?.toFixed(1)}
                        </span>
                        <span className="ml-2 text-gray-500">
                          ({lawyer.reviewCount} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Lawyer CTA Section */}
      <section className="py-16 md:py-24 bg-accent text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white"></div>
          <div className="absolute bottom-10 right-20 w-60 h-60 rounded-full bg-white"></div>
          <div className="absolute top-1/3 right-0 w-20 h-20 rounded-full bg-[#C5A55A]"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold">
            Are You a Lawyer?
          </h2>
          <p className="mt-4 text-primary/70 max-w-2xl mx-auto text-lg">
            Join Advisora and connect with clients seeking legal expertise
            across Africa. Expand your reach and grow your practice.
          </p>
          <div className="mt-8">
            <Link
              href="/register?role=lawyer"
              className="inline-block bg-[#C5A55A] text-[#1B2A4A] px-10 py-4 rounded-lg hover:bg-[#d4b36a] transition-colors font-bold text-lg shadow-lg"
            >
              Register as a Lawyer
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}