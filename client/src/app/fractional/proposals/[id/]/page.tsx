"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useFractionalProposal, useAcceptFractionalProposal, useRejectFractionalProposal } from "@/hooks/useFractional";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@/components/ui";
import { showToast } from "@/components/ui/Toaster";
import { getProposalExpiry } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
  withdrawn: "Withdrawn",
  active: "Active",
};

const STATUS_COLORS: Record<string, "success" | "warning" | "danger" | "info" | "default" | "outline"> = {
  draft: "default",
  sent: "info",
  viewed: "info",
  accepted: "success",
  rejected: "danger",
  expired: "warning",
  withdrawn: "outline",
  active: "success",
};

const ENGAGEMENT_TYPE_LABELS: Record<string, string> = {
  "Monthly Retainer": "Monthly Retainer",
  "Project-based": "Project-based",
  "Interim GC": "Interim GC",
  "Board Advisor": "Board Advisor",
};

const PAYMENT_TERMS_LABELS: Record<string, string> = {
  monthly_advance: "Monthly in Advance",
  monthly_arrears: "Monthly in Arrears",
  quarterly_advance: "Quarterly in Advance",
};

export default function ProposalDetailPage() {
  const params = useParams();
  const proposalId = params.id as string;
  const router = useRouter();
  const { user } = useAuth();
  const acceptMutation = useAcceptFractionalProposal();
  const rejectMutation = useRejectFractionalProposal();
  const { data, isLoading, error, refetch } = useFractionalProposal(proposalId, !!proposalId);

  const [rejectNotes, setRejectNotes] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  const handleAccept = async () => {
    try {
      await acceptMutation.mutateAsync(proposalId);
      await refetch();
      showToast.success("Proposal accepted! Redirecting to payment...");
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Failed to accept proposal");
    }
  };

  const handleReject = async () => {
    if (!rejectNotes.trim()) {
      showToast.error("Please provide a reason for rejection");
      return;
    }
    try {
      await rejectMutation.mutateAsync({ id: proposalId, clientNotes: rejectNotes });
      setShowRejectModal(false);
      setRejectNotes("");
      await refetch();
      showToast.success("Proposal rejected");
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Failed to reject proposal");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <div className="animate-spin w-10 h-10 border-2 border-[#1B2A4A] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !data?.proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <div className="text-center py-20 bg-white rounded-xl border border-[#E5EAF0] max-w-md mx-auto px-4">
          <p className="text-[#EF4444] font-semibold mb-2">Proposal not found</p>
          <Link href="/fractional/proposals" className="text-[#00A6A6] font-semibold hover:underline">
            ← Back to Proposals
          </Link>
        </div>
      </div>
    );
  }

  const proposal = data.proposal;
  const statusColor = STATUS_COLORS[proposal.status] || "default";
  const expiry = getProposalExpiry(proposal.expiresAt);
  const lawyer = proposal.lawyerId;
  const lawyerName = lawyer ? `${lawyer.firstName} ${lawyer.lastName}` : "Unknown Lawyer";
  const lawyerPhoto = lawyer?.photo;
  const lawyerCity = lawyer?.city;
  const lawyerState = lawyer?.state;
  const lawyerBio = lawyer?.bio;
  const lawyerRating = lawyer?.rating;
  const lawyerReviewCount = lawyer?.reviewCount;
  const lawyerFractionalGC = lawyer?.fractionalGC;

  // Check if user is the client who owns this proposal
  const isClient = user && proposal.clientId?.toString() === user._id.toString();
  const isLawyer = user && lawyer?.userId?._id?.toString() === user._id.toString();

  const canAccept = isClient && ["sent", "viewed", "draft"].includes(proposal.status) && !expiry.expired;
  const canReject = isClient && ["sent", "viewed", "draft"].includes(proposal.status);

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <section className="bg-[#1B2A4A] text-white py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Proposal Details</h1>
              <p className="text-white/70 mt-2">Review and manage this fractional GC proposal</p>
            </div>
            <Link href="/fractional/proposals" className="inline-flex items-center gap-2 px-4 py-2 border border-white/30 text-white rounded-lg hover:bg-white/10 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Proposals
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-6">
        {/* Status Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <Badge variant={STATUS_COLORS[proposal.status] || "default"} size="lg">
                    {STATUS_LABELS[proposal.status] || proposal.status}
                  </Badge>
                  {["sent", "viewed", "draft"].includes(proposal.status) && (
                    <span className={expiry.expired ? 'text-[#EF4444]' : 'text-[#F59E0B]'} >
                      {expiry.text}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-[#1B2A4A]">{ENGAGEMENT_TYPE_LABELS[proposal.engagementType] || proposal.engagementType}</h2>
              </div>
              {isClient && canAccept && !acceptMutation.isPending && (
                <Button variant="success" size="lg" onClick={handleAccept} className="whitespace-nowrap">
                  {acceptMutation.isPending ? "Accepting..." : "Accept Proposal"}
                </Button>
              )}
              {isClient && canReject && !rejectMutation.isPending && (
                <Button variant="outline" size="lg" onClick={() => setShowRejectModal(true)} className="whitespace-nowrap">
                  Reject
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lawyer Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Lawyer Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-[#1B2A4A] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {lawyerPhoto ? (
                  <img src={lawyerPhoto} alt={lawyerName} className="w-full h-full object-cover" />
                ) : (
                  <span>{lawyerName.split(" ").map(n => n[0]).join("")}</span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[#1B2A4A]">{lawyerName}</h3>
                <p className="text-sm text-[#667085]">{lawyerCity}, {lawyerState}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[#F59E0B]">★</span>
                    <span className="font-semibold text-[#1B2A4A]">{lawyerRating?.toFixed(1) || "N/A"}</span>
                    <span className="text-[#94A3B8]">({lawyerReviewCount || 0} reviews)</span>
                  </div>
                </div>
              </div>
              {lawyerFractionalGC?.monthlyRetainerMin && lawyerFractionalGC?.monthlyRetainerMax && (
                <div className="text-right">
                  <p className="text-sm text-[#667085]">Monthly Retainer Range</p>
                  <p className="font-bold text-[#1B2A4A]">₦{lawyerFractionalGC.monthlyRetainerMin.toLocaleString()} - ₦{lawyerFractionalGC.monthlyRetainerMax.toLocaleString()}</p>
                  {lawyerFractionalGC.hoursPerMonth && (
                    <p className="text-xs text-[#94A3B8]">{lawyerFractionalGC.hoursPerMonth} hrs/month</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Proposal Details */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Monthly Retainer</p>
                  <p className="font-bold text-[#1B2A4A] text-lg">₦{proposal.monthlyRetainer?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Hours/Month</p>
                  <p className="font-bold text-[#1B2A4A]">{proposal.hoursPerMonth}</p>
                </div>
                <div>
                  <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Commitment</p>
                  <p className="font-bold text-[#1B2A4A]">{proposal.engagementMonths} months</p>
                </div>
                <div>
                  <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Payment Terms</p>
                  <p className="font-bold text-[#1B2A4A]">{PAYMENT_TERMS_LABELS[proposal.paymentTerms] || proposal.paymentTerms}</p>
                </div>
              </div>
              {proposal.includesOutOfScopeRate && proposal.outOfScopeHourlyRate && (
                <div className="p-3 bg-[#F5F7FA] rounded-lg">
                  <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Out-of-Scope Rate</p>
                  <p className="font-bold text-[#1B2A4A]">₦{proposal.outOfScopeHourlyRate.toLocaleString()}/hr</p>
                </div>
              )}
              <div className="p-3 bg-[#FFFBEB] border border-[#F59E0B]/20 rounded-lg">
                <p className="text-sm text-[#92400E] font-semibold mb-1">Platform Fee: ₦10,000 (one-time)</p>
                <p className="text-xs text-[#92400E]">Charged upon proposal acceptance via Paystack subscription setup</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Engagement Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Engagement Type</p>
                <p className="font-bold text-[#1B2A4A]">{ENGAGEMENT_TYPE_LABELS[proposal.engagementType] || proposal.engagementType}</p>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Start Date</p>
                <p className="font-bold text-[#1B2A4A]">{new Date(proposal.startDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Auto-Renew</p>
                <p className="font-bold text-[#1B2A4A]">{proposal.autoRenew ? "Yes" : "No"}</p>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Termination Notice</p>
                <p className="font-bold text-[#1B2A4A]">{proposal.terminationNoticeDays} days</p>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Industries</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {proposal.industries?.map((ind: string) => (
                    <Badge key={ind} variant="info" size="xs">{ind}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Company Stages</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {proposal.companyStages?.map((stage: string) => (
                    <Badge key={stage} variant="default" size="xs">{stage}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scope of Work */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Scope of Work</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {proposal.scopeOfWork?.map((scope: string) => (
                <Badge key={scope} variant="info" size="sm" className="px-3 py-1.5 text-base">{scope}</Badge>
              ))}
              {proposal.customScope && (
                <div className="mt-3 p-3 bg-[#F5F7FA] rounded-lg">
                  <p className="text-sm text-[#667085]"><strong>Custom Scope:</strong> {proposal.customScope}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lawyer Notes */}
        {proposal.notes && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Lawyer's Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#475569] whitespace-pre-wrap">{proposal.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Client Notes (for lawyer view) */}
        {isLawyer && proposal.clientNotes && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Client's Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#475569] whitespace-pre-wrap">{proposal.clientNotes}</p>
            </CardContent>
          </Card>
        )}

        {/* Proposal Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-[#F5F7FA] rounded-lg">
                <div className="w-10 h-10 bg-[#00A6A6]/10 text-[#00A6A6] rounded-full flex items-center justify-center text-sm font-bold">📅</div>
                <div>
                  <p className="font-semibold text-[#1B2A4A]">Proposal Created</p>
                  <p className="text-sm text-[#667085]">{new Date(proposal.createdAt).toLocaleDateString()} at {new Date(proposal.createdAt).toLocaleTimeString()}</p>
                </div>
              </div>
              {proposal.sentAt && (
                <div className="flex items-center gap-4 p-3 bg-[#F5F7FA] rounded-lg">
                  <div className="w-10 h-10 bg-[#00A6A6]/10 text-[#00A6A6] rounded-full flex items-center justify-center text-sm font-bold">📤</div>
                  <div>
                    <p className="font-semibold text-[#1B2A4A]">Proposal Sent</p>
                    <p className="text-sm text-[#667085]">{new Date(proposal.sentAt).toLocaleDateString()} at {new Date(proposal.sentAt).toLocaleTimeString()}</p>
                  </div>
                </div>
              )}
              {proposal.viewedAt && (
                <div className="flex items-center gap-4 p-3 bg-[#F5F7FA] rounded-lg">
                  <div className="w-10 h-10 bg-[#F59E0B]/10 text-[#F59E0B] rounded-full flex items-center justify-center text-sm font-bold">👁️</div>
                  <div>
                    <p className="font-semibold text-[#1B2A4A]">Proposal Viewed</p>
                    <p className="text-sm text-[#667085]">{new Date(proposal.viewedAt).toLocaleDateString()} at {new Date(proposal.viewedAt).toLocaleTimeString()}</p>
                  </div>
                </div>
              )}
              {proposal.acceptedAt && (
                <div className="flex items-center gap-4 p-3 bg-[#ECFDF5] border border-[#5DBB63]/20 rounded-lg">
                  <div className="w-10 h-10 bg-[#5DBB63]/10 text-[#5DBB63] rounded-full flex items-center justify-center text-sm font-bold">✓</div>
                  <div>
                    <p className="font-semibold text-[#1B2A4A]">Proposal Accepted</p>
                    <p className="text-sm text-[#667085]">{new Date(proposal.acceptedAt).toLocaleDateString()} at {new Date(proposal.acceptedAt).toLocaleTimeString()}</p>
                  </div>
                </div>
              )}
              {proposal.rejectedAt && (
                <div className="flex items-center gap-4 p-3 bg-[#FEF2F2] border border-[#FECACA]/50 rounded-lg">
                  <div className="w-10 h-10 bg-[#EF4444]/10 text-[#EF4444] rounded-full flex items-center justify-center text-sm font-bold">✗</div>
                  <div>
                    <p className="font-semibold text-[#1B2A4A]">Proposal Rejected</p>
                    <p className="text-sm text-[#667085]">{new Date(proposal.rejectedAt).toLocaleDateString()} at {new Date(proposal.rejectedAt).toLocaleTimeString()}</p>
                    {proposal.rejectionReason && (
                      <p className="text-sm text-[#EF4444] mt-1">Reason: {proposal.rejectionReason}</p>
                    )}
                  </div>
                </div>
              )}
              {proposal.expiresAt && (
                <div className="flex items-center gap-4 p-3 bg-[#FFFBEB] border border-[#F59E0B]/20 rounded-lg">
                  <div className="w-10 h-10 bg-[#F59E0B]/10 text-[#F59E0B] rounded-full flex items-center justify-center text-sm font-bold">⏰</div>
                  <div>
                    <p className="font-semibold text-[#1B2A4A]">Expires</p>
                    <p className="text-sm text-[#667085]">{new Date(proposal.expiresAt).toLocaleDateString()} at {new Date(proposal.expiresAt).toLocaleTimeString()}</p>
                    <p className="text-xs text-[#F59E0B] mt-1">{expiry.text}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}