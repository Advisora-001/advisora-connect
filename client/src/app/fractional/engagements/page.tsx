"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useClientEngagements } from "@/hooks/useFractional";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@/components/ui";

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  terminated: "Terminated",
  expired: "Expired",
};

const STATUS_COLORS: Record<string, "success" | "warning" | "danger" | "info" | "default" | "outline"> = {
  active: "success",
  paused: "warning",
  completed: "default",
  terminated: "danger",
  expired: "warning",
};

export default function ClientEngagementsPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data, isLoading, refetch } = useClientEngagements({ status: statusFilter === "all" ? undefined : statusFilter });

  const engagements = data?.engagements || [];
  const pagination = data?.pagination;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <section className="bg-[#1B2A4A] text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">My Engagements</h1>
              <p className="text-white/70 mt-2">Manage your fractional GC engagements</p>
            </div>
            <Link href="/fractional/request" className="inline-flex items-center gap-2 px-4 py-2 border border-white/30 text-white rounded-lg hover:bg-white/10 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Request Fractional GC
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-6">
        {/* Status Filter */}
        <div className="mb-6 flex items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] bg-white text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="terminated">Terminated</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        {/* Engagements List */}
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
        ) : engagements.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-[#E5EAF0]">
            <svg className="w-16 h-16 mx-auto text-[#E5EAF0] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-[#1B2A4A] mb-2">No engagements yet</h3>
            <p className="text-[#667085] mb-6">You don't have any fractional GC engagements yet.</p>
            <Link href="/fractional/request" className="inline-block bg-[#00A6A6] text-white px-6 py-3 rounded-lg hover:bg-[#008F8F] transition-colors font-semibold">
              Request Fractional GC Services
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {engagements.map((engagement: any) => {
              const statusColor = STATUS_COLORS[engagement.status] || "default";
              const lawyer = engagement.lawyerId;
              const lawyerName = lawyer ? `${lawyer.firstName} ${lawyer.lastName}` : "Unknown Lawyer";
              const lawyerPhoto = lawyer?.photo;
              const lawyerCity = lawyer?.city;
              const lawyerState = lawyer?.state;

              return (
                <Card key={engagement._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      {/* Lawyer Info */}
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-[#1B2A4A] flex items-center justify-center text-white text-lg font-bold">
                          {lawyerPhoto ? (
                            <img src={lawyerPhoto} alt={lawyerName} className="w-full h-full object-cover" />
                          ) : (
                            <span>{lawyerName.split(" ").map(n => n[0]).join("")}</span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#1B2A4A]">{lawyerName}</h3>
                          <p className="text-sm text-[#667085]">{lawyerCity}, {lawyerState}</p>
                        </div>
                      </div>

                      {/* Engagement Details */}
                      <div className="flex-1 grid md:grid-cols-4 gap-4 md:gap-6">
                        <div>
                          <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Monthly Retainer</p>
                          <p className="font-bold text-[#1B2A4A] text-lg">₦{engagement.monthlyRetainer?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Hours/Month</p>
                          <p className="font-bold text-[#1B2A4A]">{engagement.hoursPerMonth}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Hours Used</p>
                          <p className="font-bold text-[#1B2A4A]">{engagement.hoursUsedThisMonth}/{engagement.hoursPerMonth} hrs</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Commitment</p>
                          <p className="font-bold text-[#1B2A4A]">{engagement.engagementMonths} months</p>
                        </div>
                      </div>

                      {/* Status & Progress */}
                      <div className="flex-1 md:col-span-4 pt-4 border-t border-[#E5EAF0]">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {engagement.scopeOfWork?.slice(0, 5).map((scope: string) => (
                            <Badge key={scope} variant="info" size="xs">{scope}</Badge>
                          ))}
                          {engagement.scopeOfWork && engagement.scopeOfWork.length > 5 && (
                            <Badge variant="default" size="xs">+{engagement.scopeOfWork.length - 5} more</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <Badge variant={STATUS_COLORS[engagement.status] || "default"} size="sm">{engagement.status}</Badge>
                          <span className="text-[#94A3B8]">{engagement.hoursUsedThisMonth}/{engagement.hoursPerMonth} hrs this month</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <Link
                          href={`/engagements/${engagement._id}`}
                          className="text-sm text-[#00A6A6] hover:underline font-medium"
                        >
                          View Details
                        </Link>
                        {engagement.status === "active" && (
                          <>
                            <Link
                              href={`/engagements/${engagement._id}`}
                              className="text-sm text-[#00A6A6] hover:underline font-medium"
                            >
                              View Details
                            </Link>
                            <Link
                              href={`/engagements/${engagement._id}`}
                              className="text-sm text-[#00A6A6] hover:underline font-medium"
                            >
                              Log Hours
                            </Link>
                          </>
                        )}
                        {["completed", "terminated", "expired"].includes(engagement.status) && (
                          <Badge variant="default" size="sm" className="text-[#667085]">
                            {STATUS_LABELS[engagement.status] || engagement.status}
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