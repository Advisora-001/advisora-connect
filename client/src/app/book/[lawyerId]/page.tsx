"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api, { PLATFORM_FEE_AMOUNT } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

function BookingWizardContent() {
  const { lawyerId } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [lawyer, setLawyer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [availability, setAvailability] = useState<any>(null);
  const [availLoading, setAvailLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [caseSummary, setCaseSummary] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!lawyerId) return;
    api
      .getLawyerById(lawyerId as string)
      .then((data) => {
        setLawyer(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load lawyer profile");
        setLoading(false);
      });
  }, [lawyerId]);

  useEffect(() => {
    if (user) {
      setContactName(`${user.firstName} ${user.lastName}`);
      setContactEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    if (!selectedDate || !lawyerId) return;
    setAvailLoading(true);
    api
      .getLawyerAvailability(lawyerId as string, selectedDate)
      .then((data) => {
        setAvailability(data);
        setAvailLoading(false);
        setSelectedTime("");
      })
      .catch(() => {
        setAvailability(null);
        setAvailLoading(false);
      });
  }, [selectedDate, lawyerId]);

  const daysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const isDateAvailable = (day: number) => {
    const d = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );
    const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d < today) return false;
    if (!lawyer?.availableDays?.includes(dayName)) return false;
    return true;
  };
  const formatDate = (day: number) =>
    new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      .toISOString()
      .split("T")[0];
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  const prevMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  const nextMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );

  const handleSubmit = async () => {
    if (!user) {
      router.push("/login?redirect=" + encodeURIComponent(`/book/${lawyerId}`));
      return;
    }
    if (!selectedService || !selectedDate || !selectedTime) {
      setSubmitError("Please complete all booking details");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      await api.createBookingRequest({
        lawyerId,
        service: selectedService,
        date: selectedDate,
        timeSlot: selectedTime,
        duration: selectedService.duration,
        consultationType: selectedService.type || "video",
        caseSummary,
        clientName: contactName,
        clientEmail: contactEmail,
        clientPhone: contactPhone,
      });
      setSubmitted(true);
    } catch (err: any) {
      if (err.message?.includes("VERIFICATION_REQUIRED"))
        setSubmitError(
          "Please verify your email before booking. Check your inbox or resend verification.",
        );
      else setSubmitError(err.message || "Failed to submit booking request");
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabels = ["Service", "Date & Time", "Details", "Confirm"];

  if (loading)
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-2 border-[#1B2A4A] border-t-transparent rounded-full"></div>
      </div>
    );
  if (error || !lawyer)
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="bg-white rounded-xl border border-[#E5EAF0] p-8 text-center max-w-md">
          <p className="text-[#EF4444] font-semibold">
            {error || "Lawyer not found"}
          </p>
          <Link
            href="/lawyers"
            className="mt-4 inline-block text-[#00A6A6] font-semibold hover:underline"
          >
            ← Back to Lawyers
          </Link>
        </div>
      </div>
    );

  if (submitted)
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-xl border border-[#E5EAF0] p-8 text-center shadow-sm">
          <div className="w-20 h-20 bg-[#ECFDF5] rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-10 h-10 text-[#5DBB63]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1B2A4A] mt-6">
            Booking Request Sent!
          </h1>
          <p className="text-[#667085] mt-3">
            Your booking request has been sent to{" "}
            <strong>
              {lawyer.userId?.firstName} {lawyer.userId?.lastName}
            </strong>
            . They will review your request and respond shortly.
          </p>
          <p className="text-sm text-[#94A3B8] mt-2">
            You'll be notified when the lawyer accepts your booking. At that
            point, you can proceed to payment.
          </p>
          <div className="mt-8 space-y-3">
            <Link
              href="/dashboard/client"
              className="block w-full bg-[#1B2A4A] text-white px-6 py-3 rounded-lg hover:bg-[#16213A] font-semibold text-sm transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/lawyers"
              className="block w-full border border-[#E5EAF0] text-[#1B2A4A] px-6 py-3 rounded-lg hover:bg-[#F5F7FA] font-semibold text-sm transition-colors"
            >
              Browse More Lawyers
            </Link>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-[calc(100vh-200px)] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${i + 1 < step ? "bg-[#5DBB63] text-white" : i + 1 === step ? "bg-[#1B2A4A] text-white ring-4 ring-[#1B2A4A]/10" : "bg-[#E5EAF0] text-[#94A3B8]"}`}
                  >
                    {i + 1 < step ? "✓" : i + 1}
                  </div>
                  <span
                    className={`text-xs mt-1 font-medium ${i + 1 <= step ? "text-[#1B2A4A]" : "text-[#94A3B8]"}`}
                  >
                    {label}
                  </span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 mt-[-16px] ${i + 1 < step ? "bg-[#5DBB63]" : "bg-[#E5EAF0]"}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Lawyer Info Bar */}
        <div className="bg-white rounded-xl border border-[#E5EAF0] p-4 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-[#1B2A4A] flex items-center justify-center text-white font-bold flex-shrink-0">
            {lawyer.photo ? (
              <img
                src={lawyer.photo}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span>
                {lawyer.userId?.firstName?.[0]}
                {lawyer.userId?.lastName?.[0]}
              </span>
            )}
          </div>
          <div>
            <p className="font-semibold text-[#1B2A4A]">
              {lawyer.userId?.firstName} {lawyer.userId?.lastName}
            </p>
            <p className="text-sm text-[#667085]">
              {lawyer.city}, {lawyer.state}
              {lawyer.verificationBadge && (
                <span className="ml-2 bg-[#ECFDF5] text-[#166534] text-xs px-2 py-0.5 rounded-full">
                  ✓ Verified
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Step 1: Service Selection */}
        {step === 1 && (
          <div className="bg-white rounded-xl border border-[#E5EAF0] p-6">
            <h2 className="text-xl font-bold text-[#1B2A4A] mb-2">
              Select a Service
            </h2>
            <p className="text-[#667085] mb-6">
              Choose the type of consultation you need from{" "}
              {lawyer.userId?.firstName}.
            </p>
            <div className="space-y-3">
              {(lawyer.services && lawyer.services.length > 0
                ? lawyer.services
                : [
                    {
                      name: "Consultation",
                      duration: 30,
                      price: lawyer.consultationFee || 0,
                      type: "video",
                    },
                  ]
              ).map((svc: any, idx: number) => (
                <div
                  key={idx}
                  onClick={() => setSelectedService(svc)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedService?.name === svc.name ? "border-[#1B2A4A] bg-[#EEF2F7]" : "border-[#E5EAF0] hover:border-[#00A6A6]/50 hover:bg-[#F5F7FA]"}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[#1B2A4A] text-lg">
                        {svc.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-[#1B2A4A]">
                        {svc.price === 0
                          ? "Free"
                          : `₦${svc.price.toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => selectedService && setStep(2)}
                disabled={!selectedService}
                className="bg-[#1B2A4A] text-white px-8 py-3 rounded-lg hover:bg-[#16213A] font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Date & Time */}
        {step === 2 && (
          <div className="bg-white rounded-xl border border-[#E5EAF0] p-6">
            <h2 className="text-xl font-bold text-[#1B2A4A] mb-2">
              Choose Date & Time
            </h2>
            <p className="text-[#667085] mb-6">
              Select when you'd like your {selectedService?.name?.toLowerCase()}{" "}
              with {lawyer.userId?.firstName}.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={prevMonth}
                    className="p-1.5 hover:bg-[#F5F7FA] rounded-lg"
                  >
                    <svg
                      className="w-5 h-5 text-[#1B2A4A]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <p className="font-semibold text-[#1B2A4A]">
                    {currentMonth.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <button
                    onClick={nextMonth}
                    className="p-1.5 hover:bg-[#F5F7FA] rounded-lg"
                  >
                    <svg
                      className="w-5 h-5 text-[#1B2A4A]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-0.5 text-center">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                    <div
                      key={d}
                      className="text-xs font-semibold text-[#94A3B8] py-1"
                    >
                      {d}
                    </div>
                  ))}
                  {Array.from({ length: firstDayOfMonth(currentMonth) }).map(
                    (_, i) => (
                      <div key={`empty-${i}`} />
                    ),
                  )}
                  {Array.from({ length: daysInMonth(currentMonth) }).map(
                    (_, i) => {
                      const day = i + 1;
                      const dateStr = formatDate(day);
                      const available = isDateAvailable(day);
                      const isSelected = selectedDate === dateStr;
                      return (
                        <button
                          key={day}
                          onClick={() => available && setSelectedDate(dateStr)}
                          disabled={!available}
                          className={`py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${isSelected ? "bg-[#1B2A4A] text-white" : available ? "hover:bg-[#EEF2F7] text-[#1B2A4A] cursor-pointer" : "text-[#E5EAF0] cursor-not-allowed"}`}
                        >
                          {day}
                        </button>
                      );
                    },
                  )}
                </div>
              </div>
              <div>
                <p className="font-semibold text-[#1B2A4A] mb-3">
                  {selectedDate
                    ? `Available times for ${formatDisplayDate(selectedDate)}`
                    : "Select a date to see available times"}
                </p>
                {availLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-[#1B2A4A] border-t-transparent rounded-full"></div>
                  </div>
                ) : availability?.slots?.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {availability.slots.map((slot: string) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-all ${selectedTime === slot ? "bg-[#1B2A4A] text-white border-[#1B2A4A]" : "border-[#E5EAF0] text-[#1B2A4A] hover:border-[#1B2A4A] hover:bg-[#EEF2F7]"}`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : selectedDate ? (
                  <div className="text-center py-8 text-[#667085]">
                    <p>No available slots on this date.</p>
                    <p className="text-sm mt-1">Try another date.</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#94A3B8]">
                    <p>Pick a date from the calendar</p>
                  </div>
                )}
                {availability?.timezone && (
                  <p className="text-xs text-[#94A3B8] mt-3 text-center">
                    Times shown in {availability.timezone} timezone
                  </p>
                )}
              </div>
            </div>
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 border border-[#E5EAF0] rounded-lg text-[#475569] hover:bg-[#F5F7FA] font-semibold text-sm transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => selectedDate && selectedTime && setStep(3)}
                disabled={!selectedDate || !selectedTime}
                className="bg-[#1B2A4A] text-white px-8 py-3 rounded-lg hover:bg-[#16213A] font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Case Summary & Contact */}
        {step === 3 && (
          <div className="bg-white rounded-xl border border-[#E5EAF0] p-6">
            <h2 className="text-xl font-bold text-[#1B2A4A] mb-2">
              Your Details
            </h2>
            <p className="text-[#667085] mb-6">
              Tell {lawyer.userId?.firstName} about your legal needs.
            </p>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">
                  Case Summary{" "}
                  <span className="text-[#94A3B8] font-normal">
                    (max 500 characters)
                  </span>
                </label>
                <textarea
                  value={caseSummary}
                  onChange={(e) => setCaseSummary(e.target.value.slice(0, 500))}
                  rows={4}
                  maxLength={500}
                  placeholder="Briefly describe your legal issue or what you need help with..."
                  className="w-full px-4 py-3 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm resize-none"
                />
                <p className="text-xs text-[#94A3B8] mt-1 text-right">
                  {caseSummary.length}/500
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">
                  Phone{" "}
                  <span className="text-[#94A3B8] font-normal">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm"
                  placeholder="+234..."
                />
              </div>
            </div>
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 border border-[#E5EAF0] rounded-lg text-[#475569] hover:bg-[#F5F7FA] font-semibold text-sm transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!contactName || !contactEmail}
                className="bg-[#1B2A4A] text-white px-8 py-3 rounded-lg hover:bg-[#16213A] font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm & Submit */}
        {step === 4 && (
          <div className="bg-white rounded-xl border border-[#E5EAF0] p-6">
            <h2 className="text-xl font-bold text-[#1B2A4A] mb-2">
              Confirm Your Booking
            </h2>
            <p className="text-[#667085] mb-6">
              Review your booking details before submitting.
            </p>
            <div className="bg-[#F5F7FA] rounded-xl p-6 border border-[#E5EAF0] space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-[#E5EAF0]">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-[#1B2A4A] flex items-center justify-center text-white font-bold flex-shrink-0">
                  {lawyer.photo ? (
                    <img
                      src={lawyer.photo}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>
                      {lawyer.userId?.firstName?.[0]}
                      {lawyer.userId?.lastName?.[0]}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-bold text-[#1B2A4A] text-lg">
                    {lawyer.userId?.firstName} {lawyer.userId?.lastName}
                  </p>
                  <p className="text-sm text-[#667085]">
                    {lawyer.practiceAreas?.slice(0, 2).join(", ")}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[#94A3B8]">Service</p>
                  <p className="font-semibold text-[#1B2A4A]">
                    {selectedService?.name}
                  </p>
                </div>
                <div>
                  <p className="text-[#94A3B8]">Duration</p>
                  <p className="font-semibold text-[#1B2A4A]">
                    {selectedService?.duration} minutes
                  </p>
                </div>
                <div>
                  <p className="text-[#94A3B8]">Date</p>
                  <p className="font-semibold text-[#1B2A4A]">
                    {formatDisplayDate(selectedDate)}
                  </p>
                </div>
                <div>
                  <p className="text-[#94A3B8]">Time</p>
                  <p className="font-semibold text-[#1B2A4A]">{selectedTime}</p>
                </div>
                <div>
                  <p className="text-[#94A3B8]">Type</p>
                  <p className="font-semibold text-[#1B2A4A] capitalize">
                    {selectedService?.type}
                  </p>
                </div>
                <div>
                  <p className="text-[#94A3B8]">Service Fee</p>
                  <p className="font-semibold text-[#1B2A4A]">
                    {selectedService?.price === 0
                      ? "Free"
                      : `₦${selectedService?.price?.toLocaleString()}`}
                  </p>
                </div>
              </div>
              {caseSummary && (
                <div className="pt-3 border-t border-[#E5EAF0]">
                  <p className="text-[#94A3B8] text-sm">Case Summary</p>
                  <p className="text-[#1B2A4A] text-sm mt-1">{caseSummary}</p>
                </div>
              )}
              <div className="pt-3 border-t border-[#E5EAF0]">
                <p className="text-[#94A3B8] text-sm">Contact</p>
                <p className="text-[#1B2A4A] text-sm">{contactName}</p>
                <p className="text-[#1B2A4A] text-sm">{contactEmail}</p>
                {contactPhone && (
                  <p className="text-[#1B2A4A] text-sm">{contactPhone}</p>
                )}
              </div>
              <div className="bg-[#FFFBEB] border border-[#F59E0B]/20 rounded-lg p-3 text-sm text-[#92400E]">
                <p className="font-semibold">How it works:</p>
                <ol className="list-decimal ml-4 mt-1 space-y-1">
                  <li>Your booking request will be sent to the lawyer</li>
                  <li>The lawyer will review and accept your request</li>
                  <li>Once accepted, you'll be prompted to complete payment</li>
                  <li>After payment, your consultation is confirmed</li>
                </ol>
              </div>
            </div>
            {submitError && (
              <div className="mt-4 bg-[#FEF2F2] text-[#EF4444] p-3 rounded-lg text-sm">
                {submitError}
                {submitError.includes("verify your email") && (
                  <div className="mt-2">
                    <Link
                      href="/resend-verification"
                      className="text-[#1B2A4A] font-semibold underline"
                    >
                      Resend Verification Email
                    </Link>
                  </div>
                )}
              </div>
            )}
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(3)}
                className="px-6 py-3 border border-[#E5EAF0] rounded-lg text-[#475569] hover:bg-[#F5F7FA] font-semibold text-sm transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-[#1B2A4A] text-white px-8 py-3 rounded-lg hover:bg-[#16213A] font-semibold text-sm disabled:opacity-50 transition-colors"
              >
                {submitting ? "Submitting..." : "Submit Booking Request"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BookingWizardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#1B2A4A] border-t-transparent rounded-full"></div>
        </div>
      }
    >
      <BookingWizardContent />
    </Suspense>
  );
}
