"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";

function PaymentCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appointmentId = searchParams.get("appointmentId");
  const amount = searchParams.get("amount");

  useEffect(() => {
    if (!appointmentId || !amount) { router.push("/dashboard/client"); return; }
    handlePayment();
  }, [appointmentId, amount]);

  const handlePayment = async () => {
    if (!appointmentId || !amount) return;
    setLoading(true);
    try {
      const response = await api.initializePayment({ amount: Number(amount), metadata: { type: "consultation", appointmentId } });
      const authUrl = response?.authorization_url;
      if (authUrl) { window.location.href = authUrl; }
      else { setError("Failed to initialize payment - no authorization URL"); }
    } catch (err) { setError(err instanceof Error ? err.message : "Payment initialization failed"); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
      <div className="text-center"><div className="animate-spin w-10 h-10 border-2 border-[#1B2A4A] border-t-transparent rounded-full mx-auto"></div><p className="mt-4 text-[#667085] text-sm">Redirecting to payment gateway...</p></div>
    </div>
  );

  if (error) return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-xl border border-[#E5EAF0] p-8 text-center shadow-sm">
        <div className="w-16 h-16 bg-[#FEF2F2] rounded-full flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8 text-[#EF4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></div>
        <h2 className="text-xl font-bold text-[#1B2A4A] mb-2">Payment Error</h2>
        <p className="text-[#667085] mb-6 text-sm">{error}</p>
        <button onClick={() => router.push("/dashboard/client")} className="bg-[#1B2A4A] text-white px-6 py-2.5 rounded-lg hover:bg-[#16213A] font-semibold text-sm transition-colors">Back to Dashboard</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-xl border border-[#E5EAF0] p-8 text-center shadow-sm">
        <div className="w-16 h-16 bg-[#EFF6FF] rounded-full flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8 text-[#2476B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
        <h2 className="text-xl font-bold text-[#1B2A4A] mb-2">Proceeding to Payment</h2>
        <p className="text-[#667085] mb-6 text-sm">You will be redirected to Paystack to complete your payment.</p>
        <p className="text-lg font-bold text-[#1B2A4A]">Total: ₦{Number(amount).toLocaleString()}</p>
        <p className="text-sm text-[#94A3B8] mt-2">Consultation Fee + Platform Fee</p>
      </div>
    </div>
  );
}

export default function PaymentCheckoutPage() {
  return <Suspense fallback={<div className="min-h-[calc(100vh-200px)] flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-[#1B2A4A] border-t-transparent rounded-full"></div></div>}><PaymentCheckoutContent /></Suspense>;
}