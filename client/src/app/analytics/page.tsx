"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLawyerAnalytics } from "@/hooks/useFractional";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Link } from "@/components/ui";
import { showToast } from "@/components/ui/Toaster";

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

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-NG').format(num);
};

function RevenueChart({ data }: { data: Array<{ month: string; revenue: number }> }) {
  if (!data || data.length === 0) {
    return <div className="h-full flex items-center justify-center text-[#667085]">No revenue data</div>;
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
  const chartHeight = 200;
  const barWidth = 40;
  const gap = 20;
  const totalWidth = data.length * (barWidth + gap);

  return (
    <div className="flex items-end justify-center h-full px-4 gap-2" style={{ width: totalWidth }}>
      {data.map((item, index) => {
        const height = Math.max((item.revenue / maxRevenue) * chartHeight, 2);
        return (
          <div key={index} className="flex flex-col items-center h-full">
            <div
              className="bg-[#00A6A6] rounded-t transition-all duration-300 hover:bg-[#008F8F]"
              style={{
                height: `${height}px`,
                width: `${barWidth}px`,
              }}
              title={`${item.month}: ${formatCurrency(item.revenue)}`}
            />
            <span className="text-xs text-[#667085] mt-2 text-center w-[60px] truncate">{item.month}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useLawyerAnalytics();

  const [activeTab, setActiveTab] = useState<"overview" | "engagements" | "proposals" | "hours" | "clients">("overview");
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "12m">("30d");

  if (!user || (user.role !== "lawyer" && user.role !== "professional")) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-2 border-[#1B2A4A] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <div className="text-center py-20 bg-white rounded-xl border border-[#E5EAF0] max-w-md mx-auto px-4">
          <p className="text-[#EF4444] font-semibold mb-2">Failed to load analytics</p>
          <Button variant="outline" onClick={() => refetch()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const analytics = data || {
    revenue: { total: 0, monthlyRecurring: 0, thisMonth: 0, lastMonth: 0, growth: 0, byMonth: [] },
    engagements: { total: 0, active: 0, completed: 0, terminated: 0, newThisMonth: 0, totalClients: 0, activeClients: 0, retentionRate: 0 },
    hours: { totalLogged: 0, thisMonth: 0, capacity: 0, utilization: 0, byCategory: {} },
    proposals: { sent: 0, accepted: 0, rejected: 0, pending: 0, conversionRate: 0 },
    topClients: [],
    recentActivity: [],
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "engagements", label: "Engagements" },
    { id: "proposals", label: "Proposals" },
    { id: "hours", label: "Hours" },
    { id: "clients", label: "Clients" },
  ];

  const STATUS_COLORS: Record<string, "success" | "warning" | "danger" | "info" | "default" | "outline"> = {
    active: "success",
    paused: "warning",
    completed: "default",
    terminated: "danger",
    expired: "warning",
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <section className="bg-[#1B2A4A] text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Analytics Dashboard</h1>
              <p className="text-white/70 mt-2">Track your practice performance and growth</p>
            </div>
            <div className="flex gap-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="px-4 py-2 border border-white/30 text-white bg-transparent rounded-lg hover:bg-white/10 transition-colors"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="12m">Last 12 Months</option>
              </select>
              <Button variant="outline" onClick={() => refetch()} className="whitespace-nowrap">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-6">
        {/* Tab Navigation */}
        <div className="mb-6 border-b border-[#E5EAF0]">
          <nav className="flex gap-8" aria-label="Analytics tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-[#00A6A6] text-[#00A6A6]"
                    : "border-transparent text-[#667085] hover:text-[#1B2A4A] hover:border-[#E5EAF0]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <p className="text-xs text-[#667085] uppercase tracking-wide">Total Revenue</p>
                  <p className="text-3xl font-bold text-[#1B2A4A] mt-1">{formatCurrency(analytics.revenue.total)}</p>
                  <p className="text-xs text-[#94A3B8] mt-1">All time</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-xs text-[#667085] uppercase tracking-wide">Monthly Recurring</p>
                  <p className="text-3xl font-bold text-[#00A6A6] mt-1">{formatCurrency(analytics.revenue.monthlyRecurring)}</p>
                  <p className="text-xs text-[#94A3B8] mt-1">MRR</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-xs text-[#667085] uppercase tracking-wide">This Month</p>
                  <p className="text-3xl font-bold text-[#1B2A4A] mt-1">{formatCurrency(analytics.revenue.thisMonth)}</p>
                  <p className={`text-xs mt-1 ${analytics.revenue.growth >= 0 ? "text-[#5DBB63]" : "text-[#EF4444]"}`}>
                    {analytics.revenue.growth >= 0 ? "+" : ""}{analytics.revenue.growth.toFixed(1)}% vs last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-xs text-[#667085] uppercase tracking-wide">Monthly Recurring</p>
                  <p className="text-3xl font-bold text-[#00A6A6] mt-1">{formatCurrency(analytics.revenue.monthlyRecurring)}</p>
                  <p className="text-xs text-[#94A3B8] mt-1">MRR</p>
                </CardContent>
              </Card>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <p className="text-xs text-[#667085] uppercase tracking-wide">Active Engagements</p>
                  <p className="text-3xl font-bold text-[#5DBB63] mt-1">{analytics.engagements.active}</p>
                  <p className="text-xs text-[#94A3B8] mt-1">of {analytics.engagements.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-xs text-[#667085] uppercase tracking-wide">Total Clients</p>
                  <p className="text-3xl font-bold text-[#1B2A4A] mt-1">{analytics.engagements.totalClients}</p>
                  <p className="text-xs text-[#94A3B8] mt-1">Active: {analytics.engagements.activeClients}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-xs text-[#667085] uppercase tracking-wide">Utilization Rate</p>
                  <p className="text-3xl font-bold text-[#F59E0B] mt-1">{analytics.hours.utilization.toFixed(1)}%</p>
                  <p className="text-xs text-[#94A3B8] mt-1">{analytics.hours.thisMonth}/{analytics.hours.capacity} hrs</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-xs text-[#667085] uppercase tracking-wide">Proposal Conversion</p>
                  <p className="text-3xl font-bold text-[#00A6A6] mt-1">{analytics.proposals.conversionRate.toFixed(1)}%</p>
                  <p className="text-xs text-[#94A3B8] mt-1">{analytics.proposals.accepted}/{analytics.proposals.sent} accepted</p>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Chart */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Revenue Trend (Last 6 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <RevenueChart data={analytics.revenue.byMonth} />
                </div>
              </CardContent>
            </Card>

            {/* Top Clients */}
            <Card>
              <CardHeader>
                <CardTitle>Top Clients by Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.topClients.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.topClients.map((client, index) => (
                      <div key={client.id} className="flex items-center justify-between p-3 bg-[#F5F7FA] rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#00A6A6]/10 text-[#00A6A6] rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-[#1B2A4A]">{client.name}</p>
                            <p className="text-xs text-[#667085]">{client.hours} hrs • {formatCurrency(client.revenue)}</p>
                          </div>
                        </div>
                        <Badge variant="success" size="sm">{formatCurrency(client.revenue)}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-[#667085] py-8">No client data yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Engagements Tab */}
        {activeTab === "engagements" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold text-[#1B2A4A]">Engagements</h2>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="px-4 py-2 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] bg-white text-sm"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="12m">Last 12 Months</option>
              </select>
            </div>

            <Card>
              <CardContent>
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
                ) : data?.engagements.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-xl border border-[#E5EAF0]">
                    <svg className="w-16 h-16 mx-auto text-[#E5EAF0] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-[#1B2A4A] mb-2">No engagements yet</h3>
                    <p className="text-[#667085] mb-6">Start by sending proposals to clients.</p>
                    <Link href="/fractional/my-proposals" className="inline-block bg-[#00A6A6] text-white px-6 py-3 rounded-lg hover:bg-[#008F8F] transition-colors font-semibold">
                      View Proposals
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data?.engagements.map((engagement: any) => {
                      const statusColor = STATUS_COLORS[engagement.status] || "default";
                      const lawyer = engagement.lawyerId;
                      const client = engagement.clientId;
                      const lawyerName = lawyer ? `${lawyer.firstName} ${lawyer.lastName}` : "Unknown Lawyer";
                      const clientName = client ? `${client.firstName} ${client.lastName}` : "Unknown Client";
                      const lawyerPhoto = lawyer?.photo;
                      const clientPhoto = client?.photo;

                      return (
                        <Card key={engagement._id} className="hover:shadow-md transition-shadow">
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
                                </div>
                              </div>

                              {/* Proposal Details */}
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
                                  <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Commitment</p>
                                  <p className="font-bold text-[#1B2A4A]">{engagement.engagementMonths} months</p>
                                </div>
                                <div>
                                  <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Type</p>
                                  <p className="font-bold text-[#1B2A4A]">{engagement.engagementType}</p>
                                </div>
                              </div>

                              {/* Scope & Expiry */}
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
                                  <Badge variant={statusColor} size="sm">{STATUS_LABELS[engagement.status] || engagement.status}</Badge>
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
                                      Log Hours
                                    </Link>
                                    <Link
                                      href={`/engagements/${engagement._id}`}
                                      className="text-sm text-[#00A6A6] hover:underline font-medium"
                                    >
                                      Schedule Meeting
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
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Proposals Tab */}
        {activeTab === "proposals" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[#1B2A4A]">Proposals</h2>

            <Card>
              <CardHeader className="flex flex-row md:flex-row md:items-center md:justify-between">
                <CardTitle>Proposals Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-[#667085] uppercase tracking-wide">Total Sent</p>
                      <p className="text-2xl font-bold text-[#1B2A4A] mt-1">{analytics.proposals.sent}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-[#667085] uppercase tracking-wide">Accepted</p>
                      <p className="text-2xl font-bold text-[#5DBB63] mt-1">{analytics.proposals.accepted}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-[#667085] uppercase tracking-wide">Rejected</p>
                      <p className="text-2xl font-bold text-[#EF4444] mt-1">{analytics.proposals.rejected}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-[#667085] uppercase tracking-wide">Pending</p>
                      <p className="text-2xl font-bold text-[#F59E0B] mt-1">{analytics.proposals.pending}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-[#667085] uppercase tracking-wide">Conversion</p>
                      <p className="text-2xl font-bold text-[#00A6A6] mt-1">{analytics.proposals.conversionRate.toFixed(1)}%</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Hours Tab */}
        {activeTab === "hours" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[#1B2A4A]">Hours Analytics</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <p className="text-xs text-[#667085] uppercase tracking-wide">Total Hours</p>
                  <p className="text-3xl font-bold text-[#1B2A4A] mt-1">{formatNumber(analytics.hours.totalLogged)} hrs</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-xs text-[#667085] uppercase tracking-wide">This Month</p>
                  <p className="text-3xl font-bold text-[#00A6A6] mt-1">{analytics.hours.thisMonth}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-xs text-[#667085] uppercase tracking-wide">Capacity</p>
                  <p className="text-3xl font-bold text-[#F59E0B] mt-1">{analytics.hours.capacity}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-xs text-[#667085] uppercase tracking-wide">Utilization</p>
                  <p className="text-3xl font-bold text-[#F59E0B] mt-1">{analytics.hours.utilization.toFixed(1)}%</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Hours by Category (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(analytics.hours.byCategory).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(analytics.hours.byCategory)
                      .sort((a, b) => b[1] - a[1])
                      .map(([category, hours]) => (
                        <div key={category} className="flex items-center justify-between p-3 bg-[#F5F7FA] rounded-lg">
                          <span className="text-sm font-medium text-[#1B2A4A] capitalize">{category.replace(/_/g, " ")}</span>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-[#1B2A4A]">{hours} hrs</span>
                            <div className="w-48 h-2 bg-[#E5EAF0] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#00A6A6] transition-all"
                                style={{ width: `${Math.min((hours / analytics.hours.capacity) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-[#667085] py-8">No hours logged yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Clients Tab */}
        {activeTab === "clients" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[#1B2A4A]">Clients</h2>

            <Card>
              <CardHeader>
                <CardTitle>Client List</CardTitle>
              </CardHeader>
              <CardContent>
                {data?.engagements.length > 0 ? (
                  <div className="space-y-3">
                    {data?.engagements.map((engagement: any) => {
                      const client = engagement.clientId;
                      const clientName = client ? `${client.firstName} ${client.lastName}` : "Unknown Client";
                      const clientEmail = client?.email;
                      const statusColor = STATUS_COLORS[engagement.status] || "default";

                      return (
                        <div key={engagement._id} className="p-4 bg-white border border-[#E5EAF0] rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-[#00A6A6]/10 text-[#00A6A6] flex items-center justify-center text-lg font-bold">
                                {clientName.split(" ").map(n => n[0]).join("")}
                              </div>
                              <div>
                                <h3 className="font-semibold text-[#1B2A4A]">{clientName}</h3>
                                <p className="text-sm text-[#667085]">{clientEmail}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Monthly Retainer</p>
                                <p className="font-bold text-[#1B2A4A]">₦{engagement.monthlyRetainer?.toLocaleString()}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Hours Used</p>
                                <p className="font-bold text-[#1B2A4A]">{engagement.hoursUsedTotal} hrs</p>
                              </div>
                              <Badge variant={statusColor} size="sm">{STATUS_LABELS[engagement.status] || engagement.status}</Badge>
                              <Link
                                href={`/engagements/${engagement._id}`}
                                className="text-sm text-[#00A6A6] hover:underline font-medium"
                              >
                                View
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-white rounded-xl border border-[#E5EAF0]">
                      <svg className="w-16 h-16 mx-auto text-[#E5EAF0] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="text-lg font-semibold text-[#1B2A4A] mb-2">No clients yet</h3>
                      <p className="text-[#667085] mb-6">You don't have any fractional GC engagements yet.</p>
                      <Link href="/fractional/request" className="inline-block bg-[#00A6A6] text-white px-6 py-3 rounded-lg hover:bg-[#008F8F] transition-colors font-semibold">
                        Request Fractional GC
                      </Link>
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(num: number) {
  return new Intl.NumberFormat('en-NG').format(num);
}