"use client";

import React from "react";
import Link from "next/link";

export default function ProBonoPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Hero Banner */}
      <section className="bg-[#1B2A4A] text-white py-20 md:py-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="inline-block bg-[#00A6A6]/10 text-[#00A6A6] px-4 py-1.5 rounded-full text-sm font-semibold mb-6 tracking-wide uppercase">
              Advisora Impact
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight mb-6">
              Free Legal Assistance for Those Who Need It Most
            </h1>
            <p className="text-lg md:text-xl text-white/70 leading-relaxed max-w-2xl mx-auto">
              Advisora Impact is the pro bono and access-to-justice initiative of Advisora Connect Africa. It provides eligible individuals who cannot reasonably afford legal services with access to free, limited-scope legal assistance through our network of volunteer legal professionals.
            </p>
            <p className="mt-4 text-white/50 text-base leading-relaxed max-w-2xl mx-auto">
              Our initial focus is on women and children in vulnerable situations, victims of abuse and exploitation, and individuals facing exceptional hardship or urgent violations of their legal rights.
            </p>
          </div>
        </div>
      </section>

      {/* What Legal Assistance */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1B2A4A] tracking-tight mb-4">
              What Legal Assistance Do We Provide?
            </h2>
            <p className="text-[#667085] text-lg max-w-2xl mx-auto">
              Depending on the circumstances of the application and the availability of a suitable volunteer lawyer, assistance may include:
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                number: '1',
                title: 'Free Initial Legal Consultation',
                desc: 'A one-off consultation to understand your legal problem, explain your rights and discuss available options and next steps.',
              },
              {
                number: '2',
                title: 'Legal Advice and Guidance',
                desc: 'Practical legal guidance on specific issues, including your rights, obligations, remedies and available legal processes.',
              },
              {
                number: '3',
                title: 'Legal Document Review',
                desc: 'Review of relevant legal documents and explanation of their legal implications.',
              },
              {
                number: '4',
                title: 'Basic Legal Document Preparation',
                desc: 'Assistance with selected legal letters, complaints, responses and other agreed documents. Preparation of selected legal letters and documents.',
              },
              {
                number: '5',
                title: 'Limited-Scope Representation',
                desc: 'In selected cases, a volunteer lawyer may agree to assist with negotiations, mediation, meetings or court proceedings. Legal representation in selected cases, subject to approval and volunteer availability.',
              },
            ].map((item) => (
              <div
                key={item.number}
                className="bg-[#F5F7FA] border border-[#E5EAF0] rounded-xl p-6 hover:border-[#00A6A6]/30 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 bg-[#1B2A4A] rounded-lg flex items-center justify-center text-white font-bold text-lg mb-4 flex-shrink-0">
                  {item.number}
                </div>
                <h3 className="text-lg font-semibold text-[#1B2A4A] mb-2">{item.title}</h3>
                <p className="text-[#667085] text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Priority Areas */}
      <section className="py-20 md:py-28 bg-[#F5F7FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1B2A4A] tracking-tight mb-4">
              Our Priority Areas
            </h2>
            <p className="text-[#667085] text-lg max-w-2xl mx-auto">
              We prioritize legal assistance for women and children facing the greatest vulnerability and hardship.
            </p>
          </div>

          <div className="bg-white border border-[#E5EAF0] rounded-xl p-8 md:p-12 max-w-3xl mx-auto">
            <div className="w-10 h-10 bg-[#00A6A6]/10 text-[#00A6A6] rounded-lg flex items-center justify-center text-xl font-bold mb-6">
              ⚖️
            </div>
            <h3 className="text-xl font-semibold text-[#1B2A4A] mb-6">Women and Children</h3>
            <ul className="space-y-4 text-[#667085]">
              <li className="flex items-start">
                <span className="text-[#00A6A6] mt-0.5">•</span>
                <span className="ml-3">Domestic violence and abuse.</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#00A6A6] mt-0.5">•</span>
                <span className="ml-3">Sexual abuse, harassment and exploitation.</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#00A6A6] mt-0.5">•</span>
                <span className="ml-3">Child abuse, neglect and safeguarding.</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#00A6A6] mt-0.5">•</span>
                <span className="ml-3">Child custody, maintenance and welfare matters involving genuine vulnerability or hardship.</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#00A6A6] mt-0.5">•</span>
                <span className="ml-3">Protection of the rights of women and children.</span>
              </li>
            </ul>

            <div className="mt-8 p-4 bg-[#F5F7FA] border border-[#E5EAF0] rounded-lg">
              <p className="text-[#667085] text-sm leading-relaxed">
                <strong className="text-[#1B2A4A]">Individuals facing exceptional hardship or urgent violations of their legal rights</strong> may also be considered on a case-by-case basis, subject to volunteer lawyer availability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cost */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#F5F7FA] border border-[#E5EAF0] rounded-xl p-8 md:p-12 max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-[#1B2A4A] tracking-tight mb-4">
                How Much Will It Cost?
              </h2>
            </div>

            <div className="space-y-6 text-[#667085] leading-relaxed">
              <p className="text-lg">
                Approved assistance under Advisora Impact will be provided without professional fees to the eligible applicant, within the scope agreed for that assignment.
              </p>
              <p>
                However, any external expenses, statutory charges, filing fees, transport, expert fees or other disbursements must be disclosed and agreed in advance. Advisora Impact does not automatically undertake to fund these expenses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How to Apply */}
      <section className="py-20 md:py-28 bg-[#F5F7FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1B2A4A] tracking-tight mb-4">
              How Do I Apply?
            </h2>
            <p className="text-[#667085] text-lg max-w-2xl mx-auto">
              Complete our Pro Bono Support Application Form and provide sufficient information about your circumstances and the legal assistance you require.
            </p>
          </div>

          <div className="bg-white border border-[#E5EAF0] rounded-xl p-8 md:p-12 max-w-2xl mx-auto">
            <ol className="space-y-6 text-[#667085] leading-relaxed">
              <li className="flex items-start gap-3">
                <span className="w-8 h-8 bg-[#1B2A4A] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</span>
                <span>Complete the Pro Bono Support Application Form with details about your circumstances, financial situation, and the legal assistance you require.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-8 h-8 bg-[#1B2A4A] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</span>
                <span>Every application will be assessed individually, taking into account financial circumstances, urgency, vulnerability, the nature and merits of the legal issue, and the availability of an appropriate volunteer lawyer.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-8 h-8 bg-[#1B2A4A] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</span>
                <span>Approval for an initial consultation does not automatically guarantee further legal assistance or full representation.</span>
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* Important Boundaries */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1B2A4A] tracking-tight mb-4">
              Important Boundaries
            </h2>
            <p className="text-[#667085] text-lg max-w-2xl mx-auto">
              Please understand the scope and limitations of Advisora Impact before applying.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              'Assistance is limited to the approved categories (primarily women and children\'s issues).',
              'Applicants must demonstrate financial need.',
              'Every application is assessed individually.',
              'Full representation is not guaranteed.',
              'Volunteer lawyers determine whether to accept an assignment.',
              'External expenses and disbursements are not automatically covered.',
            ].map((boundary, index) => (
              <div key={index} className="bg-[#FEF2F2] border border-[#FECACA]/50 rounded-xl p-6">
                <div className="w-10 h-10 bg-[#FEE2E2] text-[#EF4444] rounded-lg flex items-center justify-center text-xl font-bold mb-3">
                  !
                </div>
                <p className="text-[#991B1B] text-sm leading-relaxed">{boundary}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Volunteer Lawyer Section */}
      <section className="py-20 md:py-28 bg-[#F5F7FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-[#E5EAF0] rounded-2xl p-8 md:p-12 max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-[#00A6A6]/10 text-[#00A6A6] rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                🤝
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#1B2A4A] tracking-tight mb-4">
                Are You a Lawyer Who Wants to Give Back?
              </h2>
              <p className="text-[#667085] text-lg max-w-2xl mx-auto">
                Join the Advisora Impact volunteer network. You may contribute by offering free consultations, legal advice, document review, drafting assistance or representation in selected cases.
              </p>
            </div>

            <div className="space-y-4 text-[#667085] leading-relaxed mb-10 max-w-2xl mx-auto">
              <p>You retain the right to assess each referral and decide whether to accept it.</p>
              <p>All assignments are subject to your professional obligations, availability and conflict checks.</p>
            </div>

            <div className="text-center">
              <Link href="/pro-bono/volunteer" className="inline-block bg-[#00A6A6] text-white px-8 py-3.5 rounded-lg hover:bg-[#008F8F] transition-colors font-semibold text-base shadow-lg shadow-[#00A6A6]/20">
                Register as a Volunteer Lawyer
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-[#1B2A4A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Advisora Impact — Because access to justice should not depend solely on the ability to pay.
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pro-bono/apply" className="inline-block bg-[#00A6A6] text-white px-8 py-3.5 rounded-lg hover:bg-[#008F8F] transition-colors font-semibold text-base shadow-lg shadow-[#00A6A6]/20">
              Apply for Pro Bono Support
            </Link>
            <Link href="/pro-bono/volunteer" className="inline-block border-2 border-white text-white px-8 py-3.5 rounded-lg hover:bg-white hover:text-[#1B2A4A] transition-colors font-semibold text-base">
              Register as a Volunteer Lawyer
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}