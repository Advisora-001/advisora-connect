"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

export default function ProBonoInitiativePage() {
  const { user } = useAuth();
  const [activeModal, setActiveModal] = useState<"apply" | "volunteer" | null>(null);

  // Application form state
  const [applyForm, setApplyForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    category: "women-children",
    urgency: "moderate",
    description: "",
    financialHardshipNote: "",
  });
  const [applyStatus, setApplyStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  // Volunteer form state
  const [volunteerForm, setVolunteerForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    profession: "lawyer",
    barNumber: "",
    practiceAreas: "",
    contributionType: "periodic-hours",
    availabilityNote: "",
  });
  const [volunteerStatus, setVolunteerStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyStatus("submitting");

    try {
      await api.submitProBonoApplication({
        fullName: applyForm.fullName,
        email: applyForm.email,
        phone: applyForm.phone,
        category: applyForm.category,
        urgency: applyForm.urgency,
        description: applyForm.description,
        financialHardshipNote: applyForm.financialHardshipNote,
      });
      setApplyStatus("success");
    } catch (error) {
      setApplyStatus("error");
      console.error("Pro bono application submission failed", error);
    }
  };

  const handleVolunteerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVolunteerStatus("submitting");

    try {
      await api.submitProBonoVolunteer({
        fullName: volunteerForm.fullName,
        email: volunteerForm.email,
        phone: volunteerForm.phone,
        profession: volunteerForm.profession,
        barNumber: volunteerForm.barNumber,
        practiceAreas: volunteerForm.practiceAreas,
        contributionType: volunteerForm.contributionType,
        availabilityNote: volunteerForm.availabilityNote,
      });
      setVolunteerStatus("success");
    } catch (error) {
      setVolunteerStatus("error");
      console.error("Pro bono volunteer registration failed", error);
    }
  };

  return (
    <div className="bg-[#F5F7FA] min-h-screen text-[#1B2A4A]">
      {/* Hero Section */}
      <section className="bg-[#1B2A4A] text-white py-16 md:py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center md:text-left">
          <div className="inline-block bg-[#00A6A6]/20 text-[#00A6A6] font-semibold text-xs md:text-sm px-4 py-1.5 rounded-full mb-4 tracking-wider uppercase">
            Advisora Impact
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            PRO BONO INITIATIVE
          </h1>
          <p className="text-lg md:text-2xl text-[#00A6A6] font-semibold mt-3">
            Access to Justice. Professionalism. Making a Difference.
          </p>
          <p className="text-white/80 max-w-3xl mt-4 text-base md:text-lg leading-relaxed">
            Legal Support When It Matters Most. Connecting eligible individuals facing hardship with qualified legal professionals dedicated to giving back.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <button
              onClick={() => setActiveModal("apply")}
              className="bg-[#00A6A6] hover:bg-[#008F8F] text-white px-8 py-3.5 rounded-lg font-bold text-base shadow-lg transition-all text-center"
            >
              Apply for Pro Bono Support
            </button>
            <button
              onClick={() => setActiveModal("volunteer")}
              className="bg-white hover:bg-gray-100 text-[#1B2A4A] px-8 py-3.5 rounded-lg font-bold text-base transition-all text-center"
            >
              Become a Pro Bono Volunteer
            </button>
          </div>
        </div>
        <div className="absolute -bottom-10 -right-10 w-96 h-96 bg-[#00A6A6]/10 rounded-full blur-3xl pointer-events-none"></div>
      </section>

      {/* Philosophy & Purpose */}
      <section className="py-16 bg-white border-b border-[#E5EAF0]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="prose prose-lg text-[#475569] leading-relaxed max-w-none space-y-6">
            <p className="text-lg md:text-xl font-medium text-[#1B2A4A] leading-relaxed">
              At Advisora Connect, we believe that access to justice should not be determined solely by one&apos;s financial circumstances.
            </p>
            <p>
              We recognise that there are individuals and families who find themselves in difficult, vulnerable or desperate situations and are unable to afford the legal assistance they need. We also recognise that, in certain circumstances, timely legal intervention can make a significant difference to the protection of an individual&apos;s rights, dignity, safety and future.
            </p>
            <p>
              <strong>Advisora Impact</strong> is our pro bono initiative, created to bridge this gap by connecting eligible individuals who need legal assistance with qualified legal professionals who are willing to contribute their time, knowledge and expertise in service to others.
            </p>
            <p>
              We believe that professional expertise carries a responsibility beyond commercial engagements. Through Advisora Impact, we seek to encourage a culture of professional generosity, social responsibility and meaningful contribution to society.
            </p>
          </div>
        </div>
      </section>

      {/* Who We Seek to Support */}
      <section className="py-16 md:py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1B2A4A]">WHO WE SEEK TO SUPPORT</h2>
          <p className="text-[#667085] mt-3 text-lg max-w-2xl mx-auto">
            Our initial focus is on two categories of individuals and circumstances where access to legal assistance may be particularly critical.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Category 1 */}
          <div className="bg-white rounded-2xl p-8 border border-[#E5EAF0] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 bg-[#EFF6FF] text-[#1E40AF] rounded-xl flex items-center justify-center text-2xl font-bold mb-6">
                1
              </div>
              <h3 className="text-2xl font-bold text-[#1B2A4A] mb-4">
                Women and Children in Vulnerable Situations
              </h3>
              <p className="text-[#667085] text-base mb-6 leading-relaxed">
                We seek to facilitate legal assistance for women and children facing abuse, exploitation, neglect, violence or other circumstances that threaten their safety, dignity, welfare and fundamental rights.
              </p>
              <h4 className="font-semibold text-[#1B2A4A] text-sm uppercase tracking-wider mb-3">This may include:</h4>
              <ul className="space-y-2.5 text-[#475569] text-sm">
                <li className="flex items-start gap-2.5">
                  <span className="text-[#00A6A6] font-bold">✓</span> Children experiencing abuse, neglect or exploitation.
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#00A6A6] font-bold">✓</span> Women experiencing domestic violence or other forms of abuse.
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#00A6A6] font-bold">✓</span> Sexual abuse and exploitation cases.
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#00A6A6] font-bold">✓</span> Child protection and safeguarding matters.
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#00A6A6] font-bold">✓</span> Matters involving the protection of children&apos;s welfare and rights.
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#00A6A6] font-bold">✓</span> Other qualifying legal issues affecting vulnerable women and children.
                </li>
              </ul>
            </div>
            <div className="mt-8 pt-6 border-t border-[#E5EAF0]">
              <button
                onClick={() => {
                  setApplyForm((prev) => ({ ...prev, category: "women-children" }));
                  setActiveModal("apply");
                }}
                className="w-full bg-[#1B2A4A] hover:bg-[#16213A] text-white py-3 rounded-xl font-semibold text-sm transition-colors text-center"
              >
                Apply for Vulnerable Support
              </button>
            </div>
          </div>

          {/* Category 2 */}
          <div className="bg-white rounded-2xl p-8 border border-[#E5EAF0] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 bg-[#FEF3C7] text-[#D97706] rounded-xl flex items-center justify-center text-2xl font-bold mb-6">
                2
              </div>
              <h3 className="text-2xl font-bold text-[#1B2A4A] mb-4">
                Individuals Facing Exceptional Hardship
              </h3>
              <p className="text-[#667085] text-base mb-6 leading-relaxed">
                We recognise that some legal situations arise unexpectedly and may have serious consequences for individuals who cannot afford professional assistance.
              </p>
              <h4 className="font-semibold text-[#1B2A4A] text-sm uppercase tracking-wider mb-3">Advisora Impact may consider:</h4>
              <ul className="space-y-2.5 text-[#475569] text-sm">
                <li className="flex items-start gap-2.5">
                  <span className="text-[#D97706] font-bold">✓</span> Urgent fundamental human rights concerns.
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#D97706] font-bold">✓</span> Imminent threats to liberty or personal safety.
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#D97706] font-bold">✓</span> Serious exploitation or abuse.
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#D97706] font-bold">✓</span> Urgent housing or eviction-related matters.
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#D97706] font-bold">✓</span> Other exceptional circumstances where access to legal assistance is critical.
                </li>
              </ul>
              <p className="text-xs text-[#94A3B8] italic mt-6">
                * Each application is evaluated on individual circumstances, urgency, financial need, legal merit, and volunteer availability.
              </p>
            </div>
            <div className="mt-8 pt-6 border-t border-[#E5EAF0]">
              <button
                onClick={() => {
                  setApplyForm((prev) => ({ ...prev, category: "exceptional-hardship" }));
                  setActiveModal("apply");
                }}
                className="w-full bg-[#1B2A4A] hover:bg-[#16213A] text-white py-3 rounded-xl font-semibold text-sm transition-colors text-center"
              >
                Apply for Exceptional Hardship Support
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-20 bg-white border-y border-[#E5EAF0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1B2A4A]">HOW IT WORKS</h2>
            <p className="text-[#667085] mt-3 text-lg">
              We have designed a simple, transparent process to help eligible individuals access assistance.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-6">
            {[
              {
                step: "01",
                title: "Submit Application",
                desc: "Complete the Pro Bono Support Application Form with your circumstances and legal assistance details.",
              },
              {
                step: "02",
                title: "Application Review",
                desc: "Our designated team assesses the application for eligibility, urgency, and nature of assistance.",
              },
              {
                step: "03",
                title: "Professional Matching",
                desc: "Where qualified, we endeavor to connect you with a volunteer lawyer aligned with your matter.",
              },
              {
                step: "04",
                title: "Acceptance & Scope",
                desc: "The lawyer performs conflict checks, reviews legal merit, and agrees on the assistance scope.",
              },
              {
                step: "05",
                title: "Follow-up & Support",
                desc: "We monitor the referral process to ensure effective communication and impact reporting.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-[#F5F7FA] p-6 rounded-2xl border border-[#E5EAF0] flex flex-col justify-between"
              >
                <div>
                  <span className="text-[#00A6A6] font-extrabold text-2xl mb-3 block">{item.step}</span>
                  <h3 className="font-bold text-[#1B2A4A] text-lg mb-2">{item.title}</h3>
                  <p className="text-[#667085] text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* To Our Legal Professionals */}
      <section className="py-16 md:py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-[#1B2A4A] text-white rounded-3xl p-8 md:p-14 relative overflow-hidden">
          <div className="max-w-3xl relative z-10">
            <span className="text-[#00A6A6] font-semibold text-sm tracking-widest uppercase block mb-2">
              To Our Legal & Professional Network
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              GIVE BACK. MAKE A DIFFERENCE.
            </h2>
            <p className="text-white/80 text-base md:text-lg mb-6 leading-relaxed">
              We invite lawyers and qualified professionals to become part of the Advisora Impact volunteer network. Your expertise, experience and time could make a meaningful difference in someone&apos;s life.
            </p>

            <p className="text-white/70 text-sm mb-6">
              We recognise that legal professionals have demanding schedules. We therefore encourage lawyers to contribute in ways that are manageable and consistent with their professional commitments.
            </p>

            <h3 className="text-white font-bold text-base uppercase tracking-wider mb-4">Ways You May Choose to Contribute:</h3>
            <div className="grid sm:grid-cols-2 gap-3 mb-8 text-sm text-white/90">
              <div className="flex items-center gap-2">
                <span className="text-[#00A6A6] font-bold">✓</span> Volunteer a few hours periodically.
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#00A6A6] font-bold">✓</span> Offer an initial pro bono consultation.
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#00A6A6] font-bold">✓</span> Assist with a specific category of legal matters.
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#00A6A6] font-bold">✓</span> Provide legal research or advisory support.
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#00A6A6] font-bold">✓</span> Accept selected cases in your area of expertise.
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#00A6A6] font-bold">✓</span> Provide representation where mutually agreed.
              </div>
            </div>

            <p className="text-xs text-white/60 mb-8 leading-relaxed">
              * You are not required to accept every matter referred to you. All participation is voluntary and subject to your availability, professional obligations and appropriate conflict checks.
            </p>

            <button
              onClick={() => setActiveModal("volunteer")}
              className="bg-[#00A6A6] hover:bg-[#008F8F] text-white px-8 py-3.5 rounded-xl font-bold text-base shadow-lg transition-all"
            >
              Register as a Pro Bono Volunteer
            </button>
          </div>
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#00A6A6]/10 rounded-full blur-3xl pointer-events-none"></div>
        </div>
      </section>

      {/* Our Commitment & Disclaimer */}
      <section className="py-12 bg-white border-t border-[#E5EAF0]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-[#FFFBEB] border border-[#FCD34D] rounded-2xl p-6 md:p-8">
            <h3 className="font-bold text-[#92400E] text-lg mb-3 flex items-center gap-2">
              <span>🛡️</span> OUR COMMITMENT & IMPORTANT NOTICE
            </h3>
            <p className="text-[#78350F] text-sm leading-relaxed mb-4">
              Advisora Impact is committed to promoting access to justice while respecting the dignity, privacy and confidentiality of every applicant. We will endeavour to ensure that applications are handled sensitively, that eligible matters are appropriately assessed and that volunteer professionals are matched responsibly.
            </p>
            <p className="text-[#78350F] text-xs leading-relaxed font-semibold">
              * Submitting an application does not guarantee legal representation or assistance. All applications are subject to assessment, eligibility requirements and the availability of suitable volunteer professionals. Where a person is in immediate danger, they should contact the appropriate emergency or safeguarding authorities immediately.
            </p>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-16 text-center max-w-4xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-extrabold text-[#1B2A4A] mb-4">
          MAKE YOUR EXPERTISE COUNT.
        </h2>
        <p className="text-[#667085] text-lg mb-4">
          A legal challenge should not automatically become an insurmountable barrier because someone cannot afford professional assistance.
        </p>
        <p className="text-[#00A6A6] font-bold text-xl mb-8">
          Together, we can help make access to justice more meaningful.
        </p>
        <p className="text-xs text-[#94A3B8] uppercase tracking-widest font-semibold mb-8">
          Advisora Impact — Because expertise should also make a difference.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => setActiveModal("apply")}
            className="bg-[#1B2A4A] hover:bg-[#16213A] text-white px-8 py-3.5 rounded-xl font-bold text-base shadow-md transition-all"
          >
            Apply for Pro Bono Support
          </button>
          <button
            onClick={() => setActiveModal("volunteer")}
            className="bg-[#00A6A6] hover:bg-[#008F8F] text-white px-8 py-3.5 rounded-xl font-bold text-base shadow-md transition-all"
          >
            Become a Pro Bono Volunteer
          </button>
        </div>
      </section>

      {/* Application Modal */}
      {activeModal === "apply" && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative my-8">
            <button
              onClick={() => {
                setActiveModal(null);
                setApplyStatus("idle");
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-xl"
            >
              ✕
            </button>
            <h3 className="text-2xl font-bold text-[#1B2A4A] mb-2">Pro Bono Support Application</h3>
            <p className="text-xs text-[#667085] mb-6">
              Please complete this form to apply for legal assistance through Advisora Impact.
            </p>

            {applyStatus === "success" ? (
              <div className="bg-[#ECFDF5] text-[#166534] p-6 rounded-xl text-center space-y-3">
                <span className="text-4xl block">✓</span>
                <h4 className="font-bold text-lg">Application Submitted</h4>
                <p className="text-sm">
                  Thank you. Your application has been received by the Advisora Impact team for review. We will contact you via email or phone regarding the next steps.
                </p>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    setApplyStatus("idle");
                  }}
                  className="bg-[#166534] text-white px-6 py-2 rounded-lg text-sm font-semibold mt-4"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1B2A4A] uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={applyForm.fullName}
                    onChange={(e) => setApplyForm({ ...applyForm, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#E5EAF0] rounded-lg text-sm focus:outline-none focus:border-[#00A6A6]"
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1B2A4A] uppercase mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={applyForm.email}
                      onChange={(e) => setApplyForm({ ...applyForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-[#E5EAF0] rounded-lg text-sm focus:outline-none focus:border-[#00A6A6]"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1B2A4A] uppercase mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={applyForm.phone}
                      onChange={(e) => setApplyForm({ ...applyForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-[#E5EAF0] rounded-lg text-sm focus:outline-none focus:border-[#00A6A6]"
                      placeholder="+234..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1B2A4A] uppercase mb-1">Category of Need *</label>
                  <select
                    value={applyForm.category}
                    onChange={(e) => setApplyForm({ ...applyForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#E5EAF0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#00A6A6]"
                  >
                    <option value="women-children">Women & Children in Vulnerable Situations</option>
                    <option value="exceptional-hardship">Exceptional Hardship / Desperate Circumstances</option>
                    <option value="other">Other Qualifying Pro Bono Matter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1B2A4A] uppercase mb-1">Summary of Legal Situation *</label>
                  <textarea
                    required
                    rows={4}
                    value={applyForm.description}
                    onChange={(e) => setApplyForm({ ...applyForm, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#E5EAF0] rounded-lg text-sm focus:outline-none focus:border-[#00A6A6]"
                    placeholder="Briefly describe what legal issue you are facing and what assistance you require..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1B2A4A] uppercase mb-1">Financial Hardship Note</label>
                  <input
                    type="text"
                    value={applyForm.financialHardshipNote}
                    onChange={(e) => setApplyForm({ ...applyForm, financialHardshipNote: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#E5EAF0] rounded-lg text-sm focus:outline-none focus:border-[#00A6A6]"
                    placeholder="Indicate your inability to afford commercial legal rates..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={applyStatus === "submitting"}
                  className="w-full bg-[#1B2A4A] text-white py-3 rounded-lg font-bold text-sm hover:bg-[#16213A] transition-colors disabled:opacity-50 mt-4"
                >
                  {applyStatus === "submitting" ? "Submitting Application..." : "Submit Application"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Volunteer Modal */}
      {activeModal === "volunteer" && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative my-8">
            <button
              onClick={() => {
                setActiveModal(null);
                setVolunteerStatus("idle");
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-xl"
            >
              ✕
            </button>
            <h3 className="text-2xl font-bold text-[#1B2A4A] mb-2">Register as a Pro Bono Volunteer</h3>
            <p className="text-xs text-[#667085] mb-6">
              Join the Advisora Impact network and contribute your professional expertise.
            </p>

            {volunteerStatus === "success" ? (
              <div className="bg-[#ECFDF5] text-[#166534] p-6 rounded-xl text-center space-y-3">
                <span className="text-4xl block">🎉</span>
                <h4 className="font-bold text-lg">Thank You for Volunteering</h4>
                <p className="text-sm">
                  We are grateful for your commitment to access to justice. Your volunteer profile has been recorded, and our team will get in touch when matching opportunities arise.
                </p>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    setVolunteerStatus("idle");
                  }}
                  className="bg-[#166534] text-white px-6 py-2 rounded-lg text-sm font-semibold mt-4"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleVolunteerSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1B2A4A] uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={volunteerForm.fullName}
                    onChange={(e) => setVolunteerForm({ ...volunteerForm, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#E5EAF0] rounded-lg text-sm focus:outline-none focus:border-[#00A6A6]"
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1B2A4A] uppercase mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={volunteerForm.email}
                      onChange={(e) => setVolunteerForm({ ...volunteerForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-[#E5EAF0] rounded-lg text-sm focus:outline-none focus:border-[#00A6A6]"
                      placeholder="you@firm.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1B2A4A] uppercase mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={volunteerForm.phone}
                      onChange={(e) => setVolunteerForm({ ...volunteerForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-[#E5EAF0] rounded-lg text-sm focus:outline-none focus:border-[#00A6A6]"
                      placeholder="+234..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1B2A4A] uppercase mb-1">Profession *</label>
                    <select
                      value={volunteerForm.profession}
                      onChange={(e) => setVolunteerForm({ ...volunteerForm, profession: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-[#E5EAF0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#00A6A6]"
                    >
                      <option value="lawyer">Lawyer / Legal Practitioner</option>
                      <option value="accountant">Accountant</option>
                      <option value="tax">Tax Consultant</option>
                      <option value="other">Other Professional</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1B2A4A] uppercase mb-1">Bar / Registration No.</label>
                    <input
                      type="text"
                      value={volunteerForm.barNumber}
                      onChange={(e) => setVolunteerForm({ ...volunteerForm, barNumber: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-[#E5EAF0] rounded-lg text-sm focus:outline-none focus:border-[#00A6A6]"
                      placeholder="SCN / Reg Number"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1B2A4A] uppercase mb-1">Practice / Specialization Areas</label>
                  <input
                    type="text"
                    value={volunteerForm.practiceAreas}
                    onChange={(e) => setVolunteerForm({ ...volunteerForm, practiceAreas: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#E5EAF0] rounded-lg text-sm focus:outline-none focus:border-[#00A6A6]"
                    placeholder="e.g., Family Law, Human Rights, Criminal Defence..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1B2A4A] uppercase mb-1">Preferred Contribution *</label>
                  <select
                    value={volunteerForm.contributionType}
                    onChange={(e) => setVolunteerForm({ ...volunteerForm, contributionType: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#E5EAF0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#00A6A6]"
                  >
                    <option value="periodic-hours">Volunteer a few hours periodically</option>
                    <option value="initial-consultation">Offer initial pro bono consultations</option>
                    <option value="advisory-research">Provide legal research or advisory support</option>
                    <option value="case-representation">Accept selected case representation</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={volunteerStatus === "submitting"}
                  className="w-full bg-[#00A6A6] text-white py-3 rounded-lg font-bold text-sm hover:bg-[#008F8F] transition-colors disabled:opacity-50 mt-4"
                >
                  {volunteerStatus === "submitting" ? "Registering..." : "Complete Volunteer Registration"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
