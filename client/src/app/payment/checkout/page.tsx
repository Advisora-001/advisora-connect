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
    if (!appointmentId || !amount) {
      router.push("/dashboard/client");
      return;
    }
    handlePayment();
  }, [appointmentId, amount]);

  const handlePayment = async () => {
    if (!appointmentId || !amount) return;

    setLoading(true);
    try {
      const response = await api.initializePayment({
        amount: Number(amount),
        metadata: {
          type: "consultation",
          appointmentId: appointmentId,
        },
      });

      console.log("Payment response:", response);

      const authUrl =
        response?.data?.authorization_url || response?.authorization_url;
      if (authUrl) {
        window.location.href = authUrl;
      } else {
        console.error("No authorization URL found in response:", response);
        setError("Failed to initialize payment - no authorization URL");
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError(
        err instanceof Error ? err.message : "Payment initialization failed",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 bg-primary/10">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-accent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">
            Redirecting to payment gateway...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 bg-primary/10">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            Payment Error
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/dashboard/client")}
            className="bg-accent text-white px-6 py-2 rounded-lg hover:bg-accent/90"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 bg-primary/10">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-accent mb-2">
          Proceeding to Payment
        </h2>
        <p className="text-gray-600 mb-4">
          You will be redirected to Paystack to complete your payment.
        </p>
        <p className="text-lg font-bold text-accent">
          Total: ₦{Number(amount).toLocaleString()}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Consultation Fee + Platform Fee
        </p>
      </div>
    </div>
  );
}

export default function PaymentCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-primary/10">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-accent rounded-full"></div>
        </div>
      }
    >
      <PaymentCheckoutContent />
    </Suspense>
  );
}

