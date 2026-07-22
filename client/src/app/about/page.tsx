import React from 'react';
import Link from 'next/link';

// Unsplash images
const HERO_BG = 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1600&h=600&fit=crop';
const TODAY_IMAGE = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&h=400&fit=crop';
const FUTURE_IMAGE = 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop';

export const metadata = {
  title: 'About Us — Advisora Connect',
};

export default function AboutPage() {
  return (
    <div>
      {/* Hero with image background */}
      <section className="relative bg-accent text-white overflow-hidden">
        {/* Background image with overlay */}
        <div className="absolute inset-0">
          <img
            src={HERO_BG}
            alt=""
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-accent via-accent/95 to-accent/90"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            About Advisora
          </h1>
          <p className="mt-6 text-lg md:text-xl text-primary/80 max-w-3xl mx-auto">
            Making legal expertise more accessible, trustworthy, and
            convenient for individuals and businesses across Africa.
          </p>
        </div>
      </section>

      {/* About */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-accent mb-4">
                Why Advisora Exists
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Advisora was created to make legal expertise more accessible,
                trustworthy, and convenient. Many individuals and businesses
                struggle to find qualified lawyers they can trust.
                Recommendations are often limited, and verifying credentials
                can be difficult.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Our goal is to simplify access to legal services while helping
                lawyers expand their reach and serve more clients effectively.
              </p>
            </div>
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-accent rounded-2xl flex items-center justify-center text-5xl shadow-lg">
                ⚖️
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission - With decorative background */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-white to-primary/5">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-lg border-2 border-primary/10 p-8 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mb-5">
                <span className="text-3xl">🌍</span>
              </div>
              <h2 className="text-2xl font-bold text-accent mb-4">
                Our Vision
              </h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                To become Africa's leading digital marketplace for
                professional expertise.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg border-2 border-primary/10 p-8 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mb-5">
                <span className="text-3xl">🎯</span>
              </div>
              <h2 className="text-2xl font-bold text-accent mb-4">
                Our Mission
              </h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                We are launching with legal professionals and building a
                trusted platform that will eventually connect individuals
                and businesses with a broad range of verified experts
                across Africa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do - With Images */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-accent">
              Our Journey
            </h2>
            <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
              We're building the future of professional services in
              Africa — one step at a time.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* What We Do Today */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-primary/20 overflow-hidden hover:shadow-xl transition-shadow">
              <div className="h-48 overflow-hidden">
                <img
                  src={TODAY_IMAGE}
                  alt="Legal Services Today"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                    <span className="text-[#C5A55A] font-bold">1</span>
                  </div>
                  <h3 className="text-xl font-bold text-accent">
                    What We Do Today
                  </h3>
                </div>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Today, Advisora focuses on connecting users with trusted
                  lawyers for legal advice, representation, and professional
                  support. Our platform makes it easy to find verified legal
                  professionals across a wide range of practice areas.
                </p>
                <Link
                  href="/lawyers"
                  className="inline-flex items-center gap-2 text-[#C5A55A] font-semibold hover:underline"
                >
                  Find a Lawyer
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* What We're Building */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-primary/20 overflow-hidden hover:shadow-xl transition-shadow">
              <div className="h-48 overflow-hidden">
                <img
                  src={FUTURE_IMAGE}
                  alt="Future Vision"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#C5A55A] rounded-full flex items-center justify-center">
                    <span className="text-accent font-bold">↗</span>
                  </div>
                  <h3 className="text-xl font-bold text-accent">
                    What We Are Building
                  </h3>
                </div>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Tomorrow, Advisora will expand to include accountants,
                  consultants, financial advisors, HR professionals, and
                  other trusted experts, creating a single destination for
                  professional services across Africa.
                </p>
                <p className="text-gray-500 italic text-sm border-l-4 border-[#C5A55A] pl-4">
                  Advisora is launching with legal services and will expand
                  to other professional categories in future.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-20 bg-primary/5">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-accent">
              Our Core Values
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: '🔒', title: 'Trust' },
              { icon: '💡', title: 'Innovation' },
              { icon: '🤝', title: 'Accessibility' },
              { icon: '⭐', title: 'Excellence' },
            ].map((value) => (
              <div
                key={value.title}
                className="bg-white rounded-xl p-6 text-center shadow hover:shadow-lg transition-shadow"
              >
                <div className="text-3xl mb-3">{value.icon}</div>
                <p className="font-bold text-accent">{value.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-accent text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to Get Started?
          </h2>
          <p className="mt-4 text-primary/70 text-lg">
            Whether you need legal advice or want to grow your practice,
            Advisora is here to help.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-[#C5A55A] text-[#1B2A4A] px-10 py-4 rounded-lg hover:bg-[#d4b36a] transition-colors font-bold text-lg shadow-lg"
            >
              Create an Account
            </Link>
            <Link
              href="/lawyers"
              className="text-white px-10 py-4 rounded-lg hover:bg-white/10 transition-colors font-bold text-lg border-2 border-white/30"
            >
              Find a Lawyer
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}