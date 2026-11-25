"use client";

import React from "react";
import { Badge } from "@/components/ui/Badge";

interface VolunteerLawyerCardProps {
  columnId: string;
  volunteer: any;
  onViewDetails: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  isLoading?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
  withdrawn: "Withdrawn",
};

const STATUS_COLORS: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  suspended: "default",
  withdrawn: "default",
};

const COMMITMENT_LABELS: Record<string, string> = {
  occasional: "Occasional",
  regular: "Regular",
  dedicated: "Dedicated",
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

export default function VolunteerLawyerCard({
  columnId,
  volunteer,
  onViewDetails,
  onUpdateStatus,
  isLoading,
}: VolunteerLawyerCardProps) {
  const statusColor = STATUS_COLORS[volunteer.status] || "default";

  const getAvailableActions = () => {
    switch (columnId) {
      case "pending":
        return [
          { label: "Approve", status: "approved", variant: "success" },
          { label: "Reject", status: "rejected", variant: "danger" },
        ];
      case "approved":
        return [
          { label: "Suspend", status: "suspended", variant: "warning" },
        ];
      case "suspended":
        return [
          { label: "Reactivate", status: "approved", variant: "success" },
        ];
      case "rejected":
        return [
          { label: "Reconsider", status: "pending", variant: "primary" },
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
            {volunteer.firstName} {volunteer.lastName}
          </h4>
          <p className="text-sm text-[#667085] truncate">{volunteer.email}</p>
        </div>
        <Badge variant={statusColor} size="xs">{STATUS_LABELS[volunteer.status] || volunteer.status}</Badge>
      </div>

      <div className="space-y-2 text-sm text-[#667085] mb-3">
        <p className="text-xs">License: {volunteer.licenseType?.toUpperCase()} - {volunteer.licenseNumber}</p>
        <p className="text-xs">Year of Call: {volunteer.yearOfCall} | {volunteer.jurisdiction}</p>
        <div className="flex items-center gap-1 flex-wrap">
          {volunteer.preferredCategories?.slice(0, 3).map((cat: string) => (
            <Badge key={cat} variant="info" size="xs">{CATEGORY_LABELS[cat] || cat}</Badge>
          ))}
          {volunteer.preferredCategories && volunteer.preferredCategories.length > 3 && (
            <Badge variant="default" size="xs">+{volunteer.preferredCategories.length - 3} more</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" size="xs">{COMMITMENT_LABELS[volunteer.commitmentLevel] || volunteer.commitmentLevel}</Badge>
          <Badge variant="info" size="xs">{volunteer.maxCasesPerMonth} cases/mo</Badge>
          <Badge variant="default" size="xs">{volunteer.availabilityHoursPerWeek} hrs/wk</Badge>
        </div>
        {volunteer.languages && volunteer.languages.length > 0 && (
          <p className="text-xs">Languages: {volunteer.languages.join(", ")}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onViewDetails(volunteer._id)}
          className="text-sm text-[#00A6A6] hover:underline font-medium flex-1 text-left"
          disabled={isLoading}
        >
          View Details
        </button>
        {actions.map((action) => (
          <button
            key={action.status}
            onClick={() => onUpdateStatus(volunteer._id, action.status)}
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