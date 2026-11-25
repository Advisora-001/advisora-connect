"use client";

import React from "react";
import { Badge } from "@/components/ui/Badge";

interface FractionalProposalCardProps {
  columnId: string;
  proposal: any;
  onViewDetails: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  isLoading?: boolean;
}

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

function getProposalExpiry(expiresAt: string) {
  const expiry = new Date(expiresAt);
  const now = new Date();
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { text: "Expired", expired: true };
  if (diffDays === 0) return { text: "Expires today", expired: false };
  return { text: `Expires in ${diffDays} day${diffDays !== 1 ? "s" : ""}`, expired: false };
}

export default function FractionalProposalCard({
  columnId,
  proposal,
  onViewDetails,
  onUpdateStatus,
  isLoading,
}: FractionalProposalCardProps) {
  const statusColor = STATUS_COLORS[proposal.status] || "default";
  const expiry = getProposalExpiry(proposal.expiresAt);
  const client = proposal.clientId;
  const clientName = client ? `${client.firstName} ${client.lastName}` : "Unknown Client";
  const clientEmail = client?.email;

  const getAvailableActions = () => {
    switch (columnId) {
      case "draft":
        return [
          { label: "Send", status: "sent", variant: "primary" },
          { label: "Delete", status: "withdrawn", variant: "danger" },
        ];
      case "sent":
        return [
          { label: "Withdraw", status: "withdrawn", variant: "warning" },
        ];
      case "viewed":
        return [
          { label: "Withdraw", status: "withdrawn", variant: "warning" },
        ];
      case "accepted":
        return [
          { label: "Activate", status: "active", variant: "success" },
        ];
      default:
        return [];
    }
  };

  const actions = getAvailableActions();

  return (
    <div className="bg-white border border-[#E5EAF0] rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-[#1B2A4A] truncate">
            {clientName}
          </h4>
          <p className="text-sm text-[#667085] truncate">{clientEmail}</p>
        </div>
        <Badge variant={statusColor} size="xs">{STATUS_LABELS[proposal.status] || proposal.status}</Badge>
      </div>

      <div className="space-y-2 text-sm text-[#667085] mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="info" size="xs">{proposal.engagementType || "Monthly Retainer"}</Badge>
          <Badge variant="default" size="xs">{proposal.engagementMonths} months</Badge>
        </div>
        <p className="text-xs text-[#94A3B8]">Retainer: ₦{proposal.monthlyRetainer?.toLocaleString()}/mo</p>
        <p className="text-xs text-[#94A3B8]">Hours/mo: {proposal.hoursPerMonth}</p>
      </div>

      <div className="flex items-center gap-4 text-sm mb-3">
        <Badge variant={statusColor} size="sm">{STATUS_LABELS[proposal.status] || proposal.status}</Badge>
        {["sent", "viewed", "draft"].includes(proposal.status) && (
          <span className={expiry.expired ? 'text-[#EF4444]' : 'text-[#F59E0B]'} >
            {expiry.text}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onViewDetails(proposal._id)}
          className="text-sm text-[#00A6A6] hover:underline font-medium flex-1 text-left"
          disabled={isLoading}
        >
          View Details
        </button>
        {actions.map((action) => (
          <button
            key={action.status}
            onClick={() => onUpdateStatus(proposal._id, action.status)}
            disabled={isLoading}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              action.variant === "primary" ? "bg-[#00A6A6] text-white hover:bg-[#008F8F]" :
              action.variant === "success" ? "bg-[#5DBB63] text-white hover:bg-[#4CA652]" :
              action.variant === "warning" ? "bg-[#F59E0B] text-white hover:bg-[#D97706]" :
              action.variant === "danger" ? "bg-[#EF4444] text-white hover:bg-[#DC2626]" :
              "bg-[#E5EAF0] text-[#667085] hover:bg-[#D0D7E0]"
            }`}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}