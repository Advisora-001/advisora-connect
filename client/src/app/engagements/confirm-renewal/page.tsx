"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useConfirmRenewal, useRenewalStatus } from "@/hooks/useFractional";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { showToast } from "@/components/ui/Toaster";

export default function ConfirmRenewalPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const proposalId = searchParams.get("proposalId") || searchParams.get("id");
  const action = searchParams.get("action"); // 'confirm' or 'decline'
  const confirmMutation = useConfirmRenewal();
  const [isProcessing, setIsProcessing] = useState(false);
  const [engagement, setEngagement] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [resultAction, setResultAction] = useState<"confirm" | "decline" | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!proposalId) {
      router.push("/engagements");
      return;
    }
    // If action is provided in URL, process it
    if (action && (action === "confirm" || action === "decline")) {
      handleConfirm(action as "confirm" | "decline");
    }
  }, [user, router, proposalId, action]);

  const handleConfirm = async (action: "confirm" | "decline") => {
    if (!proposalId) return;
    setIsProcessing(true);
    try {
      await confirmMutation.mutateAsync({ id: proposalId, action });
      setShowResult(true);
      setResultAction(action);
    } catch (err: any) {
      // Error handled by mutation
    } finally {
      setIsProcessing(false);
    }
  };

  // Fetch engagement details for display
  const { data } = useRenewalStatus(proposalId || "", !!proposalId);

  if (!user) return null;

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <div className="animate-spin w-10 h-10 border-2 border-[#1B2A4A] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const engagement = data?.engagement;
  const lawyer = engagement?.lawyerId;
  const client = engagement?.clientId;
  const lawyerName = lawyer?.userId ? `${lawyer.userId.firstName} ${lawyer.userId.lastName}` : "Unknown Lawyer";
  const clientName = client ? `${client.firstName} ${client.lastName}` : "Unknown Client";
  const lawyerPhoto = lawyer?.photo || lawyer?.userId?.avatar;

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <section className="bg-[#1B2A4A] text-white py-12 md:py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Engagement Renewal</h1>
          <p className="text-white/70 mt-2">Confirm or decline the auto-renewal of your fractional GC engagement</p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-6">
        {showResult ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-3xl font-bold ${
                resultAction === "confirm" ? "bg-[#ECFDF5] text-[#166534]" : "bg-[#FEF2F2] text-[#991B1B]"
              }`}>
                {resultAction === "confirm" ? "✓" : "✗"}
              </div>
              <h3 className="text-xl font-bold text-[#1B2A4A] mb-2">
                {resultAction === "confirm" ? "Renewal Confirmed!" : "Auto-Renewal Disabled"}
              </h3>
              <p className="text-[#667085] mb-6">
                {resultAction === "confirm"
                  ? "Your engagement will auto-renew on the renewal date. You'll be notified when the renewal is processed."
                  : "Auto-renewal has been disabled. Your engagement will end on the current end date."}
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/engagements" className="inline-flex items-center gap-2 px-6 py-3 bg-[#00A6A6] text-white rounded-lg hover:bg-[#008F8F] transition-colors font-semibold">
                  View Engagements
                </Link>
                <Link href="/engagements" className="inline-flex items-center gap-2 px-6 py-3 border-2 border-[#E5EAF0] text-[#667085] rounded-lg hover:border-[#00A6A6] hover:text-[#00A6A6] transition-colors font-semibold">
                  Back to Engagements
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Engagement Info */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Details</CardTitle>
                <CardDescription>Review the details before confirming or declining renewal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-6 p-4 bg-[#F5F7FA] rounded-lg">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-[#1B2A4A] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {lawyerPhoto ? (
                      <img src={lawyerPhoto} alt={lawyerName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{lawyerName.split(" ").map(n => n[0]).join("")}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1B2A4A]">{lawyerName}</h3>
                    <p className="text-sm text-[#667085]">Fractional General Counsel</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-[#F5F7FA] rounded-lg">
                    <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Monthly Retainer</p>
                    <p className="font-bold text-[#1B2A4A] text-lg">₦{engagement?.monthlyRetainer?.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-[#F5F7FA] rounded-lg">
                    <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Hours/Month</p>
                    <p className="font-bold text-[#1B2A4A] text-lg">{engagement?.hoursPerMonth}</p>
                  </div>
                  <div className="p-3 bg-[#F5F7FA] rounded-lg">
                    <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Commitment</p>
                    <p className="font-bold text-[#1B2A4A] text-lg">{engagement?.engagementMonths} months</p>
                  </div>
                  <div className="p-3 bg-[#F5F7FA] rounded-lg">
                    <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Current End Date</p>
                    <p className="font-bold text-[#1B2A4A] text-lg">{engagement?.endDate ? new Date(engagement.endDate).toLocaleDateString() : "N/A"}</p>
                  </div>
                </div>

                <div className="p-3 bg-[#FFFBEB] border border-[#F59E0B]/20 rounded-lg">
                  <p className="text-sm font-semibold text-[#92400E] mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    <span>Your engagement is set to auto-renew. Please confirm or decline before the renewal date.</span>
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="success"
                    size="lg"
                    onClick={() => handleConfirm("confirm")}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? "Confirming..." : "Confirm Renewal"}
                  </Button>
                  <Button
                    variant="danger"
                    size="lg"
                    onClick={() => handleConfirm("decline")}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? "Processing..." : "Decline Renewal"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}