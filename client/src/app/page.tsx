'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useProfileGate } from '@/hooks/useProfileGate';

const HERO_IMAGE = '/Hero-section.jpg';

const benefits = [
  { title: 'Verified Lawyers', desc: 'Every lawyer on our platform undergoes a thorough verification process including license confirmation and professional standing checks.', icon: '✅' },
  { title: 'Easy Access to Legal Expertise', desc: 'Find the right lawyer for your needs quickly and easily, without relying on limited personal recommendations.', icon: '⚡' },
  { title: 'Transparent Professional Profiles', desc: 'View detailed profiles including practice areas, qualifications, ratings, and reviews before making a decision.', icon: '📋' },
  { title: 'Convenient Consultations', desc: 'Schedule consultations at your convenience and communicate securely through our platform.', icon: '📅' },
  { title: 'Trusted Legal Solutions', desc: 'Access quality legal expertise across a wide range of practice areas, from business law to family matters.', icon: '🛡️' },
];

const steps = [
  { step: '01', title: 'Search for a Lawyer', desc: 'Browse our directory by practice area, location, or expertise to find legal professionals that match your needs.' },
  { step: '02', title: 'Review Lawyer Profiles', desc: 'Read detailed profiles, verify credentials, check ratings, and compare lawyers before reaching out.' },
  { step: '03', title: 'Connect and Get Legal Support', desc: 'Send an enquiry, schedule a consultation, and get the legal guidance you need from a trusted professional.' },
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
                Connect with individuals and businesses seeking legal services
              </h1>
              <p className="mt-6 text-lg md:text-xl text-white/70 leading-relaxed">
                Need legal guidance? Advisora connects individuals and businesses with trusted and verified lawyers, making it easier to access quality legal expertise when you need it.
              </p>
              <p className="mt-4 text-white/50 text-base leading-relaxed">
                Whether you need support with business matters, contracts, property transactions, employment issues, family matters, compliance, or legal advisory services, Advisora helps you find the right legal professional.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link href="/lawyers" className="inline-block bg-[#00A6A6] text-white px-8 py-3.5 rounded-lg hover:bg-[#008F8F] transition-colors font-semibold text-base shadow-lg shadow-[#00A6A6]/20 text-center">
                  Find a Lawyer
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
                  <img src={HERO_IMAGE} alt="Trusted Legal Professionals" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-[#00A6A6]/20 rounded-full blur-xl"></div>
                <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Pro Bono Initiative */}
<section className="py-24 bg-[#F5F7FA]">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center mb-16">
      <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold text-[#1B2A4A] leading-tight tracking-tight">ADVISORA IMPACT</h2>
      <p className="mt-6 text-lg md:text-xl text-[#475569] leading-relaxed">Free Legal Assistance for Those Who Need It Most</p>
      <p className="mt-4 text-base text-[#667085] leading-relaxed">Advisora Impact is the pro bono and access-to-justice initiative of Advisora Connect Africa. It provides eligible individuals who cannot reasonably afford legal services with access to free, limited-scope legal assistance through our network of volunteer legal professionals.</p>
    </div>

    <div className="mb-16">
      <h3 className="text-2xl md:text-3xl font-bold text-[#1B2A4A] mb-6">What Legal Assistance Do We Provide?</h3>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3"><span className="w-6 h-6 rounded-[#1B2A4A] flex items-center justify-center text-white text-lg font-bold">1</span><div><h4 className="font-semibold text-[#1B2A4A]">Free Initial Legal Consultation</h4><p className="text-[#667085] text-sm">A one-off consultation to understand your legal problem, explain your rights and discuss available options and next steps.</p></div></div>
          <div className="flex items-start gap-3"><span className="w-6 h-6 rounded-[#1B2A4A] flex items-center justify-center text-white text-lg font-bold">2</span><div><h4 className="font-semibold text-[#1B2A4A]">Legal Advice and Guidance</h4><p className="text-[#667085] text-sm">Practical legal guidance on specific issues, including your rights, obligations, remedies and available legal processes.</p></div></div>
          <div className="flex items-start gap-3"><span className="w-6 h-6 rounded-[#1B2A4A] flex items-center justify-center text-white text-lg font-bold">3</span><div><h4 className="font-semibold text-[#1B2A4A]">Legal Document Review</h4><p className="text-[#667085] text-sm">Review of relevant legal documents and explanation of their legal implications.</p></div></div>
        </div>
        <div className="space-y-4">
          <div className="flex items-start gap-3"><span className="w-6 h-6 rounded-[#1B2A4A] flex items-center justify-center text-white text-lg font-bold">4</span><div><h4 className="font-semibold text-[#1B2A4A]">Basic Legal Document Preparation</h4><p className="text-[#667085] text-sm">Assistance with selected legal letters, complaints, responses and other agreed documents.</p></div></div>
          <div className="flex items-start gap-3"><span className="w-6 h-6 rounded-[#1B2A4A] flex items-center justify-center text-white text-lg font-bold">5</span><div><h4 className="font-semibold text-[#1B2A4A]">Limited-Scope Representation</h4><p className="text-[#667085] text-sm">In selected cases, a volunteer lawyer may agree to assist with negotiations, mediation, meetings or court proceedings.</p></div></div>
        </div>
      </div>

      <div className="mb-16"><h3 className="text-2xl md:text-3xl font-bold text-[#1B2A4A] mb-6">Our Priority Areas</h3><div className="grid md:grid-cols-2 gap-8"><div><h4 className="text-xl font-semibold text-[#1B2A4A] mb-4">Women and Children</h4><ul className="space-y-3 text-[#667085]"><li>Domestic violence and abuse.</li><li>Sexual abuse, harassment and exploitation.</li><li>Child abuse, neglect and safeguarding.</li><li>Child custody, maintenance and welfare matters involving genuine vulnerability or hardship.</li><li>Protection of the rights of women and children.</li></ul></div><div><h4 className="text-xl font-semibold text-[#1B2A4A] mb-4">Exceptional Hardship</h4><ul className="space-y-3 text-[#667085]"><li>Individuals facing exceptional hardship or urgent violations of their legal rights.</li></ul></div></div></div>

      <div className="mb-16"><h3 className="text-2xl md:text-3xl font-bold text-[#1B2A4A] mb-6">How Much Will It Cost?</h3><p className="text-[#667085] text-lg mb-6">Approved assistance under Advisora Impact will be provided without professional fees to the eligible applicant, within the scope agreed for that assignment.</p><p className="text-[#667085] text-sm">However, any external expenses, statutory charges, filing fees, transport, expert fees or other disbursements must be disclosed and agreed in advance. Advisora Impact does not automatically undertake to fund these expenses.</p></div>

      <div className="mb-16"><h3 className="text-2xl md:text-3xl font-bold text-[#1B2A4A] mb-6">How Do I Apply?</h3><p className="text-[#667085] text-lg mb-6">Complete our Pro Bono Support Application Form and provide sufficient information about your circumstances and the legal assistance you require.</p><p className="text-[#667085] text-sm">Every application will be assessed individually, taking into account financial circumstances, urgency, vulnerability, the nature and merits of the legal issue, and the availability of an appropriate volunteer lawyer.</p><p className="text-[#667085] text-sm">Approval for an initial consultation does not automatically guarantee further legal assistance or full representation.</p></div>
    </div>
  </div>
</section>

      {/* For Lawyers */}
      <div>
      </div>

      <div className="mt-16 pt-16 border-t border-[#E5EAF0]">
        <div className="flex flex-col sm:flex-row gap-4">
        </div>
      </div>

      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1B2A4A] tracking-tight">Why Advisora?</h2>
            <p className="text-[#667085] mt-3 max-w-2xl mx-auto text-lg">We make it simple to find and connect with trusted legal professionals across Africa.</p>
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
            <p className="text-[#667085] mt-3 max-w-2xl mx-auto text-lg">Getting legal help has never been easier. Follow these simple steps.</p>
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

      

      
      






      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-[#1B2A4A] tracking-tight">Featured Lawyers</h2>
                <p className="text-[#667085] mt-2">Top-rated legal professionals on Advisora Connect</p>
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
      {GateModal}
    </div>
  );
}
