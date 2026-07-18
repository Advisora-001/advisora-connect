import React from 'react';
import Link from 'next/link';

const steps = [
  {
    step: '1',
    title: 'Search for a Lawyer',
    desc: 'Use our search tool to find lawyers by practice area, location, or name. Browse profiles to find the right fit for your legal needs.',
    icon: '🔍',
  },
  {
    step: '2',
    title: 'Compare Profiles',
    desc: 'Review lawyer profiles, check their verification status, read ratings, and see their areas of expertise. All lawyers are verified by our team.',
    icon: '📋',
  },
  {
    step: '3',
    title: 'Send an Enquiry',
    desc: 'Submit an enquiry describing your legal issue. The lawyer receives your request and you can start a conversation.',
    icon: '✉️',
  },
  {
    step: '4',
    title: 'Get Legal Support',
    desc: 'Schedule consultations, share documents securely, and get the legal help you need. Premium features include video consultations and document management.',
    icon: '⚖️',
  },
];

const forLawyers = [
  'Create a professional verified profile',
  'Receive client enquiries directly',
  'Access practice management tools',
  'Get discovered by clients searching for your expertise',
  'Choose from Basic, Professional, or Premium plans',
  'Pay only fixed lead fees for client contacts',
];

export default function HowItWorksPage() {
  return (
    <div>
      {/* Header */}
      <section className="bg-gradient-to-br from-[#1B2A4A] to-[#2a3f6a] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold">How Advisora Connect Works</h1>
          <p className="mt-4 text-xl text-gray-300 max-w-3xl mx-auto">
            We make it easy to find trusted legal professionals and get the support you need.
          </p>
        </div>
      </section>

      {/* Steps for Clients */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-[#1B2A4A] text-center mb-12">For Clients</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step) => (
              <div key={step.step} className="bg-white rounded-xl p-6 shadow-sm border text-center">
                <span className="text-4xl">{step.icon}</span>
                <div className="w-10 h-10 bg-[#1B2A4A] rounded-full flex items-center justify-center mx-auto mt-4 mb-3">
                  <span className="text-[#C5A55A] font-bold">{step.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-[#1B2A4A] mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/lawyers" className="inline-block bg-[#1B2A4A] text-white px-8 py-3 rounded-lg hover:bg-[#2a3f6a] font-semibold">
              Find a Lawyer Now
            </Link>
          </div>
        </div>
      </section>

      {/* For Lawyers */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-[#1B2A4A] mb-6">For Legal Professionals</h2>
              <p className="text-gray-600 mb-6">
                Grow your practice with Advisora Connect. Get discovered by clients, manage enquiries, and access tools to run your practice efficiently.
              </p>
              <ul className="space-y-3">
                {forLawyers.map((item, i) => (
                  <li key={i} className="flex items-start space-x-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex gap-4">
                <Link href="/register?role=lawyer" className="bg-[#1B2A4A] text-white px-6 py-3 rounded-lg hover:bg-[#2a3f6a] font-semibold">
                  Register as a Lawyer
                </Link>
                <Link href="/login" className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 font-semibold">
                  Sign In
                </Link>
              </div>
            </div>
            <div className="bg-[#1B2A4A]/5 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-[#1B2A4A] mb-4">Subscription Plans</h3>
              <div className="space-y-4">
                {['Basic — Professional online presence & discovery', 'Professional — Client acquisition & workflow tools', 'Premium — Complete digital practice management'].map((plan, i) => (
                  <div key={i} className="bg-white rounded-lg p-4 shadow-sm border">
                    <p className="font-medium text-[#1B2A4A]">{plan}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-4">
                All plans include a verified profile, search visibility, and client enquiry management.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-[#1B2A4A] text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              { q: 'Is Advisora Connect free for clients?', a: 'Yes! Creating an account and browsing lawyers is completely free. You only pay if you choose to book a paid consultation with a lawyer.' },
              { q: 'How are lawyers verified?', a: 'Every lawyer on Advisora Connect goes through a verification process where we confirm their bar membership, identity, and professional credentials.' },
              { q: 'How does the lead fee work?', a: 'When a client sends an enquiry, the lawyer pays a small fixed fee to access the client\'s contact details. This fee is transparent and not a percentage of any legal fees.' },
              { q: 'Can I switch my subscription plan?', a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.' },
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border">
                <h3 className="font-semibold text-[#1B2A4A] mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}