"use client";

import React from "react";

interface VerificationCardProps {
  columnId: string;
  lawyer: {
    _id: string;
    userId?: {
      firstName?: string;
      lastName?: string;
      email?: string;
    };
    city?: string;
    state?: string;
    barNumber?: string;
    practiceAreas?: string[];
  };
  onViewDetails: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isLoading?: boolean;
}

export default function VerificationCard({
  columnId,
  lawyer,
  onViewDetails,
  onApprove,
  onReject,
  isLoading = false,
}: VerificationCardProps) {
  const firstName = lawyer.userId?.firstName || "";
  const lastName = lawyer.userId?.lastName || "";
  const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();

  return (
    <div
      className="bg-white rounded-lg border border-[#E5EAF0] p-4 hover:shadow-md transition-shadow"
      data-column-id={columnId}
    >
      {/* Header with Avatar */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-[#1B2A4A] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#1B2A4A] text-sm truncate">
            {firstName} {lastName}
          </p>
          <p className="text-xs text-[#667085] truncate">
            {lawyer.userId?.email}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4 text-xs">
        <div>
          <p className="text-[#94A3B8] font-medium">Bar Number</p>
          <p className="text-[#1B2A4A] font-semibold">
            {lawyer.barNumber || "N/A"}
          </p>
        </div>
        <div>
          <p className="text-[#94A3B8] font-medium">Location</p>
          <p className="text-[#1B2A4A] font-semibold">
            {lawyer.city}, {lawyer.state}
          </p>
        </div>
        {lawyer.practiceAreas && lawyer.practiceAreas.length > 0 && (
          <div>
            <p className="text-[#94A3B8] font-medium">Practice Areas</p>
            <p className="text-[#1B2A4A] font-semibold line-clamp-2">
              {lawyer.practiceAreas.slice(0, 2).join(", ")}
              {lawyer.practiceAreas.length > 2 ? "..." : ""}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onViewDetails(lawyer._id)}
          disabled={isLoading}
          className="flex-1 px-2 py-2 bg-[#EFF6FF] text-[#2476B8] rounded-lg text-xs font-semibold hover:bg-[#DBEAFE] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          View
        </button>
        <button
          onClick={() => onApprove(lawyer._id)}
          disabled={isLoading}
          className="flex-1 px-2 py-2 bg-[#ECFDF5] text-[#5DBB63] rounded-lg text-xs font-semibold hover:bg-[#D1FAE5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "..." : "Approve"}
        </button>
        <button
          onClick={() => onReject(lawyer._id)}
          disabled={isLoading}
          className="flex-1 px-2 py-2 bg-[#FEF2F2] text-[#EF4444] rounded-lg text-xs font-semibold hover:bg-[#FEE2E2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
