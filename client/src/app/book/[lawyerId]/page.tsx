"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api, { PLATFORM_FEE_AMOUNT } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const TOTAL_STEPS = 4;

function BookingWizardContent() {
  const { lawyerId } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // State
  const [step, setStep] = useState(1);
  const [lawyer, setLawyer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Step 1: Service selection
  const [selectedService, setSelectedService] = useState<any>(null);

  // Step 2: Date & Time
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [availability, setAvailability] = useState<any>(null);
  const [availLoading, setAvailLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Step 3: Case summary & contact
  const [caseSummary, setCaseSummary] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Step 4: Confirm & submit
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Load lawyer data
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

  // Pre-fill contact details when user loads
  useEffect(() => {
    if (user) {
      setContactName(`${user.firstName} ${user.lastName}`);
      setContactEmail(user.email);
    }
  }, [user]);

  // Fetch availability when date changes
  useEffect(() => {
    if (!selectedDate || !lawyerId) return;
    setAvailLoading(true);
    api
      .getLawyerAvailability(lawyerId as string, selectedDate)
      .then((data) => {
        setAvailability(data);
        setAvailLoading(false);
        setSelectedTime(""); // Reset time when date changes
      })
      .catch(() => {
        setAvailability(null);
        setAvailLoading(false);
      });
  }, [selectedDate, lawyerId]);

  // Calendar helpers
  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isDateAvailable = (day: number) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Can't book in the past
    if (d < today) return false;

    // Check if lawyer is available on this day
    if (!lawyer?.availableDays?.includes(dayName)) return false;

    return true;
  };

  const formatDate = (day: number) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return d.toISOString().split("T")[0];
  };

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

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  // Submit booking request
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
      if (err.message?.includes("VERIFICATION_REQUIRED")) {
        setSubmitError(
          "Please verify your email before booking. Check your inbox or resend verification."
        );
      } else {
        setSubmitError(err.message || "Failed to submit booking request");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Progress indicator
  const stepLabels = ["Service", "Date & Time", "Details", "Confirm"];

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-primary/10">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-accent rounded-full"></div>
      </div>
    );
  }

  if (error || !lawyer) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-primary/10">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <p className="text-red-600 font-semibold">{error || "Lawyer not found"}</p>
          <Link
            href="/lawyers"
            className="mt-4 inline-block text-accent font-bold hover:underline"
          >
            ← Back to Lawyers
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-primary/10 py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-accent mt-6">Booking Request Sent!</h1>
          <p className="text-gray-600 mt-3">
            Your booking request has been sent to{" "}
            <strong>
              {lawyer.userId?.firstName} {lawyer.userId?.lastName}
            </strong>
            . They will review your request and respond shortly.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            You'll be notified when the lawyer accepts your booking. At that point, you can proceed to payment.
          </p>
          <div className="mt-8 space-y-3">
            <Link
              href="/dashboard/client"
              className="block w-full bg-accent text-white px-6 py-3 rounded-lg hover:bg-accent/90 font-bold text-lg shadow-md transition-all"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/lawyers"
              className="block w-full border-2 border-primary text-accent px-6 py-3 rounded-lg hover:bg-primary/10 font-semibold transition-all"
            >
              Browse More Lawyers
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-200px)] bg-primary/10 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      i + 1 < step
                        ? "bg-green-500 text-white"
                        : i + 1 === step
                        ? "bg-accent text-white ring-4 ring-accent/30"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {i + 1 < step ? "✓" : i + 1}
                  </div>
                  <span
                    className={`text-xs mt-1 font-medium ${
                      i + 1 <= step ? "text-accent" : "text-gray-400"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 mt-[-16px] ${
                      i + 1 < step ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Lawyer Info Bar */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-accent flex items-center justify-center text-white font-bold flex-shrink-0">
            {lawyer.photo ? (
              <img src={lawyer.photo} alt="" className="w-full h-full object-cover" />
            ) : (
              <span>{lawyer.userId?.firstName?.[0]}{lawyer.userId?.lastName?.[0]}</span>
            )}
          </div>
          <div>
            <p className="font-semibold text-accent">
              {lawyer.userId?.firstName} {lawyer.userId?.lastName}
            </p>
            <p className="text-sm text-gray-500">
              {lawyer.city}, {lawyer.state}
              {lawyer.verificationBadge && (
                <span className="ml-2 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                  ✓ Verified
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Step 1: Service Selection */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-lg border-2 border-primary/20 p-6">
            <h2 className="text-xl font-bold text-accent mb-2">Select a Service</h2>
            <p className="text-gray-600 mb-6">
              Choose the type of consultation you need from {lawyer.userId?.firstName}.
            </p>

            {lawyer.services && lawyer.services.length > 0 ? (
              <div className="space-y-3">
                {lawyer.services.map((svc: any, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedService(svc)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedService?.name === svc.name
                        ? "border-accent bg-accent/5 shadow-md"
                        : "border-gray-200 hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-accent text-lg">{svc.name}</p>
                        <p className="text-sm text-gray-500">
                          {svc.duration} minutes • {svc.type}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-accent">
                          {svc.price === 0 ? "Free" : `₦${svc.price.toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Default services if none configured */}
                {[
                  { name: "Discovery Call", duration: 15, price: 0, type: "video" },
                  { name: "Consultation", duration: 30, price: lawyer.consultationFee || 0, type: "video" },
                  { name: "Document Review", duration: 60, price: (lawyer.consultationFee || 0) * 2, type: "video" },
                ].map((svc, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedService(svc)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedService?.name === svc.name
                        ? "border-accent bg-accent/5 shadow-md"
                        : "border-gray-200 hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-accent text-lg">{svc.name}</p>
                        <p className="text-sm text-gray-500">
                          {svc.duration} minutes • {svc.type}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-accent">
                          {svc.price === 0 ? "Free" : `₦${svc.price.toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => selectedService && setStep(2)}
                disabled={!selectedService}
                className="bg-accent text-white px-8 py-3 rounded-lg hover:bg-accent/90 font-bold text-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Date & Time */}
        {step === 2 && (
          <div className="bg-white rounded-xl shadow-lg border-2 border-primary/20 p-6">
            <h2 className="text-xl font-bold text-accent mb-2">Choose Date & Time</h2>
            <p className="text-gray-600 mb-6">
              Select when you'd like your {selectedService?.name?.toLowerCase()} with{" "}
              {lawyer.userId?.firstName}.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Calendar */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded">
                    <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <p className="font-semibold text-accent">
                    {currentMonth.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded">
                    <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                    <div key={d} className="text-xs font-semibold text-gray-500 py-1">
                      {d}
                    </div>
                  ))}

                  {/* Empty cells for first day offset */}
                  {Array.from({ length: firstDayOfMonth(currentMonth) }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}

                  {/* Day cells */}
                  {Array.from({ length: daysInMonth(currentMonth) }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = formatDate(day);
                    const available = isDateAvailable(day);
                    const isSelected = selectedDate === dateStr;

                    return (
                      <button
                        key={day}
                        onClick={() => available && setSelectedDate(dateStr)}
                        disabled={!available}
                        className={`py-2 rounded-lg text-sm font-medium transition-all ${
                          isSelected
                            ? "bg-accent text-white shadow-md"
                            : available
                            ? "hover:bg-primary/10 text-accent cursor-pointer"
                            : "text-gray-300 cursor-not-allowed"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <p className="font-semibold text-accent mb-3">
                  {selectedDate
                    ? `Available times for ${formatDisplayDate(selectedDate)}`
                    : "Select a date to see available times"}
                </p>

                {availLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full"></div>
                  </div>
                ) : availability?.slots?.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {availability.slots.map((slot: string) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                          selectedTime === slot
                            ? "bg-accent text-white border-accent shadow-md"
                            : "border-gray-200 text-accent hover:border-accent hover:bg-accent/5"
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : selectedDate ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No available slots on this date.</p>
                    <p className="text-sm mt-1">Try another date.</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <p>Pick a date from the calendar</p>
                  </div>
                )}

                {availability?.timezone && (
                  <p className="text-xs text-gray-400 mt-3 text-center">
                    Times shown in {availability.timezone} timezone
                  </p>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold transition-all"
              >
                ← Back
              </button>
              <button
                onClick={() => selectedDate && selectedTime && setStep(3)}
                disabled={!selectedDate || !selectedTime}
                className="bg-accent text-white px-8 py-3 rounded-lg hover:bg-accent/90 font-bold text-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Case Summary & Contact */}
        {step === 3 && (
          <div className="bg-white rounded-xl shadow-lg border-2 border-primary/20 p-6">
            <h2 className="text-xl font-bold text-accent mb-2">Your Details</h2>
            <p className="text-gray-600 mb-6">
              Tell {lawyer.userId?.firstName} about your legal needs.
            </p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-accent mb-2">
                  Case Summary{" "}
                  <span className="text-gray-400 font-normal">(max 500 characters)</span>
                </label>
                <textarea
                  value={caseSummary}
                  onChange={(e) => setCaseSummary(e.target.value.slice(0, 500))}
                  rows={4}
                  maxLength={500}
                  placeholder="Briefly describe your legal issue or what you need help with..."
                  className="w-full px-4 py-3 border-2 border-primary rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/30 focus:border-primary-dark text-accent placeholder-gray-400 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {caseSummary.length}/500
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-accent mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border-2 border-primary rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/30 focus:border-primary-dark text-accent placeholder-gray-400"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-accent mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border-2 border-primary rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/30 focus:border-primary-dark text-accent placeholder-gray-400"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-accent mb-2">
                  Phone <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-primary rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/30 focus:border-primary-dark text-accent placeholder-gray-400"
                  placeholder="+234..."
                />
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold transition-all"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!contactName || !contactEmail}
                className="bg-accent text-white px-8 py-3 rounded-lg hover:bg-accent/90 font-bold text-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm & Submit */}
        {step === 4 && (
          <div className="bg-white rounded-xl shadow-lg border-2 border-primary/20 p-6">
            <h2 className="text-xl font-bold text-accent mb-2">Confirm Your Booking</h2>
            <p className="text-gray-600 mb-6">
              Review your booking details before submitting.
            </p>

            {/* Summary Card */}
            <div className="bg-primary/5 rounded-xl p-6 border-2 border-primary/10 space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-primary/20">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-accent flex items-center justify-center text-white font-bold flex-shrink-0">
                  {lawyer.photo ? (
                    <img src={lawyer.photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{lawyer.userId?.firstName?.[0]}{lawyer.userId?.lastName?.[0]}</span>
                  )}
                </div>
                <div>
                  <p className="font-bold text-accent text-lg">
                    {lawyer.userId?.firstName} {lawyer.userId?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{lawyer.practiceAreas?.slice(0, 2).join(", ")}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Service</p>
                  <p className="font-semibold text-accent">{selectedService?.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Duration</p>
                  <p className="font-semibold text-accent">{selectedService?.duration} minutes</p>
                </div>
                <div>
                  <p className="text-gray-500">Date</p>
                  <p className="font-semibold text-accent">{formatDisplayDate(selectedDate)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Time</p>
                  <p className="font-semibold text-accent">{selectedTime}</p>
                </div>
                <div>
                  <p className="text-gray-500">Type</p>
                  <p className="font-semibold text-accent capitalize">{selectedService?.type}</p>
                </div>
                <div>
                  <p className="text-gray-500">Service Fee</p>
                  <p className="font-semibold text-accent">
                    {selectedService?.price === 0
                      ? "Free"
                      : `₦${selectedService?.price?.toLocaleString()}`}
                  </p>
                </div>
              </div>

              {caseSummary && (
                <div className="pt-3 border-t border-primary/20">
                  <p className="text-gray-500 text-sm">Case Summary</p>
                  <p className="text-accent text-sm mt-1">{caseSummary}</p>
                </div>
              )}

              <div className="pt-3 border-t border-primary/20">
                <p className="text-gray-500 text-sm">Contact</p>
                <p className="text-accent text-sm">{contactName}</p>
                <p className="text-accent text-sm">{contactEmail}</p>
                {contactPhone && <p className="text-accent text-sm">{contactPhone}</p>}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
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
              <div className="mt-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {submitError}
                {submitError.includes("verify your email") && (
                  <div className="mt-2">
                    <Link
                      href="/resend-verification"
                      className="text-accent font-semibold underline"
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
                className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold transition-all"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-accent text-white px-8 py-3 rounded-lg hover:bg-accent/90 font-bold text-lg shadow-md disabled:opacity-50 transition-all"
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
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-primary/10">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-accent rounded-full"></div>
        </div>
      }
    >
      <BookingWizardContent />
    </Suspense>
  );
}