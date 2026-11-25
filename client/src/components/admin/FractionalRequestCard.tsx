"use client";

import React from "react";
import { Badge } from "@/components/ui/Badge";

interface FractionalRequestCardProps {
  columnId: string;
  request: any;
  onViewDetails: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  isLoading?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  under_review: "Under Review",
  proposal_sent: "Proposal Sent",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
  withdrawn: "Withdrawn",
};

const STATUS_COLORS: Record<string, "success" | "warning" | "danger" | "info" | "default" | "outline"> = {
  pending: "info",
  under_review: "warning",
  proposal_sent: "warning",
  accepted: "success",
  rejected: "danger",
  expired: "warning",
  withdrawn: "default",
};

const URGENCY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const URGENCY_COLORS: Record<string, "success" | "warning" | "danger" | "info" | "default" | "outline"> = {
  low: "success",
  medium: "info",
  high: "warning",
  critical: "danger",
};

const CATEGORY_LABELS: Record<string, string> = {
  domestic_violence: "Domestic Violence",
  sexual_abuse: "Sexual Abuse",
  child_abuse: "Child Abuse",
  child_custody: "Child Custody",
  women_rights: "Women's Rights",
  exceptional_hardship: "Exceptional Hardship",
  other: "Other",
};

export default function FractionalRequestCard({
  columnId,
  request,
  onViewDetails,
  onUpdateStatus,
  isLoading,
}: FractionalRequestCardProps) {
  const statusColor = STATUS_COLORS[request.status] || "default";
  const urgencyColor = URGENCY_COLORS[request.urgencyLevel] || "default";

  const getAvailableActions = () => {
    switch (columnId) {
      case "pending":
        return [
          { label: "Start Review", status: "under_review", variant: "primary" },
          { label: "Reject", status: "rejected", variant: "danger" },
        ];
      case "under_review":
        return [
          { label: "Send Proposal", status: "proposal_sent", variant: "success" },
          { label: "Request More Info", status: "under_review", variant: "warning" },
          { label: "Reject", status: "rejected", variant: "danger" },
        ];
      case "proposal_sent":
        return [
          { label: "Mark Accepted", status: "accepted", variant: "success" },
          { label: "Reject", status: "rejected", variant: "danger" },
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
            {request.clientName || `${request.firstName} ${request.lastName}`}
          </h4>
          <p className="text-sm text-[#667085] truncate">{request.email}</p>
        </div>
        <Badge variant={urgencyColor} size="xs">{URGENCY_LABELS[request.urgencyLevel] || request.urgencyLevel}</Badge>
      </div>

      <div className="space-y-2 text-sm text-[#667085] mb-3">
        <p className="truncate">{request.legalIssueDescription?.substring(0, 100)}...</p>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="info" size="xs">{CATEGORY_LABELS[request.legalIssueCategory] || request.legalIssueCategory}</Badge>
          <Badge variant={statusColor} size="xs">{STATUS_LABELS[request.status] || request.status}</Badge>
        </div>
        <p className="text-xs text-[#94A3B8]">Submitted: {new Date(request.createdAt).toLocaleDateString()}</p>
      </div>

      {request.fractionalDetails && (
        <div className="mb-3 p-2 bg-[#F5F7FA] rounded-lg">
          <p className="text-xs text-[#667085] truncate">{request.financialHardshipDetails?.substring(0, 80)}...</p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => onViewDetails(request._id)}
          className="text-sm text-[#00A6A6] hover:underline font-medium flex-1 text-left"
          disabled={isLoading}
        >
          View Details
        </button>
        {actions.map((action) => (
          <button
            key={action.status}
            onClick={() => onUpdateStatus(request._id, action.status)}
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