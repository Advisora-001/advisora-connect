"use client";

import React from "react";
import Link from "next/link";

export default function AdvisoraImpactHomepageSection() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block bg-[#00A6A6]/10 text-[#00A6A6] px-4 py-1.5 rounded-full text-sm font-semibold mb-6 tracking-wide uppercase">
            Advisora Impact
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1B2A4A] tracking-tight mb-4">
            ADVISORA IMPACT
          </h2>
          <p className="mt-6 text-lg md:text-xl text-[#475569] leading-relaxed max-w-3xl mx-auto">
            Free Legal Assistance for Those Who Need It Most
          </p>
          <p className="mt-4 text-base text-[#667085] leading-relaxed max-w-3xl mx-auto">
            Advisora Impact is the pro bono and access-to-justice initiative of Advisora Connect Africa. It provides eligible individuals who cannot reasonably afford legal services with access to free, limited-scope legal assistance through our network of volunteer legal professionals.
          </p>
        </div>

        {/* Priority Areas Preview */}
        <div className="grid md:grid-cols-2 gap-6 mb-12 max-w-4xl mx-auto">
          <div className="bg-[#F5F7FA] border border-[#E5EAF0] rounded-xl p-6 hover:border-[#00A6A6]/30 hover:shadow-md transition-all">
            <div className="w-10 h-10 bg-[#00A6A6]/10 text-[#00A6A6] rounded-lg flex items-center justify-center text-xl font-bold mb-4">
              ⚖️
            </div>
            <h3 className="text-lg font-semibold text-[#1B2A4A] mb-3">Women and Children</h3>
            <p className="text-[#667085] text-sm leading-relaxed">
              Domestic violence, sexual abuse, child protection, custody & maintenance matters involving genuine vulnerability or hardship.
            </p>
          </div>

          <div className="bg-[#F5F7FA] border border-[#E5EAF0] rounded-xl p-6 hover:border-[#00A6A6]/30 hover:shadow-md transition-all">
            <div className="w-10 h-10 bg-[#00A6A6]/10 text-[#00A6A6] rounded-lg flex items-center justify-center text-xl font-bold mb-4">
              🤝
            </div>
            <h3 className="text-lg font-semibold text-[#1B2A4A] mb-3">Volunteer Lawyers</h3>
            <p className="text-[#667085] text-sm leading-relaxed">
              Legal professionals giving back through free consultations, advice, document review, and limited-scope representation.
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/pro-bono/apply" className="inline-block bg-[#00A6A6] text-white px-8 py-3.5 rounded-lg hover:bg-[#008F8F] transition-colors font-semibold text-base shadow-lg shadow-[#00A6A6]/20 text-center">
            Apply for Pro Bono Support
          </Link>
          <Link href="/pro-bono/volunteer" className="inline-block border-2 border-[#00A6A6] text-[#00A6A6] px-8 py-3.5 rounded-lg hover:bg-[#00A6A6] hover:text-white transition-colors font-semibold text-base text-center">
            Register as a Volunteer Lawyer
          </Link>
        </div>

        <p className="mt-6 text-center text-sm text-[#94A3B8] max-w-2xl mx-auto">
          Our initial focus is on women and children in vulnerable situations, victims of abuse and exploitation, and individuals facing exceptional hardship or urgent violations of their legal rights.
        </p>
      </div>
    </section>
  );
}