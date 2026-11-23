"use client";

import React, { useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useProfessional } from "@/hooks/useProfessionals";
import { useCreateLead } from "@/hooks/useLeads";
import { useProfileGate } from "@/hooks/useProfileGate";
import { useAuth } from "@/context/AuthContext";
import ReviewSection from "@/components/ReviewSection";
import { Badge } from "@/components/ui/Badge";
import { ProfessionalCardSkeleton } from "@/components/ui/Skeleton";
import { PLATFORM_FEE_AMOUNT } from "@/lib/api";

const MAX_ENQUIRY_LENGTH = 500;

function ProfessionalDetailContent() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { requireAccess, GateModal } = useProfileGate();
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [enquiryMsg, setEnquiryMsg] = useState("");
  const [enquiryStatus, setEnquiryStatus] = useState<"idle" | "sending" | "sent" | "error" | "verification_required">("idle");

  const { data: professional, isLoading, error } = useProfessional(id as string, !!id);
  const createLeadMutation = useCreateLead();

  const handleSubmitEnquiry = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!enquiryMsg.trim()) return;

    setEnquiryStatus("sending");
    try {
      await createLeadMutation.mutateAsync({
        lawyerId: id as string,
        enquiryMessage: enquiryMsg,
        clientName: `${user.firstName} ${user.lastName}`,
        clientEmail: user.email,
        clientPhone: user.phone,
      });
      setEnquiryStatus("sent");
      setEnquiryMsg("");
      setTimeout(() => setShowEnquiry(false), 2000);
    } catch (err: any) {
      if (err.message?.includes('VERIFICATION_REQUIRED')) {
        setEnquiryStatus("verification_required");
      } else {
        setEnquiryStatus("error");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <ProfessionalCardSkeleton />
      </div>
    );
  }

  if (error || !professional) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center py-20 bg-white rounded-xl border border-[#E5EAF0]">
          <p className="text-[#EF4444] font-semibold">{error?.message || "Professional not found"}</p>
          <Link
            href="/professionals"
            className="mt-4 inline-block text-[#00A6A6] font-semibold hover:underline"
          >
            ← Back to Professionals
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid md:grid-cols-3 gap-8">
        {/* Left - Profile */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl border border-[#E5EAF0] p-8">
            <div className="flex items-start space-x-6">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-[#1B2A4A] flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                {professional.photo ? (
                  <img src={professional.photo} alt={professional.userId?.firstName} className="w-full h-full object-cover" />
                ) : (
                  <span>{professional.userId?.firstName?.[0]}{professional.userId?.lastName?.[0]}</span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-[#1B2A4A]">{professional.userId?.firstName} {professional.userId?.lastName}</h1>
                  {professional.verificationBadge && (
                    <Badge variant="success" dot>
                      Verified
                    </Badge>
                  )}
                  {professional.category && (
                    <Badge variant="info">
                      {professional.category.label}
                    </Badge>
                  )}
                </div>
                <p className="text-[#667085] mt-1">{professional.city}, {professional.state}</p>
                <div className="flex items-center mt-2">
                  <span className="text-[#F59E0B] text-lg">★</span>
                  <span className="ml-1 text-lg font-semibold text-[#1B2A4A]">{professional.rating?.toFixed(1)}</span>
                  <span className="ml-2 text-[#94A3B8]">({professional.reviewCount} reviews)</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {(professional.practiceAreas || professional.specializations || [])?.map((area: string) => (
                    <span key={area} className="bg-[#EEF2F7] text-[#1B2A4A] px-3 py-1.5 rounded-lg text-sm font-medium">{area}</span>
                  ))}
                </div>
              </div>
            </div>
            <hr className="my-6 border-[#E5EAF0]" />
            <div>
              <h2 className="text-xl font-semibold text-[#1B2A4A] mb-3">About</h2>
              <p className="text-[#475569] leading-relaxed">{professional.bio || "No biography provided."}</p>
            </div>
            <div className="mt-8">
              <hr className="mb-6 border-[#E5EAF0]" />
              <ReviewSection lawyerId={id as string} reviews={[]} setReviews={() => {}} loading={false} />
            </div>
            <div className="grid grid-cols-2 gap-6 mt-8">
              <div>
                <h3 className="text-sm font-semibold text-[#667085] uppercase mb-2">Registration Info</h3>
                <p className="text-[#475569]">License: {String(professional.categoryData?.licenseNumber || professional.categoryData?.barNumber || professional.categoryData?.taxIdNumber || "N/A")}</p>
                {professional.categoryData?.certifyingBody && <p className="text-[#475569]">Certifying Body: {String(professional.categoryData.certifyingBody)}</p>}
                {professional.categoryData?.stateOfCall && <p className="text-[#475569]">State: {String(professional.categoryData.stateOfCall)}</p>}
                <p className="text-[#475569]">Experience: {professional.yearsOfExperience} years</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#667085] uppercase mb-2">Languages</h3>
                <p className="text-[#475569]">{professional.languages?.join(", ") || "Not specified"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right - Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#E5EAF0] p-6">
            <h3 className="font-semibold text-lg text-[#1B2A4A] mb-4">Contact</h3>
            <p className="text-[#667085] mb-4">📍 {professional.officeAddress || `${professional.city}, ${professional.state}`}</p>
            {professional.consultationFee && professional.consultationFee > 0 && (
              <p className="text-lg font-semibold text-[#1B2A4A] mb-4">₦{professional.consultationFee.toLocaleString()} / consultation</p>
            )}
            <button
              onClick={() => {
                if (!user) {
                  router.push("/login?redirect=" + encodeURIComponent(`/professionals/${id}`));
                  return;
                }
                router.push(`/book/${id}`);
              }}
              className="w-full bg-[#1B2A4A] text-white py-3 rounded-lg hover:bg-[#16213A] transition-colors font-semibold text-sm"
            >
              Book a Consultation
            </button>
          </div>
          <div className="bg-white rounded-xl border border-[#E5EAF0] p-6">
            <h3 className="font-semibold text-lg text-[#1B2A4A] mb-4">Availability</h3>
            <p className="text-[#475569]">
              {professional.isAvailable ? (
                <span className="text-[#5DBB63] font-medium">✓ Available for consultations</span>
              ) : (
                <span className="text-[#EF4444]">Currently unavailable</span>
              )}
            </p>
            {professional.availableDays?.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-[#667085]">Available days: {professional.availableDays.join(", ")}</p>
                <p className="text-sm text-[#667085]">Hours: {professional.availableHours || `${professional.availableFrom} - ${professional.availableTo}`}</p>
              </div>
            )}
          </div>
          {professional.subscription?.status === "active" && (
            <div className="bg-[#00A6A6]/5 border border-[#00A6A6]/20 rounded-xl p-4">
              <p className="text-[#1B2A4A] font-semibold text-sm uppercase">{professional.subscription.plan} Member</p>
              <p className="text-[#667085] text-sm mt-1">This professional has an active Advisora Connect subscription.</p>
            </div>
          )}
        </div>
      </div>

      {showEnquiry && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl animate-fadeIn">
            <h3 className="text-xl font-semibold text-[#1B2A4A] mb-4">Send Enquiry</h3>
            {enquiryStatus === "sent" ? (
              <div className="bg-[#ECFDF5] text-[#166534] p-4 rounded-lg text-center">✓ Enquiry sent successfully! The professional will be notified.</div>
            ) : (
              <>
                <textarea
                  placeholder="Describe your legal issue or what you need help with... (Max 500 characters)"
                  value={enquiryMsg}
                  onChange={(e) => setEnquiryMsg(e.target.value.slice(0, MAX_ENQUIRY_LENGTH))}
                  rows={5}
                  maxLength={MAX_ENQUIRY_LENGTH}
                  className="w-full px-4 py-3 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm"
                />
                <p className="text-xs text-[#94A3B8] mt-1 text-right">{enquiryMsg.length}/{MAX_ENQUIRY_LENGTH}</p>
                {enquiryStatus === "error" && <p className="text-[#EF4444] text-sm mt-2">Failed to send. Please try again.</p>}
                {enquiryStatus === "verification_required" && (
                  <div className="bg-[#FFFBEB] text-[#92400E] p-3 rounded-lg text-sm">
                    Please verify your email before sending an enquiry.
                    <div className="mt-2"><button onClick={() => router.push('/resend-verification')} className="text-[#1B2A4A] font-semibold underline">Verify Now</button></div>
                  </div>
                )}
                <p className="text-xs text-[#667085] mt-2">Your first enquiry per matter is free. Additional enquiries to the same professional incur a ₦{PLATFORM_FEE_AMOUNT.toLocaleString()} platform fee.</p>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setShowEnquiry(false)} className="flex-1 px-4 py-2.5 border border-[#E5EAF0] rounded-lg text-[#475569] hover:bg-[#F5F7FA] text-sm font-medium">Cancel</button>
                  <button onClick={handleSubmitEnquiry} disabled={!enquiryMsg.trim() || enquiryStatus === "sending" || createLeadMutation.isPending}
                    className="flex-1 bg-[#1B2A4A] text-white px-4 py-2.5 rounded-lg hover:bg-[#16213A] disabled:opacity-50 text-sm font-semibold">
                    {enquiryStatus === "sending" || createLeadMutation.isPending ? "Sending..." : "Send Enquiry"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {GateModal}
    </div>
  );
}

export default function ProfessionalDetailPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 sm:px-6 py-8"><ProfessionalCardSkeleton /></div>}>
      <ProfessionalDetailContent />
    </Suspense>
  );
}