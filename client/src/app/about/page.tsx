import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'About Us — Advisora Connect',
};

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-accent via-accent to-accent/90 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-28 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            About Advisora
          </h1>
          <p className="mt-6 text-lg md:text-xl text-primary/80 max-w-3xl mx-auto">
            Making legal expertise more accessible, trustworthy, and convenient for
            individuals and businesses across Africa.
          </p>
        </div>
      </section>

      {/* About */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-lg text-gray-700 leading-relaxed mb-6">
            Advisora was created to make legal expertise more accessible,
            trustworthy, and convenient. Many individuals and businesses struggle
            to find qualified lawyers they can trust. Recommendations are often
            limited, and verifying credentials can be difficult. Advisora
            addresses this challenge by providing a platform where users can
            discover and connect with verified legal professionals.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            Our goal is to simplify access to legal services while helping
            lawyers expand their reach and serve more clients effectively.
          </p>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-16 md:py-24 bg-primary/5">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10">
            <div className="bg-white rounded-xl shadow-lg border-2 border-primary/10 p-8">
              <div className="text-4xl mb-4">🌍</div>
              <h2 className="text-2xl font-bold text-accent mb-4">
                Our Vision
              </h2>
              <p className="text-gray-700 leading-relaxed">
                To become Africa's leading digital marketplace for
                professional expertise.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg border-2 border-primary/10 p-8">
              <div className="text-4xl mb-4">🎯</div>
              <h2 className="text-2xl font-bold text-accent mb-4">
                Our Mission
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We are launching with legal professionals and building a trusted
                platform that will eventually connect individuals and businesses
                with a broad range of verified experts across Africa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10">
            <div className="border-2 border-primary/20 rounded-xl p-8 hover:border-primary/50 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mb-4">
                <span className="text-[#C5A55A] font-bold text-xl">1</span>
              </div>
              <h3 className="text-xl font-bold text-accent mb-4">
                What We Do Today
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Today, Advisora focuses on connecting users with trusted lawyers
                for legal advice, representation, and professional support. Our
                platform makes it easy to find verified legal professionals
                across a wide range of practice areas.
              </p>
              <Link
                href="/register"
                className="inline-block mt-6 bg-accent text-white px-6 py-3 rounded-lg hover:bg-accent/90 transition-colors font-semibold"
              >
                Join Advisora Today
              </Link>
            </div>

            <div className="border-2 border-primary/20 rounded-xl p-8 hover:border-primary/50 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-[#C5A55A] rounded-full flex items-center justify-center mb-4">
                <span className="text-[#1B2A4A] font-bold text-xl">↗</span>
              </div>
              <h3 className="text-xl font-bold text-accent mb-4">
                What We Are Building
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Tomorrow, Advisora will expand to include accountants,
                consultants, financial advisors, HR professionals, and other
                trusted experts, creating a single destination for professional
                services across Africa.
              </p>
              <p className="text-gray-500 italic mt-4 text-sm">
                Advisora is launching with legal services and will expand to
                other professional categories in future.
              </p>
            </div>
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