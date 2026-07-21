"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { PLATFORM_FEE_AMOUNT } from "@/lib/api";
import ReviewSection from "@/components/ReviewSection";
import { useAuth } from "@/context/AuthContext";

export default function LawyerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [lawyer, setLawyer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [enquiryMsg, setEnquiryMsg] = useState("");
  const [enquiryStatus, setEnquiryStatus] = useState("");
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const MAX_ENQUIRY_LENGTH = 500;

  useEffect(() => {
    api
      .getLawyerById(id as string)
      .then((data) => {
        setLawyer(data);
        setLoading(false);
      })
      .catch(() =;\n\n    // Fetch reviews\n    api.getLawyerReviews(id as string).then(data =      setReviews(data.reviews);\n      setReviewsLoading(false);\n    }).catch(() =;
  }, [id]);

  const handleSubmitEnquiry = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      setEnquiryStatus("sending");
      await api.createLead({
        lawyerId: id,
        enquiryMessage: enquiryMsg,
        clientName: `${user.firstName} ${user.lastName}`,
        clientEmail: user.email,
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

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-[#1B2A4A] border-t-transparent rounded-full mx-auto"></div>
      </div>
    );
  }

  if (!lawyer) {
    return (
      <div className="text-center py-20 text-gray-500">Lawyer not found</div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-3 gap-8">
        {/* Left - Profile */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <div className="flex items-start space-x-6">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-[#1B2A4A] flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                {lawyer.photo ? (
                  <img src={lawyer.photo} alt={lawyer.userId?.firstName} className="w-full h-full object-cover" />
                ) : (
                  <span>{lawyer.userId?.firstName?.[0]}{lawyer.userId?.lastName?.[0]}</span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-[#1B2A4A]">
                    {lawyer.userId?.firstName} {lawyer.userId?.lastName}
                  </h1>
                  {lawyer.verificationBadge && (
                    <span className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full font-medium">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <p className="text-gray-500 mt-1">
                  {lawyer.city}, {lawyer.state}
                </p>
                <div className="flex items-center mt-2">
                  <span className="text-yellow-500 text-lg">★</span>
                  <span className="ml-1 text-lg font-semibold">
                    {lawyer.rating?.toFixed(1)}
                  </span>
                  <span className="ml-2 text-gray-400">
                    ({lawyer.reviewCount} reviews)
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {lawyer.practiceAreas?.map((area: string) => (
                    <span
                      key={area}
                      className="bg-[#1B2A4A]/10 text-[#1B2A4A] px-3 py-1.5 rounded-lg text-sm font-medium"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <hr className="my-6" />

            {/* About */}
            <div>
              <h2 className="text-xl font-semibold text-[#1B2A4A] mb-3">
                About
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {lawyer.bio || "No biography provided."}
              </p>
            </div>

            {/* Reviews Section */}
            <div className="mt-8">
              <hr className="mb-6" />
              <ReviewSection 
                lawyerId={id as string} 
                reviews={reviews} 
                setReviews={setReviews}
                loading={reviewsLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-6 mt-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                  Bar Information
                </h3>
                <p className="text-gray-700">
                  Bar Number: {lawyer.barNumber || "N/A"}
                </p>
                <p className="text-gray-700">
                  Call: {lawyer.stateOfCall} ({lawyer.yearOfCall})
                </p>
                <p className="text-gray-700">
                  Experience: {lawyer.yearsOfExperience} years
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                  Languages
                </h3>
                <p className="text-gray-700">
                  {lawyer.languages?.join(", ") || "Not specified"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right - Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-semibold text-lg text-[#1B2A4A] mb-4">
              Contact
            </h3>
            <p className="text-gray-600 mb-2">
              📍 {lawyer.officeAddress || `${lawyer.city}, ${lawyer.state}`}
            </p>
            <p className="text-gray-600 mb-2">📧 {lawyer.userId?.email}</p>
            <p className="text-gray-600 mb-4">
              📞 {lawyer.userId?.phone || "Not provided"}
            </p>

            {lawyer.consultationFee > 0 && (
              <p className="text-lg font-semibold text-[#1B2A4A] mb-4">
                ₦{lawyer.consultationFee.toLocaleString()} / consultation
              </p>
            )}

            <button
              onClick={() => {
                if (!user) {
                  router.push("/login");
                  return;
                }
                setShowEnquiry(true);
              }}
              className="w-full bg-[#1B2A4A] text-white py-3 rounded-lg hover:bg-[#2a3f6a] transition-colors font-semibold"
            >
              Send Enquiry
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-semibold text-lg text-[#1B2A4A] mb-4">
              Availability
            </h3>
            <p className="text-gray-700">
              {lawyer.isAvailable ? (
                <span className="text-green-600 font-medium">
                  ✓ Available for consultations
                </span>
              ) : (
                <span className="text-red-500">Currently unavailable</span>
              )}
            </p>
            {lawyer.availableDays?.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-gray-500">
                  Available days: {lawyer.availableDays.join(", ")}
                </p>
                <p className="text-sm text-gray-500">
                  Hours: {lawyer.availableHours}
                </p>
              </div>
            )}
          </div>

          {lawyer.subscription?.status === "active" && (
            <div className="bg-[#C5A55A]/10 border border-[#C5A55A] rounded-xl p-4">
              <p className="text-[#1B2A4A] font-semibold text-sm uppercase">
                {lawyer.subscription.plan} Member
              </p>
              <p className="text-gray-600 text-sm mt-1">
                This lawyer has an active Advisora Connect subscription.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Enquiry Modal */}
      {showEnquiry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-[#1B2A4A] mb-4">
              Send Enquiry
            </h3>

            {enquiryStatus === "sent" ? (
              <div className="bg-green-50 text-green-700 p-4 rounded-lg text-center">
                ✓ Enquiry sent successfully! The lawyer will be notified.
              </div>
            ) : (
              <>
                <textarea
                  placeholder="Describe your legal issue or what you need help with... (Max 500 characters)"
                  value={enquiryMsg}
                  onChange={(e) =>
                    setEnquiryMsg(
                      e.target.value.slice(0, MAX_ENQUIRY_LENGTH)
                    )
                  }
                  rows={5}
                  maxLength={MAX_ENQUIRY_LENGTH}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {enquiryMsg.length}/{MAX_ENQUIRY_LENGTH}
                </p>
            {enquiryStatus === "error" && (
              <p className="text-red-500 text-sm mt-2">
                Failed to send. Please try again.
              </p>
            )}
            {enquiryStatus === "verification_required" && (
              <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm">
                Please verify your email before sending an enquiry.
                <div className="mt-2">
                  <button
                    onClick={() => router.push('/resend-verification')}
                    className="text-[#1B2A4A] font-semibold underline"
                  >
                    Verify Now
                  </button>
                </div>
              </div>
            )}
                <p className="text-xs text-gray-500 mt-2">
                  Your first enquiry per matter is free. Additional enquiries to
                  the same lawyer incur a ₦{PLATFORM_FEE_AMOUNT.toLocaleString()}{" "}
                  platform fee.
                </p>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setShowEnquiry(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitEnquiry}
                    disabled={
                      !enquiryMsg.trim() || enquiryStatus === "sending"
                    }
                    className="flex-1 bg-[#1B2A4A] text-white px-4 py-2.5 rounded-lg hover:bg-[#2a3f6a] disabled:opacity-50"
                  >
                    {enquiryStatus === "sending"
                      ? "Sending..."
                      : "Send Enquiry"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}