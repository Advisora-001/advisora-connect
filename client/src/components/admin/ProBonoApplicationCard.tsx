"use client";

import React from "react";
import { Badge } from "@/components/ui/Badge";

interface ProBonoApplicationCardProps {
  columnId: string;
  application: any;
  onViewDetails: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  isLoading?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  more_info_needed: "More Info Needed",
  approved_consultation: "Approved: Consultation",
  approved_limited: "Approved: Limited",
  approved_representation: "Approved: Representation",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const STATUS_COLORS: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
  submitted: "info",
  under_review: "warning",
  more_info_needed: "warning",
  approved_consultation: "success",
  approved_limited: "success",
  approved_representation: "success",
  rejected: "danger",
  withdrawn: "default",
};

const URGENCY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const URGENCY_COLORS: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
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

export default function ProBonoApplicationCard({
  columnId,
  application,
  onViewDetails,
  onUpdateStatus,
  isLoading,
}: ProBonoApplicationCardProps) {
  const statusColor = STATUS_COLORS[application.status] || "default";
  const urgencyColor = URGENCY_COLORS[application.urgencyLevel] || "default";

  const getAvailableActions = () => {
    switch (columnId) {
      case "submitted":
        return [
          { label: "Start Review", status: "under_review", variant: "primary" },
          { label: "Reject", status: "rejected", variant: "danger" },
        ];
      case "under_review":
        return [
          { label: "Request More Info", status: "more_info_needed", variant: "warning" },
          { label: "Approve: Consultation", status: "approved_consultation", variant: "success" },
          { label: "Approve: Limited", status: "approved_limited", variant: "success" },
          { label: "Approve: Representation", status: "approved_representation", variant: "success" },
          { label: "Reject", status: "rejected", variant: "danger" },
        ];
      case "more_info_needed":
        return [
          { label: "Resume Review", status: "under_review", variant: "primary" },
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
            {application.firstName} {application.lastName}
          </h4>
          <p className="text-sm text-[#667085] truncate">{application.email}</p>
        </div>
        <Badge variant={urgencyColor} size="xs">{URGENCY_LABELS[application.urgencyLevel] || application.urgencyLevel}</Badge>
      </div>

      <div className="space-y-2 text-sm text-[#667085] mb-3">
        <p className="truncate">{application.legalIssueDescription?.substring(0, 100)}...</p>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="info" size="xs">{CATEGORY_LABELS[application.legalIssueCategory] || application.legalIssueCategory}</Badge>
          <Badge variant={statusColor} size="xs">{STATUS_LABELS[application.status] || application.status}</Badge>
        </div>
        <p className="text-xs text-[#94A3B8]">Submitted: {new Date(application.createdAt).toLocaleDateString()}</p>
      </div>

      {application.financialHardshipDetails && (
        <div className="mb-3 p-2 bg-[#F5F7FA] rounded-lg">
          <p className="text-xs text-[#667085] truncate">{application.financialHardshipDetails.substring(0, 80)}...</p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => onViewDetails(application._id)}
          className="text-sm text-[#00A6A6] hover:underline font-medium flex-1 text-left"
          disabled={isLoading}
        >
          View Details
        </button>
        {actions.map((action) => (
          <button
            key={action.status}
            onClick={() => onUpdateStatus(application._id, action.status)}
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