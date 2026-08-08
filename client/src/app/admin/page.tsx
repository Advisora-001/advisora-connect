"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import Sidebar from "@/components/admin/Sidebar";
import KanbanBoard from "@/components/admin/KanbanBoard";
import VerificationCard from "@/components/admin/VerificationCard";
import UserCard from "@/components/admin/UserCard";
import LawyerProfileModal from "@/components/admin/LawyerProfileModal";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<
    "dashboard" | "verifications" | "users" | "reports" | "configuration"
  >("dashboard");
  const [analytics, setAnalytics] = useState<any>(null);
  const [pendingLawyers, setPendingLawyers] = useState<any[]>([]);
  const [verifiedLawyers, setVerifiedLawyers] = useState<any[]>([]);
  const [rejectedLawyers, setRejectedLawyers] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [suspendedUsers, setSuspendedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [manageLawyer, setManageLawyer] = useState<any>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "admin") {
      router.push("/login");
      return;
    }
    fetchData();
  }, [user, authLoading]);

  async function fetchData() {
    setLoading(true);
    try {
      const [analyticsData, pendingData, usersData] = await Promise.all([
        api.getAnalytics(),
        api.getPendingVerifications(),
        api.getAdminUsers(),
      ]);
      setAnalytics(analyticsData);

      // Organize lawyers by verification status
      const allLawyers = pendingData.lawyers || [];
      setPendingLawyers(
        allLawyers.filter(
          (l: any) =>
            l.verificationStatus === "pending" || !l.verificationStatus,
        ),
      );
      setVerifiedLawyers(
        allLawyers.filter((l: any) => l.verificationStatus === "verified"),
      );
      setRejectedLawyers(
        allLawyers.filter((l: any) => l.verificationStatus === "rejected"),
      );

      // Organize users by active status
      const allUsers = usersData.users || [];
      setActiveUsers(allUsers.filter((u: any) => u.isActive));
      setSuspendedUsers(allUsers.filter((u: any) => !u.isActive));
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setLoading(false);
    }
  }

  const fetchLawyerProfile = async (id: string) => {
    try {
      const profile = await api.getLawyerProfile(id);
      setManageLawyer(profile);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to fetch lawyer profile",
      );
    }
  };

  const handleVerify = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      await api.verifyLawyer(id, status);
      await fetchData();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to update verification status",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleUserStatus = async (id: string) => {
    setActionLoading(id);
    try {
      await api.toggleUserStatus(id);
      await fetchData();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to toggle user status",
      );
    } finally {
      setActionLoading(null);
    }
  };

  if (!user) return null;
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-2 border-[#1B2A4A] border-t-transparent rounded-full"></div>
      </div>
    );

  return (
    <div className="flex h-screen bg-[#F5F7FA]">
      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-[#E5EAF0] px-8 py-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#1B2A4A] capitalize">
                {activeSection === "dashboard" && "Dashboard"}
                {activeSection === "verifications" && "Verifications"}
                {activeSection === "users" && "Users"}
                {activeSection === "reports" && "Reports"}
                {activeSection === "configuration" && "Configuration"}
              </h1>
              <p className="text-[#667085] text-sm mt-1">
                {activeSection === "dashboard" &&
                  "Platform overview and analytics"}
                {activeSection === "verifications" &&
                  "Manage lawyer verifications and approvals"}
                {activeSection === "users" &&
                  "User management and account status"}
                {activeSection === "reports" &&
                  "View platform reports and insights"}
                {activeSection === "configuration" &&
                  "Configure platform settings"}
              </p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8">
          {/* Dashboard Section */}
          {activeSection === "dashboard" && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
                <div className="bg-white rounded-xl border border-[#E5EAF0] p-6 hover:shadow-md transition-shadow">
                  <p className="text-sm font-medium text-[#667085] uppercase tracking-wide">
                    Total Lawyers
                  </p>
                  <p className="text-3xl font-bold text-[#1B2A4A] mt-2">
                    {analytics?.totalLawyers || 0}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-[#E5EAF0] p-6 hover:shadow-md transition-shadow">
                  <p className="text-sm font-medium text-[#667085] uppercase tracking-wide">
                    Verified
                  </p>
                  <p className="text-3xl font-bold text-[#5DBB63] mt-2">
                    {analytics?.verifiedLawyers || 0}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-[#E5EAF0] p-6 hover:shadow-md transition-shadow">
                  <p className="text-sm font-medium text-[#667085] uppercase tracking-wide">
                    Pending
                  </p>
                  <p className="text-3xl font-bold text-[#F59E0B] mt-2">
                    {analytics?.pendingLawyers || 0}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-[#E5EAF0] p-6 hover:shadow-md transition-shadow">
                  <p className="text-sm font-medium text-[#667085] uppercase tracking-wide">
                    Total Clients
                  </p>
                  <p className="text-3xl font-bold text-[#2476B8] mt-2">
                    {analytics?.totalClients || 0}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <div className="bg-white rounded-xl border border-[#E5EAF0] p-6 hover:shadow-md transition-shadow">
                  <p className="text-sm font-medium text-[#667085] uppercase tracking-wide">
                    Total Leads
                  </p>
                  <p className="text-3xl font-bold text-[#1B2A4A] mt-2">
                    {analytics?.totalLeads || 0}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-[#E5EAF0] p-6 hover:shadow-md transition-shadow">
                  <p className="text-sm font-medium text-[#667085] uppercase tracking-wide">
                    Paid Leads
                  </p>
                  <p className="text-3xl font-bold text-[#5DBB63] mt-2">
                    {analytics?.paidLeads || 0}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-[#E5EAF0] p-6 hover:shadow-md transition-shadow">
                  <p className="text-sm font-medium text-[#667085] uppercase tracking-wide">
                    Active Subs
                  </p>
                  <p className="text-3xl font-bold text-[#00A6A6] mt-2">
                    {analytics?.activeSubscriptions || 0}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-[#E5EAF0] p-6 hover:shadow-md transition-shadow">
                  <p className="text-sm font-medium text-[#667085] uppercase tracking-wide">
                    Featured
                  </p>
                  <p className="text-3xl font-bold text-[#F59E0B] mt-2">
                    {analytics?.featuredActive || 0}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Verifications Section - Kanban */}
          {activeSection === "verifications" && (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[#667085] text-sm">
                    Manage lawyer verification status by dragging cards between
                    columns
                  </p>
                </div>
                <div className="text-xs text-[#94A3B8]">
                  Total:{" "}
                  {pendingLawyers.length +
                    verifiedLawyers.length +
                    rejectedLawyers.length}
                </div>
              </div>
              <KanbanBoard
                columns={[
                  {
                    id: "pending",
                    title: "Pending",
                    color: "bg-[#F59E0B]",
                    badge: pendingLawyers.length,
                  },
                  {
                    id: "verified",
                    title: "Verified",
                    color: "bg-[#5DBB63]",
                    badge: verifiedLawyers.length,
                  },
                  {
                    id: "rejected",
                    title: "Rejected",
                    color: "bg-[#EF4444]",
                    badge: rejectedLawyers.length,
                  },
                ]}
                columnContent={{
                  pending: pendingLawyers.map((lawyer) => (
                    <div key={lawyer._id} className="mb-3">
                      <VerificationCard
                        columnId="pending"
                        lawyer={lawyer}
                        onViewDetails={fetchLawyerProfile}
                        onApprove={() => handleVerify(lawyer._id, "verified")}
                        onReject={() => handleVerify(lawyer._id, "rejected")}
                        isLoading={actionLoading === lawyer._id}
                      />
                    </div>
                  )),
                  verified: verifiedLawyers.map((lawyer) => (
                    <div key={lawyer._id} className="mb-3">
                      <VerificationCard
                        columnId="verified"
                        lawyer={lawyer}
                        onViewDetails={fetchLawyerProfile}
                        onApprove={() => handleVerify(lawyer._id, "verified")}
                        onReject={() => handleVerify(lawyer._id, "rejected")}
                        isLoading={actionLoading === lawyer._id}
                      />
                    </div>
                  )),
                  rejected: rejectedLawyers.map((lawyer) => (
                    <div key={lawyer._id} className="mb-3">
                      <VerificationCard
                        columnId="rejected"
                        lawyer={lawyer}
                        onViewDetails={fetchLawyerProfile}
                        onApprove={() => handleVerify(lawyer._id, "verified")}
                        onReject={() => handleVerify(lawyer._id, "rejected")}
                        isLoading={actionLoading === lawyer._id}
                      />
                    </div>
                  )),
                }}
              />
            </div>
          )}

          {/* Users Section - Kanban */}
          {activeSection === "users" && (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[#667085] text-sm">
                    Manage user accounts and status
                  </p>
                </div>
                <div className="text-xs text-[#94A3B8]">
                  Total: {activeUsers.length + suspendedUsers.length}
                </div>
              </div>
              <KanbanBoard
                columns={[
                  {
                    id: "active",
                    title: "Active Users",
                    color: "bg-[#5DBB63]",
                    badge: activeUsers.length,
                  },
                  {
                    id: "suspended",
                    title: "Suspended Users",
                    color: "bg-[#EF4444]",
                    badge: suspendedUsers.length,
                  },
                ]}
                columnContent={{
                  active: activeUsers.map((user) => (
                    <div key={user._id} className="mb-3">
                      <UserCard
                        columnId="active"
                        user={user}
                        onManage={fetchLawyerProfile}
                        onToggleStatus={() => handleToggleUserStatus(user._id)}
                        isLoading={actionLoading === user._id}
                        canToggleStatus={user.role !== "admin"}
                      />
                    </div>
                  )),
                  suspended: suspendedUsers.map((user) => (
                    <div key={user._id} className="mb-3">
                      <UserCard
                        columnId="suspended"
                        user={user}
                        onManage={fetchLawyerProfile}
                        onToggleStatus={() => handleToggleUserStatus(user._id)}
                        isLoading={actionLoading === user._id}
                        canToggleStatus={user.role !== "admin"}
                      />
                    </div>
                  )),
                }}
              />
            </div>
          )}

          {/* Reports Section */}
          {activeSection === "reports" && (
            <div className="bg-white rounded-xl border border-[#E5EAF0] p-8">
              <div className="text-center py-12">
                <p className="text-[#667085] text-lg font-medium">
                  Reports coming soon
                </p>
                <p className="text-[#94A3B8] text-sm mt-2">
                  Platform reports and insights will be available here
                </p>
              </div>
            </div>
          )}

          {/* Configuration Section */}
          {activeSection === "configuration" && (
            <div className="bg-white rounded-xl border border-[#E5EAF0] p-8">
              <div className="text-center py-12">
                <p className="text-[#667085] text-lg font-medium">
                  Configuration coming soon
                </p>
                <p className="text-[#94A3B8] text-sm mt-2">
                  Platform settings and configuration will be available here
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lawyer Profile Modal */}
      {manageLawyer && (
        <LawyerProfileModal
          lawyer={manageLawyer}
          onClose={() => setManageLawyer(null)}
          onUpdate={async (data) => {
            // Handle update logic if needed
            console.log("Lawyer profile updated:", data);
          }}
        />
      )}
    </div>
  );
}
