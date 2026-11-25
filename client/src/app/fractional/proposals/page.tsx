"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useClientFractionalProposals, useAcceptFractionalProposal, useRejectFractionalProposal } from "@/hooks/useFractional";
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

export default function ClientProposalsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "accepted" | "rejected">("all");
  const acceptMutation = useAcceptFractionalProposal();
  const rejectMutation = useRejectFractionalProposal();
  const { data, isLoading, refetch } = useClientFractionalProposals();

  useEffect(() => {
    if (!user) {
      // The page will redirect via AuthContext
    }
  }, [user]);

  const proposals = data?.proposals || [];
  const filteredProposals = activeTab === "all"
    ? proposals
    : proposals.filter((p: any) => {
        if (activeTab === "pending") return ["sent", "viewed", "draft"].includes(p.status);
        if (activeTab === "accepted") return ["accepted", "active"].includes(p.status);
        if (activeTab === "rejected") return ["rejected", "expired", "withdrawn"].includes(p.status);
        return false;
      });

  const handleAccept = async (proposalId: string) => {
    try {
      await acceptMutation.mutateAsync(proposalId);
      await refetch();
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Failed to accept proposal");
    }
  };

  const handleReject = async (proposalId: string) => {
    const notes = prompt("Optional: Provide a reason for rejection (this will be shared with the lawyer)");
    if (notes === null) return; // User cancelled

    try {
      await rejectMutation.mutateAsync({ id: proposalId, clientNotes: notes || undefined });
      await refetch();
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Failed to reject proposal");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <section className="bg-[#1B2A4A] text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Fractional GC Proposals</h1>
              <p className="text-white/70 mt-2">Review and manage proposals from lawyers</p>
            </div>
            <Link href="/professionals" className="inline-flex items-center gap-2 px-4 py-2 border border-white/30 text-white rounded-lg hover:bg-white/10 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Find Lawyers
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-6">
        {/* Tab Navigation */}
        <div className="mb-6 border-b border-[#E5EAF0]">
          <nav className="flex gap-8" aria-label="Proposal status tabs">
            {[
              { id: "all", label: "All" },
              { id: "pending", label: "Pending" },
              { id: "accepted", label: "Accepted" },
              { id: "rejected", label: "Rejected" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-[#00A6A6] text-[#00A6A6]"
                    : "border-transparent text-[#667085] hover:text-[#1B2A4A] hover:border-[#E5EAF0]"
                }`}
              >
                {tab.label}
                {(
                  activeTab === "all"
                    ? proposals.length
                    : activeTab === "pending"
                    ? proposals.filter((p: any) => ["sent", "viewed", "draft"].includes(p.status)).length
                    : activeTab === "accepted"
                    ? proposals.filter((p: any) => ["accepted", "active"].includes(p.status)).length
                    : proposals.filter((p: any) => ["rejected", "expired", "withdrawn"].includes(p.status)).length
                ) > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-[#E5EAF0] text-[#667085]">
                    {activeTab === "all"
                      ? proposals.length
                      : activeTab === "pending"
                      ? proposals.filter((p: any) => ["sent", "viewed", "draft"].includes(p.status)).length
                      : activeTab === "accepted"
                      ? proposals.filter((p: any) => ["accepted", "active"].includes(p.status)).length
                      : proposals.filter((p: any) => ["rejected", "expired", "withdrawn"].includes(p.status)).length
                    }
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Proposals List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-[#E5EAF0] rounded w-1/4 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-[#E5EAF0] rounded w-1/2"></div>
                    <div className="h-4 bg-[#E5EAF0] rounded w-3/4"></div>
                    <div className="h-4 bg-[#E5EAF0] rounded w-1/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProposals.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-[#E5EAF0]">
            <svg className="w-16 h-16 mx-auto text-[#E5EAF0] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-[#1B2A4A] mb-2">No proposals found</h3>
            <p className="text-[#667085] mb-6">
              {activeTab === "pending"
                ? "You don't have any pending proposals. Request fractional GC services from a lawyer to receive proposals."
                : activeTab === "accepted"
                ? "No accepted proposals yet."
                : "No rejected proposals."}
            </p>
            {activeTab === "pending" && (
              <Link href="/professionals" className="inline-block bg-[#00A6A6] text-white px-6 py-3 rounded-lg hover:bg-[#008F8F] transition-colors font-semibold">
                Find Fractional GC Lawyers
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProposals.map((proposal: any) => {
              const statusColor = STATUS_COLORS[proposal.status] || "default";
              const expiry = getProposalExpiry(proposal.expiresAt);
              const lawyer = proposal.lawyerId;
              const lawyerName = lawyer ? `${lawyer.firstName} ${lawyer.lastName}` : "Unknown Lawyer";
              const lawyerPhoto = lawyer?.photo;
              const lawyerCity = lawyer?.city;
              const lawyerState = lawyer?.state;

              return (
                <Card key={proposal._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      {/* Lawyer Info */}
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-[#1B2A4A] flex items-center justify-center text-white text-lg font-bold">
                          {lawyerPhoto ? (
                            <img src={lawyerPhoto} alt={lawyerName} className="w-full h-full object-cover" />
                          ) : (
                            <span>{lawyerName.split(" ").map(n => n[0]).join("")}</span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#1B2A4A]">{lawyerName}</h3>
                          <p className="text-sm text-[#667085]">{lawyerCity}, {lawyerState}</p>
                          <p className="text-sm text-[#667085]">
                            {ENGAGEMENT_TYPE_LABELS[proposal.engagementType] || proposal.engagementType}
                          </p>
                        </div>
                      </div>

                      {/* Proposal Details */}
                      <div className="flex-1 grid md:grid-cols-3 gap-4 md:gap-6">
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
                      </div>

                      {/* Scope & Expiry */}
                      <div className="flex-1 md:col-span-3 pt-4 border-t border-[#E5EAF0]">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {proposal.scopeOfWork?.slice(0, 5).map((scope: string) => (
                            <Badge key={scope} variant="info" size="xs">{scope}</Badge>
                          ))}
                          {proposal.scopeOfWork && proposal.scopeOfWork.length > 5 && (
                            <Badge variant="default" size="xs">+{proposal.scopeOfWork.length - 5} more</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <Badge variant={statusColor} size="sm">{STATUS_LABELS[proposal.status] || proposal.status}</Badge>
                          {["sent", "viewed", "draft"].includes(proposal.status) && (
                            <span className={expiry.expired ? 'text-[#EF4444]' : 'text-[#F59E0B]'} >
                              {expiry.text}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <Link
                          href={`/fractional/proposals/${proposal._id}`}
                          className="text-sm text-[#00A6A6] hover:underline font-medium"
                        >
                          View Details
                        </Link>
                        {["sent", "viewed", "draft"].includes(proposal.status) && !expiry.expired && (
                          <>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleAccept(proposal._id)}
                              disabled={acceptMutation.isPending}
                            >
                              {acceptMutation.isPending ? "Accepting..." : "Accept"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReject(proposal._id)}
                              disabled={rejectMutation.isPending}
                            >
                              {rejectMutation.isPending ? "..." : "Reject"}
                            </Button>
                          </>
                        )}
                        {proposal.status === "accepted" && !proposal.subscriptionId && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAccept(proposal._id)}
                            disabled={acceptMutation.isPending}
                          >
                            {acceptMutation.isPending ? "Processing..." : "Complete Payment"}
                          </Button>
                        )}
                        {["accepted", "active"].includes(proposal.status) && proposal.subscriptionId && (
                          <Badge variant="success" size="sm">Active Engagement</Badge>
                        )}
                        {["rejected", "expired", "withdrawn"].includes(proposal.status) && (
                          <Badge variant="default" size="sm" className="text-[#667085]">
                            {STATUS_LABELS[proposal.status] || proposal.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}