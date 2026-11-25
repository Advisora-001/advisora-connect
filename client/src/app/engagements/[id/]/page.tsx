"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useEngagement, useAddHourEntry, useAddMeeting, useUpdateEngagementStatus, useRenewEngagement } from "@/hooks/useFractional";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Input, Select } from "@/components/ui";
import { showToast } from "@/components/ui/Toaster";
import { getProposalExpiry } from "@/lib/utils";

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

const HOUR_CATEGORIES = [
  "contract_review",
  "meeting",
  "research",
  "drafting",
  "consultation",
  "compliance",
  "governance",
  "fundraising",
  "ip_management",
  "employment_law",
  "other",
];

const MEETING_TYPES = [
  { value: "video", label: "Video Call" },
  { value: "audio", label: "Audio Call" },
  { value: "in-person", label: "In-Person" },
];

function getProposalExpiry(expiresAt: string) {
  const expiry = new Date(expiresAt);
  const now = new Date();
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { text: "Expired", expired: true };
  if (diffDays === 0) return { text: "Expires today", expired: false };
  return { text: `Expires in ${diffDays} day${diffDays !== 1 ? "s" : ""}`, expired: false };
}

export default function EngagementDetailPage() {
  const params = useParams();
  const engagementId = params.id as string;
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "hours" | "meetings" | "billing">("overview");
  const [showLogHours, setShowLogHours] = useState(false);
  const [showScheduleMeeting, setShowScheduleMeeting] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");

  const { data, isLoading, error, refetch } = useEngagement(engagementId, !!engagementId);
  const addHourEntry = useAddHourEntry();
  const addMeeting = useAddMeeting();
  const updateStatus = useUpdateEngagementStatus();
  const renewEngagement = useRenewEngagement();

  const [hourForm, setHourForm] = useState({
    date: new Date().toISOString().split("T")[0],
    hours: "",
    description: "",
    category: "other",
  });
  const [meetingForm, setMeetingForm] = useState({
    date: new Date().toISOString().split("T")[0],
    time: "09:00",
    duration: "60",
    type: "video",
    notes: "",
  });

  // Helper to combine date and time for API
  const getMeetingDateTime = () => {
    return `${meetingForm.date}T${meetingForm.time}:00`;
  };

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
  }, [user, router]);

  const handleLogHours = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addHourEntry.mutateAsync({
        id: engagementId,
        data: {
          date: hourForm.date,
          hours: Number(hourForm.hours),
          description: hourForm.description,
          category: hourForm.category,
        },
      });
      setShowLogHours(false);
      setHourForm({ date: new Date().toISOString().split("T")[0], hours: "", description: "", category: "other" });
      await refetch();
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Failed to log hours");
    }
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const meetingDateTime = `${meetingForm.date}T${meetingForm.time}:00`;
      await addMeeting.mutateAsync({
        id: engagementId,
        data: {
          date: meetingDateTime,
          duration: Number(meetingForm.duration),
          type: meetingForm.type,
          notes: meetingForm.notes,
        },
      });
      setShowScheduleMeeting(false);
      setMeetingForm({ date: new Date().toISOString().split("T")[0], time: "09:00", duration: "60", type: "video", notes: "" });
      await refetch();
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Failed to schedule meeting");
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    const reason = newStatus === "terminated" ? prompt("Reason for termination (required):") : undefined;
    if (newStatus === "terminated" && !reason) return;

    try {
      await updateStatus.mutateAsync({
        id: engagementId,
        data: { status: newStatus, reason },
      });
      await refetch();
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleRenew = async () => {
    const months = prompt("Additional months to renew:", "3");
    if (!months) return;

    try {
      await renewEngagement.mutateAsync({
        id: engagementId,
        data: { additionalMonths: Number(months) },
      });
      await refetch();
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Failed to renew");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <div className="animate-spin w-10 h-10 border-2 border-[#1B2A4A] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !data?.engagement) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <div className="text-center py-20 bg-white rounded-xl border border-[#E5EAF0] max-w-md mx-auto px-4">
          <p className="text-[#EF4444] font-semibold mb-2">Engagement not found</p>
          <Link href="/engagements" className="text-[#00A6A6] font-semibold hover:underline">
            ← Back to Engagements
          </Link>
        </div>
      </div>
    );
  }

  const engagement = data.engagement;
  const isLawyer = user && engagement.lawyerId?.userId?._id?.toString() === user._id.toString();
  const isClient = user && engagement.clientId?._id?.toString() === user._id.toString();
  const lawyer = engagement.lawyerId;
  const client = engagement.clientId;
  const lawyerName = lawyer?.userId ? `${lawyer.userId.firstName} ${lawyer.userId.lastName}` : "Unknown Lawyer";
  const clientName = client ? `${client.firstName} ${client.lastName}` : "Unknown Client";
  const lawyerPhoto = lawyer?.photo || lawyer?.userId?.avatar;

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

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <section className="bg-[#1B2A4A] text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Engagement Details</h1>
              <p className="text-white/70 mt-2">Fractional GC Engagement #{engagementId.slice(-8)}</p>
            </div>
            <div className="flex gap-3">
              <Link href="/engagements" className="inline-flex items-center gap-2 px-4 py-2 border border-white/30 text-white rounded-lg hover:bg-white/10 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Engagements
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-6">
        {/* Status Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <Badge variant={STATUS_COLORS[engagement.status] || "default"} size="lg">
                    {engagement.status}
                  </Badge>
                </div>
                <h2 className="text-2xl font-bold text-[#1B2A4A]">Fractional GC Engagement</h2>
              </div>
              {isLawyer && engagement.status === "active" && (
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" onClick={() => setShowLogHours(true)}>
                    Log Hours
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowScheduleMeeting(true)}>
                    Schedule Meeting
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleUpdateStatus("paused")}>
                    Pause
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleUpdateStatus("terminated")}>
                    Terminate
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleRenew}>
                    Renew
                  </Button>
                </div>
              )}
              {isClient && engagement.status === "active" && (
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" onClick={() => setShowScheduleMeeting(true)}>
                    Schedule Meeting
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleUpdateStatus("paused")}>
                    Pause
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-xs text-[#667085] uppercase tracking-wide">Monthly Retainer</p>
              <p className="text-3xl font-bold text-[#1B2A4A] mt-1">₦{engagement.monthlyRetainer?.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-xs text-[#667085] uppercase tracking-wide">Hours/Month</p>
              <p className="text-3xl font-bold text-[#00A6A6] mt-1">{engagement.hoursPerMonth}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-xs text-[#667085] uppercase tracking-wide">Hours Used This Month</p>
              <p className="text-3xl font-bold text-[#F59E0B] mt-1">{engagement.hoursUsedThisMonth}/{engagement.hoursPerMonth}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-xs text-[#667085] uppercase tracking-wide">Total Hours</p>
              <p className="text-3xl font-bold text-[#5DBB63] mt-1">{engagement.hoursUsedTotal}</p>
            </CardContent>
          </Card>
        </div>

        {/* Party Info */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Lawyer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-[#1B2A4A] flex items-center justify-center text-white text-xl font-bold">
                  {lawyerPhoto ? (
                    <img src={lawyerPhoto} alt={lawyerName} className="w-full h-full object-cover" />
                  ) : (
                    <span>{lawyerName.split(" ").map(n => n[0]).join("")}</span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-[#1B2A4A]">{lawyerName}</h3>
                  <p className="text-sm text-[#667085]">{lawyer?.userId?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Client</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#1B2A4A] flex items-center justify-center text-white text-xl font-bold">
                  {clientName.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <h3 className="font-semibold text-[#1B2A4A]">{clientName}</h3>
                  <p className="text-sm text-[#667085]">{client?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-[#E5EAF0]">
          <nav className="flex gap-8" aria-label="Engagement tabs">
            {["overview", "hours", "meetings", "billing"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? "border-[#00A6A6] text-[#00A6A6]"
                    : "border-transparent text-[#667085] hover:text-[#1B2A4A] hover:border-[#E5EAF0]"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Engagement Type</p>
                    <p className="font-bold text-[#1B2A4A]">{engagement.engagementType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Start Date</p>
                    <p className="font-bold text-[#1B2A4A]">{new Date(engagement.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#94A3B8] uppercase tracking-wide">End Date</p>
                    <p className="font-bold text-[#1B2A4A]">{new Date(engagement.endDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Auto-Renew</p>
                    <p className="font-bold text-[#1B2A4A]">{engagement.autoRenew ? "Yes" : "No"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Payment Terms</p>
                    <p className="font-bold text-[#1B2A4A]">{engagement.paymentTerms?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Termination Notice</p>
                    <p className="font-bold text-[#1B2A4A]">{engagement.terminationNoticeDays} days</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-[#94A3B8] uppercase tracking-wide mb-2">Scope of Work</p>
                  <div className="flex flex-wrap gap-2">
                    {engagement.scopeOfWork?.map((scope: string) => (
                      <Badge key={scope} variant="info" size="sm" className="px-3 py-1.5 text-base">{scope}</Badge>
                    ))}
                  </div>
                  {engagement.customScope && (
                    <div className="mt-3 p-3 bg-[#F5F7FA] rounded-lg">
                      <p className="text-sm text-[#667085]"><strong>Custom Scope:</strong> {engagement.customScope}</p>
                    </div>
                  )}
                  {engagement.industries?.length > 0 && (
                    <div>
                      <p className="text-xs text-[#94A3B8] uppercase tracking-wide mb-2">Industries</p>
                      <div className="flex flex-wrap gap-2">
                        {engagement.industries.map((ind: string) => (
                          <Badge key={ind} variant="default" size="xs">{ind}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {engagement.companyStages?.length > 0 && (
                    <div>
                      <p className="text-xs text-[#94A3B8] uppercase tracking-wide mb-2">Company Stages</p>
                      <div className="flex flex-wrap gap-2">
                        {engagement.companyStages.map((stage: string) => (
                          <Badge key={stage} variant="info" size="xs">{stage}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Hours Tab */}
        {activeTab === "hours" && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row md:flex-row md:items-center md:justify-between">
                <CardTitle>Hour Entries</CardTitle>
                <Button variant="primary" size="sm" onClick={() => setShowLogHours(true)}>
                  Log Hours
                </Button>
              </CardHeader>
              <CardContent>
                {engagement.hourEntries?.length > 0 ? (
                  <div className="space-y-3">
                    {[...engagement.hourEntries].reverse().map((entry: any, index: number) => (
                      <div key={index} className="p-4 bg-[#F5F7FA] rounded-lg border border-[#E5EAF0]">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="info" size="xs">{entry.category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</Badge>
                            <span className="font-semibold text-[#1B2A4A]">{entry.hours} hrs</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-[#667085]">
                            <span>{new Date(entry.date).toLocaleDateString()}</span>
                            {entry.billed && <Badge variant="success" size="xs">Billed</Badge>}
                          </div>
                        </div>
                        <p className="text-sm text-[#475569] mt-2">{entry.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#667085]">
                    <p>No hours logged yet.</p>
                    <Button variant="primary" size="sm" className="mt-3" onClick={() => setShowLogHours(true)}>
                      Log First Entry
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Log Hours Modal */}
            {showLogHours && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl animate-fadeIn">
                  <h3 className="text-xl font-semibold text-[#1B2A4A] mb-4">Log Hours</h3>
                  <form onSubmit={handleLogHours} className="space-y-4">
                    <Input label="Date" type="date" value={hourForm.date} onChange={(e) => setHourForm({ ...hourForm, date: e.target.value })} />
                    <Input label="Hours" type="number" step="0.25" min="0.25" max="24" value={hourForm.hours} onChange={(e) => setHourForm({ ...hourForm, hours: e.target.value })} placeholder="e.g., 2.5" />
                    <Input label="Category" {...register("category")} error={errors.category?.message}>
                      <select {...register("category")} className="w-full px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] bg-white text-sm">
                        {HOUR_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</option>)}
                      </select>
                    </Input>
                    <div>
                      <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Description</label>
                      <textarea
                        value={hourForm.description}
                        onChange={(e) => setHourForm({ ...hourForm, description: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm resize-none"
                        placeholder="Describe the work performed..."
                        required
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" onClick={() => setShowLogHours(false)} className="flex-1">
                        Cancel
                      </Button>
                      <Button type="submit" variant="primary" disabled={addHourEntry.isPending} className="flex-1">
                        {addHourEntry.isPending ? "Logging..." : "Log Hours"}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Meetings Tab */}
        {activeTab === "meetings" && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row md:flex-row md:items-center md:justify-between">
                <CardTitle>Meetings</CardTitle>
                <Button variant="primary" size="sm" onClick={() => setShowScheduleMeeting(true)}>
                  Schedule Meeting
                </Button>
              </CardHeader>
              <CardContent>
                {engagement.meetings?.length > 0 ? (
                  <div className="space-y-3">
                    {[...engagement.meetings].reverse().map((meeting: any, index: number) => (
                      <div key={index} className="p-4 bg-[#F5F7FA] rounded-lg border border-[#E5EAF0]">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#00A6A6]/10 text-[#00A6A6] rounded-full flex items-center justify-center text-sm font-bold">
                              {meeting.type === "video" ? "📹" : meeting.type === "audio" ? "📞" : "🤝"}
                            </div>
                            <div>
                              <p className="font-semibold text-[#1B2A4A] capitalize">{meeting.type} Meeting</p>
                              <p className="text-sm text-[#667085]">{meeting.duration} minutes</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-[#667085]">{new Date(meeting.date).toLocaleDateString()} at {new Date(meeting.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="text-[#94A3B8]">Attendees: {meeting.attendedBy?.join(", ")}</span>
                          </div>
                        </div>
                        {meeting.notes && <p className="text-sm text-[#475569] mt-2">{meeting.notes}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#667085]">
                    <p>No meetings scheduled yet.</p>
                    <Button variant="primary" size="sm" className="mt-3" onClick={() => setShowScheduleMeeting(true)}>
                      Schedule First Meeting
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Schedule Meeting Modal */}
            {showScheduleMeeting && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl animate-fadeIn">
                  <h3 className="text-xl font-semibold text-[#1B2A4A] mb-4">Schedule Meeting</h3>
                  <form onSubmit={handleScheduleMeeting} className="space-y-4">
                    <Input label="Date" type="datetime-local" value={meetingForm.date} onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })} />
                    <Input label="Duration (minutes)" type="number" value={meetingForm.duration} onChange={(e) => setMeetingForm({ ...meetingForm, duration: e.target.value })} placeholder="60" min="15" max="480" step="15" />
                    <div>
                      <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Type</label>
                      <select value={meetingForm.type} onChange={(e) => setMeetingForm({ ...meetingForm, type: e.target.value })} className="w-full px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] bg-white text-sm">
                        {MEETING_TYPES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Notes (Optional)</label>
                      <textarea
                        value={meetingForm.notes}
                        onChange={(e) => setMeetingForm({ ...meetingForm, notes: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm resize-none"
                        placeholder="Agenda, preparation needed, etc."
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" onClick={() => setShowScheduleMeeting(false)} className="flex-1">
                        Cancel
                      </Button>
                      <Button type="submit" variant="primary" disabled={addMeeting.isPending} className="flex-1">
                        {addMeeting.isPending ? "Scheduling..." : "Schedule Meeting"}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Billing Tab */}
        {activeTab === "billing" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Billing Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-[#667085] uppercase tracking-wide">Monthly Retainer</p>
                      <p className="text-2xl font-bold text-[#1B2A4A]">₦{engagement.monthlyRetainer?.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-[#667085] uppercase tracking-wide">Next Billing Date</p>
                      <p className="text-xl font-bold text-[#F59E0B]">{engagement.nextBillingDate ? new Date(engagement.nextBillingDate).toLocaleDateString() : "N/A"}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-[#667085] uppercase tracking-wide">Total Billed</p>
                      <p className="text-xl font-bold text-[#5DBB63]">₦{engagement.totalBilled?.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-[#667085] uppercase tracking-wide">Payment Terms</p>
                      <p className="text-xl font-bold text-[#00A6A6] capitalize">{engagement.paymentTerms?.replace(/_/g, " ")}</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="p-4 bg-[#FFFBEB] border border-[#F59E0B]/20 rounded-lg">
                  <p className="font-semibold text-[#92400E] mb-2">Platform Fee</p>
                  <p className="text-sm text-[#92400E]">₦10,000 one-time platform fee paid upon engagement activation. Monthly retainer payments are processed via Paystack subscription.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Log Hours Modal */}
        {showLogHours && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl animate-fadeIn">
              <h3 className="text-xl font-semibold text-[#1B2A4A] mb-4">Log Hours</h3>
              <form onSubmit={handleLogHours} className="space-y-4">
                <Input label="Date" type="date" value={hourForm.date} onChange={(e) => setHourForm({ ...hourForm, date: e.target.value })} />
                <Input label="Hours" type="number" step="0.25" min="0.25" max="24" value={hourForm.hours} onChange={(e) => setHourForm({ ...hourForm, hours: e.target.value })} placeholder="e.g., 2.5" />
                <div>
                  <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Category</label>
                  <select value={hourForm.category} onChange={(e) => setHourForm({ ...hourForm, category: e.target.value })} className="w-full px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] bg-white text-sm">
                    {HOUR_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Description</label>
                  <textarea
                    value={hourForm.description}
                    onChange={(e) => setHourForm({ ...hourForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm resize-none"
                    placeholder="Describe the work performed..."
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowLogHours(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={addHourEntry.isPending} className="flex-1">
                    {addHourEntry.isPending ? "Logging..." : "Log Hours"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Schedule Meeting Modal */}
        {showScheduleMeeting && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl animate-fadeIn">
              <h3 className="text-xl font-semibold text-[#1B2A4A] mb-4">Schedule Meeting</h3>
              {engagement.lawyerId?.availableDays && engagement.lawyerId?.availableFrom && engagement.lawyerId?.availableTo && (
                <div className="mb-4 p-3 bg-[#F0FDFA] border border-[#00A6A6]/20 rounded-lg">
                  <p className="text-sm font-semibold text-[#00A6A6] mb-1">Lawyer's Availability</p>
                  <p className="text-xs text-[#00A6A6]">
                    {engagement.lawyerId.availableDays.join(", ")} • {engagement.lawyerId.availableFrom} - {engagement.lawyerId.availableTo}
                  </p>
                </div>
              )}
              <form onSubmit={handleScheduleMeeting} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Date" type="date" value={meetingForm.date} onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })} />
                  <Input label="Time" type="time" value={meetingForm.time} onChange={(e) => setMeetingForm({ ...meetingForm, time: e.target.value })} />
                </div>
                <Input label="Duration (minutes)" type="number" value={meetingForm.duration} onChange={(e) => setMeetingForm({ ...meetingForm, duration: e.target.value })} placeholder="60" min="15" max="480" step="15" />
                <div>
                  <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Type</label>
                  <select value={meetingForm.type} onChange={(e) => setMeetingForm({ ...meetingForm, type: e.target.value })} className="w-full px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] bg-white text-sm">
                    {MEETING_TYPES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Notes (Optional)</label>
                  <textarea
                    value={meetingForm.notes}
                    onChange={(e) => setMeetingForm({ ...meetingForm, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm resize-none"
                    placeholder="Agenda, preparation needed, etc."
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowScheduleMeeting(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={addMeeting.isPending} className="flex-1">
                    {addMeeting.isPending ? "Scheduling..." : "Schedule Meeting"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}