"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useLawyerFractionalProposals, useCreateFractionalProposal } from "@/hooks/useFractional";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Input, Select } from "@/components/ui";
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

const ENGAGEMENT_TYPES = [
  "Monthly Retainer",
  "Project-based",
  "Interim GC",
  "Board Advisor",
];

const PAYMENT_TERMS = [
  { value: "monthly_advance", label: "Monthly in Advance" },
  { value: "monthly_arrears", label: "Monthly in Arrears" },
  { value: "quarterly_advance", label: "Quarterly in Advance" },
];

const SCOPE_OPTIONS = [
  "Contract Review & Negotiation",
  "Compliance & Regulatory",
  "Corporate Governance",
  "Employment Law",
  "IP Protection",
  "Fundraising Support",
  "M&A Support",
  "Risk Management",
  "Policy Development",
  "Board Meeting Prep",
];

export default function LawyerMyProposalsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "accepted" | "rejected">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingForLead, setCreatingForLead] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    leadId: "",
    monthlyRetainer: "",
    hoursPerMonth: "",
    engagementMonths: 3,
    startDate: "",
    autoRenew: true,
    industries: [] as string[],
    companyStages: [] as string[],
    engagementType: "Monthly Retainer",
    scopeOfWork: [] as string[],
    customScope: "",
    paymentTerms: "monthly_advance",
    terminationNoticeDays: 30,
    includesOutOfScopeRate: false,
    outOfScopeHourlyRate: "",
    notes: "",
  });
  const createMutation = useCreateFractionalProposal();
  const { data, isLoading, refetch } = useLawyerFractionalProposals();

  useEffect(() => {
    if (!user || (user.role !== "lawyer" && user.role !== "professional")) {
      // AuthContext handles redirect
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

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        ...formData,
        monthlyRetainer: parseInt(formData.monthlyRetainer),
        hoursPerMonth: parseInt(formData.hoursPerMonth),
        engagementMonths: parseInt(formData.engagementMonths),
        autoRenew: formData.autoRenew,
        terminationNoticeDays: parseInt(formData.terminationNoticeDays),
        includesOutOfScopeRate: formData.includesOutOfScopeRate,
        outOfScopeHourlyRate: formData.outOfScopeHourlyRate ? parseInt(formData.outOfScopeHourlyRate) : undefined,
      });
      setShowCreateModal(false);
      setFormData({
        leadId: "",
        monthlyRetainer: "",
        hoursPerMonth: "",
        engagementMonths: 3,
        startDate: "",
        autoRenew: true,
        industries: [],
        companyStages: [],
        engagementType: "Monthly Retainer",
        scopeOfWork: [],
        customScope: "",
        paymentTerms: "monthly_advance",
        terminationNoticeDays: 30,
        includesOutOfScopeRate: false,
        outOfScopeHourlyRate: "",
        notes: "",
      });
      await refetch();
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Failed to create proposal");
    }
  };

  const handleToggleArray = (field: string, value: string) => {
    const current = formData[field as keyof typeof formData] as string[];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setFormData((prev) => ({ ...prev, [field]: updated }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const openCreateModal = (leadId: string) => {
    setCreatingForLead(leadId);
    setFormData((prev) => ({ ...prev, leadId }));
    setShowCreateModal(true);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <section className="bg-[#1B2A4A] text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">My Proposals</h1>
              <p className="text-white/70 mt-2">Manage proposals sent to clients</p>
            </div>
            <Button variant="primary" onClick={() => { setCreatingForLead(null); setShowCreateModal(true); }}>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Proposal
            </Button>
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
                ? "You haven't sent any proposals yet. Create a proposal for a fractional GC request."
                : activeTab === "accepted"
                ? "No accepted proposals yet."
                : "No rejected proposals."}
            </p>
            {activeTab === "pending" && (
              <Button variant="primary" onClick={() => { setCreatingForLead(null); setShowCreateModal(true); }}>
                Create Your First Proposal
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProposals.map((proposal: any) => {
              const statusColor = STATUS_COLORS[proposal.status] || "default";
              const expiry = getProposalExpiry(proposal.expiresAt);
              const client = proposal.clientId;
              const clientName = client ? `${client.firstName} ${client.lastName}` : "Unknown Client";
              const clientEmail = client?.email;
              const lead = proposal.leadId;
              const companyName = lead?.fractionalDetails?.companyName;

              return (
                <Card key={proposal._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      {/* Client Info */}
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-[#00A6A6]/10 text-[#00A6A6] flex items-center justify-center text-lg font-bold">
                          {clientName.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#1B2A4A]">{clientName}</h3>
                          <p className="text-sm text-[#667085]">{clientEmail}</p>
                          {companyName && <p className="text-sm text-[#667085]">{companyName}</p>}
                        </div>
                      </div>

                      {/* Proposal Details */}
                      <div className="flex-1 grid md:grid-cols-4 gap-4 md:gap-6">
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
                          <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Type</p>
                          <p className="font-bold text-[#1B2A4A]">{proposal.engagementType}</p>
                        </div>
                      </div>

                      {/* Scope & Expiry */}
                      <div className="flex-1 md:col-span-4 pt-4 border-t border-[#E5EAF0]">
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
                        {["draft"].includes(proposal.status) && (
                          <Button variant="primary" size="sm" onClick={() => {}} disabled>
                            Send Proposal
                          </Button>
                        )}
                        {["sent", "viewed"].includes(proposal.status) && !expiry.expired && (
                          <Button variant="danger" size="sm" onClick={() => {}}>
                            Withdraw
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