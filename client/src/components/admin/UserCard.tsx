"use client";

import React from "react";

interface UserCardProps {
  columnId: string;
  user: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
    isActive?: boolean;
    createdAt?: string;
  };
  onManage?: (id: string) => void;
  onToggleStatus: (id: string) => void;
  isLoading?: boolean;
  canToggleStatus?: boolean;
}

export default function UserCard({
  columnId,
  user,
  onManage,
  onToggleStatus,
  isLoading = false,
  canToggleStatus = true,
}: UserCardProps) {
  const firstName = user.firstName || "";
  const lastName = user.lastName || "";
  const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();

  const roleColors: Record<string, { bg: string; text: string }> = {
    admin: { bg: "bg-[#EEF2F7]", text: "text-[#1B2A4A]" },
    lawyer: { bg: "bg-[#EFF6FF]", text: "text-[#1E40AF]" },
    client: { bg: "bg-[#ECFDF5]", text: "text-[#166534]" },
  };

  const roleColor = roleColors[user.role || "client"] || roleColors.client;

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
          <p className="text-xs text-[#667085] truncate">{user.email}</p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4 text-xs">
        <div className="flex justify-between items-center">
          <p className="text-[#94A3B8] font-medium">Role</p>
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${roleColor.bg} ${roleColor.text}`}
          >
            {user.role || "client"}
          </span>
        </div>
        {user.createdAt && (
          <div>
            <p className="text-[#94A3B8] font-medium">Joined</p>
            <p className="text-[#1B2A4A] font-semibold">
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {user.role === "lawyer" && onManage && (
          <button
            onClick={() => onManage(user._id)}
            disabled={isLoading}
            className="flex-1 px-2 py-2 bg-[#EFF6FF] text-[#2476B8] rounded-lg text-xs font-semibold hover:bg-[#DBEAFE] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Manage
          </button>
        )}
        <button
          onClick={() => onToggleStatus(user._id)}
          disabled={isLoading || !canToggleStatus}
          className={`flex-1 px-2 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            user.isActive
              ? "bg-[#FEF2F2] text-[#EF4444] hover:bg-[#FEE2E2]"
              : "bg-[#ECFDF5] text-[#5DBB63] hover:bg-[#D1FAE5]"
          }`}
        >
          {isLoading ? "..." : user.isActive ? "Suspend" : "Activate"}
        </button>
      </div>
    </div>
  );
}
