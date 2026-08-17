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
    "dashboard" | "verifications" | "users" | "reports" | "configuration" | "payouts" | "revenue" | "guide"
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
  const [payouts, setPayouts] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [revenueData, setRevenueData] = useState<any>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "admin") { router.push("/login"); return; }
    fetchData();
    fetchPayouts();
    fetchRevenue();
  }, [user, authLoading]);

  async function fetchPayouts() { try { const data = await api.getPayouts(); setPayouts(data.payouts); } catch {} }

  async function fetchRevenue() { try { const data = await api.getRevenue(); setRevenueData(data); } catch {} }

  async function fetchData() {
    setLoading(true);
    try {
      const [analyticsData, pendingData, usersData] = await Promise.all([api.getAnalytics(), api.getPendingVerifications(), api.getAdminUsers()]);
      setAnalytics(analyticsData);
      const allLawyers = pendingData.lawyers || [];
      setPendingLawyers(allLawyers.filter((l: any) => l.verificationStatus === "pending" || !l.verificationStatus));
      setVerifiedLawyers(allLawyers.filter((l: any) => l.verificationStatus === "verified"));
      setRejectedLawyers(allLawyers.filter((l: any) => l.verificationStatus === "rejected"));
      const allUsers = usersData.users || [];
      setActiveUsers(allUsers.filter((u: any) => u.isActive));
      setSuspendedUsers(allUsers.filter((u: any) => !u.isActive));
    } catch (error) { console.error("Failed to fetch admin data:", error); }
    finally { setLoading(false); }
  }

  const fetchLawyerProfile = async (id: string) => {
    try { const profile = await api.getLawyerProfile(id); setManageLawyer(profile); }
    catch (error) { alert(error instanceof Error ? error.message : "Failed to fetch lawyer profile"); }
  };

  const handleVerify = async (id: string, status: string) => {
    setActionLoading(id);
    try { await api.verifyLawyer(id, status); await fetchData(); }
    catch (error) { alert(error instanceof Error ? error.message : "Failed to update verification status"); }
    finally { setActionLoading(null); }
  };

  const handleToggleUserStatus = async (id: string) => {
    setActionLoading(id);
    try { await api.toggleUserStatus(id); await fetchData(); }
    catch (error) { alert(error instanceof Error ? error.message : "Failed to toggle user status"); }
    finally { setActionLoading(null); }
  };

  const handleProcessPayout = async (id: string, status: string) => {
    setActionLoading(id);
    try { await api.processPayout(id, status); await fetchPayouts(); }
    catch (error) { alert(error instanceof Error ? error.message : "Failed to process payout"); }
    finally { setActionLoading(null); }
  };

  if (!user) return null;
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-10 h-10 border-2 border-[#1B2A4A] border-t-transparent rounded-full"></div></div>;

  return (
    <div className="flex h-screen bg-[#F5F7FA]">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-[#E5EAF0] px-4 md:px-8 py-4 md:py-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="md:hidden p-2 text-[#667085] hover:text-[#1B2A4A] rounded-lg hover:bg-[#EEF2F7]" onClick={() => setSidebarOpen(true)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-[#1B2A4A] capitalize">
                  {activeSection === "dashboard" && "Dashboard"}
                  {activeSection === "verifications" && "Verifications"}
                  {activeSection === "users" && "Users"}
                  {activeSection === "reports" && "Reports"}
                  {activeSection === "configuration" && "Configuration"}
                  {activeSection === "payouts" && "Payouts"}
                  {activeSection === "revenue" && "Revenue"}
                  {activeSection === "guide" && "Platform Guide"}
                </h1>
                <p className="text-[#667085] text-xs md:text-sm mt-1">
                  {activeSection === "dashboard" && "Platform overview and analytics"}
                  {activeSection === "verifications" && "Manage lawyer verifications and approvals"}
                  {activeSection === "users" && "User management and account status"}
                  {activeSection === "reports" && "View platform reports and insights"}
                  {activeSection === "configuration" && "Configure platform settings"}
                  {activeSection === "payouts" && "Review and process lawyer payout requests"}
                  {activeSection === "revenue" && "Platform revenue and transaction history"}
                  {activeSection === "guide" && "Step-by-step guide for using the platform"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          {/* Dashboard */}
          {activeSection === "dashboard" && (<>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 mb-6 md:mb-8">
              <div className="bg-white rounded-xl border border-[#E5EAF0] p-4 md:p-6 hover:shadow-md transition-shadow"><p className="text-xs md:text-sm font-medium text-[#667085] uppercase tracking-wide">Total Lawyers</p><p className="text-2xl md:text-3xl font-bold text-[#1B2A4A] mt-2">{analytics?.totalLawyers || 0}</p></div>
              <div className="bg-white rounded-xl border border-[#E5EAF0] p-4 md:p-6 hover:shadow-md transition-shadow"><p className="text-xs md:text-sm font-medium text-[#667085] uppercase tracking-wide">Verified</p><p className="text-2xl md:text-3xl font-bold text-[#5DBB63] mt-2">{analytics?.verifiedLawyers || 0}</p></div>
              <div className="bg-white rounded-xl border border-[#E5EAF0] p-4 md:p-6 hover:shadow-md transition-shadow"><p className="text-xs md:text-sm font-medium text-[#667085] uppercase tracking-wide">Pending</p><p className="text-2xl md:text-3xl font-bold text-[#F59E0B] mt-2">{analytics?.pendingLawyers || 0}</p></div>
              <div className="bg-white rounded-xl border border-[#E5EAF0] p-4 md:p-6 hover:shadow-md transition-shadow"><p className="text-xs md:text-sm font-medium text-[#667085] uppercase tracking-wide">Total Clients</p><p className="text-2xl md:text-3xl font-bold text-[#2476B8] mt-2">{analytics?.totalClients || 0}</p></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
              <div className="bg-white rounded-xl border border-[#E5EAF0] p-4 md:p-6 hover:shadow-md transition-shadow"><p className="text-xs md:text-sm font-medium text-[#667085] uppercase tracking-wide">Total Leads</p><p className="text-2xl md:text-3xl font-bold text-[#1B2A4A] mt-2">{analytics?.totalLeads || 0}</p></div>
              <div className="bg-white rounded-xl border border-[#E5EAF0] p-4 md:p-6 hover:shadow-md transition-shadow"><p className="text-xs md:text-sm font-medium text-[#667085] uppercase tracking-wide">Paid Leads</p><p className="text-2xl md:text-3xl font-bold text-[#5DBB63] mt-2">{analytics?.paidLeads || 0}</p></div>
              <div className="bg-white rounded-xl border border-[#E5EAF0] p-4 md:p-6 hover:shadow-md transition-shadow"><p className="text-xs md:text-sm font-medium text-[#667085] uppercase tracking-wide">Active Subs</p><p className="text-2xl md:text-3xl font-bold text-[#00A6A6] mt-2">{analytics?.activeSubscriptions || 0}</p></div>
              <div className="bg-white rounded-xl border border-[#E5EAF0] p-4 md:p-6 hover:shadow-md transition-shadow"><p className="text-xs md:text-sm font-medium text-[#667085] uppercase tracking-wide">Featured</p><p className="text-2xl md:text-3xl font-bold text-[#F59E0B] mt-2">{analytics?.featuredActive || 0}</p></div>
            </div>
          </>)}

          {/* Verifications */}
          {activeSection === "verifications" && (
            <div>
              <div className="mb-6 flex items-center justify-between"><div><p className="text-[#667085] text-sm">Manage lawyer verification status by dragging cards between columns</p></div><div className="text-xs text-[#94A3B8]">Total: {pendingLawyers.length + verifiedLawyers.length + rejectedLawyers.length}</div></div>
              <KanbanBoard columns={[{ id: "pending", title: "Pending", color: "bg-[#F59E0B]", badge: pendingLawyers.length }, { id: "verified", title: "Verified", color: "bg-[#5DBB63]", badge: verifiedLawyers.length }, { id: "rejected", title: "Rejected", color: "bg-[#EF4444]", badge: rejectedLawyers.length }]}
                columnContent={{
                  pending: pendingLawyers.map((lawyer) => (<div key={lawyer._id} className="mb-3"><VerificationCard columnId="pending" lawyer={lawyer} onViewDetails={fetchLawyerProfile} onApprove={() => handleVerify(lawyer._id, "verified")} onReject={() => handleVerify(lawyer._id, "rejected")} isLoading={actionLoading === lawyer._id} /></div>)),
                  verified: verifiedLawyers.map((lawyer) => (<div key={lawyer._id} className="mb-3"><VerificationCard columnId="verified" lawyer={lawyer} onViewDetails={fetchLawyerProfile} onApprove={() => handleVerify(lawyer._id, "verified")} onReject={() => handleVerify(lawyer._id, "rejected")} isLoading={actionLoading === lawyer._id} /></div>)),
                  rejected: rejectedLawyers.map((lawyer) => (<div key={lawyer._id} className="mb-3"><VerificationCard columnId="rejected" lawyer={lawyer} onViewDetails={fetchLawyerProfile} onApprove={() => handleVerify(lawyer._id, "verified")} onReject={() => handleVerify(lawyer._id, "rejected")} isLoading={actionLoading === lawyer._id} /></div>)),
                }} />
            </div>
          )}

          {/* Users */}
          {activeSection === "users" && (
            <div>
              <div className="mb-6 flex items-center justify-between"><div><p className="text-[#667085] text-sm">Manage user accounts and status</p></div><div className="text-xs text-[#94A3B8]">Total: {activeUsers.length + suspendedUsers.length}</div></div>
              <KanbanBoard columns={[{ id: "active", title: "Active Users", color: "bg-[#5DBB63]", badge: activeUsers.length }, { id: "suspended", title: "Suspended Users", color: "bg-[#EF4444]", badge: suspendedUsers.length }]}
                columnContent={{
                  active: activeUsers.map((user) => (<div key={user._id} className="mb-3"><UserCard columnId="active" user={user} onManage={fetchLawyerProfile} onToggleStatus={() => handleToggleUserStatus(user._id)} isLoading={actionLoading === user._id} canToggleStatus={user.role !== "admin"} /></div>)),
                  suspended: suspendedUsers.map((user) => (<div key={user._id} className="mb-3"><UserCard columnId="suspended" user={user} onManage={fetchLawyerProfile} onToggleStatus={() => handleToggleUserStatus(user._id)} isLoading={actionLoading === user._id} canToggleStatus={user.role !== "admin"} /></div>)),
                }} />
            </div>
          )}

          {/* Reports */}
          {activeSection === "reports" && (<div className="bg-white rounded-xl border border-[#E5EAF0] p-8"><div className="text-center py-12"><p className="text-[#667085] text-lg font-medium">Reports coming soon</p><p className="text-[#94A3B8] text-sm mt-2">Platform reports and insights will be available here</p></div></div>)}

          {/* Configuration */}
          {activeSection === "configuration" && (<div className="bg-white rounded-xl border border-[#E5EAF0] p-8"><div className="text-center py-12"><p className="text-[#667085] text-lg font-medium">Configuration coming soon</p><p className="text-[#94A3B8] text-sm mt-2">Platform settings and configuration will be available here</p></div></div>)}

          {/* Payouts */}
          {activeSection === "payouts" && (
            <div>
              <div className="mb-6"><p className="text-[#667085] text-sm">Review and process lawyer payout requests</p></div>
              <div className="bg-white rounded-xl border border-[#E5EAF0]">
                {payouts.length === 0 ? (<div className="p-12 text-center text-[#667085]">No payout requests yet.</div>) : (
                  <div className="divide-y divide-[#E5EAF0]">
                    {payouts.map((p: any) => (
                      <div key={p._id} className="p-4 md:p-5 hover:bg-[#F5F7FA] transition-colors">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                          <div>
                            <p className="font-semibold text-[#1B2A4A]">{p.lawyerId?.userId?.firstName} {p.lawyerId?.userId?.lastName}</p>
                            <p className="text-sm text-[#667085]">{p.lawyerId?.userId?.email}</p>
                            <p className="text-sm text-[#667085] mt-1">Amount: <span className="font-semibold text-[#1B2A4A]">₦{p.amount?.toLocaleString()}</span></p>
                            <p className="text-sm text-[#667085]">Bank: {p.bankName} | {p.accountNumber} | {p.accountName}</p>
                            <p className="text-xs text-[#94A3B8] mt-1">Requested: {new Date(p.createdAt).toLocaleDateString()}</p>
                            <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${p.status === 'pending' ? 'bg-[#FFFBEB] text-[#92400E]' : p.status === 'approved' ? 'bg-[#EFF6FF] text-[#1E40AF]' : p.status === 'processed' ? 'bg-[#ECFDF5] text-[#166534]' : 'bg-[#FEF2F2] text-[#991B1B]'}`}>{p.status}</span>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            {p.status === 'pending' && (<>
                              <button onClick={() => handleProcessPayout(p._id, 'approved')} disabled={actionLoading === p._id} className="bg-[#5DBB63] text-white px-3 py-1.5 rounded-lg hover:bg-[#4CA652] font-semibold text-sm disabled:opacity-50 transition-colors">Approve</button>
                              <button onClick={() => handleProcessPayout(p._id, 'rejected')} disabled={actionLoading === p._id} className="bg-[#EF4444] text-white px-3 py-1.5 rounded-lg hover:bg-[#DC2626] font-semibold text-sm disabled:opacity-50 transition-colors">Reject</button>
                            </>)}
                            {p.status === 'approved' && (
                              <button onClick={() => handleProcessPayout(p._id, 'processed')} disabled={actionLoading === p._id} className="bg-[#2476B8] text-white px-3 py-1.5 rounded-lg hover:bg-[#1D6299] font-semibold text-sm disabled:opacity-50 transition-colors">Mark Processed</button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Revenue */}
          {activeSection === "revenue" && (
            <div>
              <div className="mb-6"><p className="text-[#667085] text-sm">Track platform earnings, fees, and transaction history</p></div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-5 mb-6">
                <div className="bg-white rounded-xl border border-[#E5EAF0] p-4 md:p-6"><p className="text-xs md:text-sm font-medium text-[#667085] uppercase tracking-wide">Total Revenue</p><p className="text-xl md:text-2xl font-bold text-[#1B2A4A] mt-2">₦{revenueData?.summary?.totalRevenue?.toLocaleString() || 0}</p></div>
                <div className="bg-white rounded-xl border border-[#E5EAF0] p-4 md:p-6"><p className="text-xs md:text-sm font-medium text-[#667085] uppercase tracking-wide">Platform Fees</p><p className="text-xl md:text-2xl font-bold text-[#00A6A6] mt-2">₦{revenueData?.summary?.totalPlatformFees?.toLocaleString() || 0}</p></div>
                <div className="bg-white rounded-xl border border-[#E5EAF0] p-4 md:p-6"><p className="text-xs md:text-sm font-medium text-[#667085] uppercase tracking-wide">Lawyer Earnings</p><p className="text-xl md:text-2xl font-bold text-[#5DBB63] mt-2">₦{revenueData?.summary?.totalLawyerPayouts?.toLocaleString() || 0}</p></div>
                <div className="bg-white rounded-xl border border-[#E5EAF0] p-4 md:p-6"><p className="text-xs md:text-sm font-medium text-[#667085] uppercase tracking-wide">Subscription Revenue</p><p className="text-xl md:text-2xl font-bold text-[#2476B8] mt-2">₦{revenueData?.summary?.totalSubscriptionRevenue?.toLocaleString() || 0}</p></div>
                <div className="bg-white rounded-xl border border-[#E5EAF0] p-4 md:p-6"><p className="text-xs md:text-sm font-medium text-[#667085] uppercase tracking-wide">Pending Payouts</p><p className="text-xl md:text-2xl font-bold text-[#F59E0B] mt-2">₦{revenueData?.summary?.totalPendingPayouts?.toLocaleString() || 0}</p></div>
              </div>

              {/* Transactions Table */}
              <div className="bg-white rounded-xl border border-[#E5EAF0]">
                <div className="p-6 border-b border-[#E5EAF0]"><h2 className="text-lg font-bold text-[#1B2A4A]">Consultation Transactions</h2></div>
                {revenueData?.transactions?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#F5F7FA]">
                        <tr>
                          <th className="text-left px-4 py-3">Date</th>
                          <th className="text-left px-4 py-3">Client</th>
                          <th className="text-left px-4 py-3">Lawyer</th>
                          <th className="text-left px-4 py-3">Amount</th>
                          <th className="text-left px-4 py-3">Platform Fee</th>
                          <th className="text-left px-4 py-3">Lawyer Share</th>
                          <th className="text-left px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5EAF0]">
                        {revenueData.transactions.map((t: any) => (
                          <tr key={t._id} className="hover:bg-[#F5F7FA]">
                            <td className="px-4 py-3 text-sm text-[#667085]">{new Date(t.createdAt).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-sm text-[#1B2A4A]">{t.clientId?.firstName} {t.clientId?.lastName}</td>
                            <td className="px-4 py-3 text-sm text-[#1B2A4A]">{t.lawyerId?.userId?.firstName} {t.lawyerId?.userId?.lastName}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-[#1B2A4A]">₦{t.amount?.toLocaleString()}</td>
                            <td className="px-4 py-3 text-sm text-[#00A6A6]">₦{t.platformFee?.toLocaleString()}</td>
                            <td className="px-4 py-3 text-sm text-[#5DBB63]">₦{t.lawyerAmount?.toLocaleString()}</td>
                            <td className="px-4 py-3"><span className="inline-block text-xs px-2 py-0.5 rounded-full font-medium bg-[#ECFDF5] text-[#166534]">{t.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (<div className="p-12 text-center text-[#667085]">No transactions yet.</div>)}
              </div>

              {/* Subscriptions */}
              {revenueData?.subscriptions?.length > 0 && (
                <div className="bg-white rounded-xl border border-[#E5EAF0] mt-6">
                  <div className="p-6 border-b border-[#E5EAF0]"><h2 className="text-lg font-bold text-[#1B2A4A]">Subscriptions</h2></div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#F5F7FA]"><tr><th className="text-left px-4 py-3">Subscriber</th><th className="text-left px-4 py-3">Plan</th><th className="text-left px-4 py-3">Amount</th><th className="text-left px-4 py-3">Status</th><th className="text-left px-4 py-3">Date</th></tr></thead>
                      <tbody className="divide-y divide-[#E5EAF0]">
                        {revenueData.subscriptions.map((s: any) => (
                          <tr key={s._id} className="hover:bg-[#F5F7FA]">
                            <td className="px-4 py-3 text-sm text-[#1B2A4A]">{s.userId?.firstName} {s.userId?.lastName}</td>
                            <td className="px-4 py-3 text-sm capitalize text-[#1B2A4A]">{s.plan}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-[#1B2A4A]">₦{s.amount?.toLocaleString()}</td>
                            <td className="px-4 py-3"><span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${s.status === 'active' ? 'bg-[#ECFDF5] text-[#166534]' : 'bg-[#EEF2F7] text-[#667085]'}`}>{s.status}</span></td>
                            <td className="px-4 py-3 text-sm text-[#667085]">{new Date(s.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Platform Guide */}
          {activeSection === "guide" && (
            <div>
              <div className="mb-6"><p className="text-[#667085] text-sm">Step-by-step guide for using the platform across all roles</p></div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Client Guide */}
                <div className="bg-white rounded-xl border border-[#E5EAF0] p-6">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#E5EAF0]">
                    <span className="text-2xl">👤</span>
                    <h2 className="text-lg font-bold text-[#1B2A4A]">Client Flow</h2>
                  </div>
                  <ol className="space-y-3">
                    {[
                      { step: "1", title: "Register & Verify", desc: "Create an account and verify your email address." },
                      { step: "2", title: "Browse Lawyers", desc: "Search the directory by practice area, location, or availability." },
                      { step: "3", title: "View Profile", desc: "Review credentials, ratings, reviews, and consultation fees." },
                      { step: "4", title: "Book Consultation", desc: "Select a service, pick a date & time, and submit your booking request." },
                      { step: "5", title: "Wait for Acceptance", desc: "The lawyer reviews your request and accepts or declines." },
                      { step: "6", title: "Complete Payment", desc: "Once accepted, pay via Paystack (consultation fee + platform fee)." },
                      { step: "7", title: "Join Consultation", desc: "A Google Meet link is generated — click to join at the scheduled time." },
                      { step: "8", title: "Leave a Review", desc: "After the consultation is marked complete, rate and review the lawyer." },
                    ].map((item) => (
                      <li key={item.step} className="flex gap-3">
                        <span className="w-6 h-6 bg-[#1B2A4A] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{item.step}</span>
                        <div>
                          <p className="text-sm font-semibold text-[#1B2A4A]">{item.title}</p>
                          <p className="text-xs text-[#667085]">{item.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Lawyer Guide */}
                <div className="bg-white rounded-xl border border-[#E5EAF0] p-6">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#E5EAF0]">
                    <span className="text-2xl">⚖️</span>
                    <h2 className="text-lg font-bold text-[#1B2A4A]">Lawyer Flow</h2>
                  </div>
                  <ol className="space-y-3">
                    {[
                      { step: "1", title: "Register as Lawyer", desc: "Create an account with the lawyer role and verify your email." },
                      { step: "2", title: "Complete Profile", desc: "Fill in SCN number, bar info, practice areas, consultation fee, and availability." },
                      { step: "3", title: "Submit Verification", desc: "Upload verification documents and await admin approval." },
                      { step: "4", title: "Receive Enquiries", desc: "Clients send booking requests — review and accept or decline them." },
                      { step: "5", title: "Manage Appointments", desc: "View upcoming consultations, generate Google Meet links, and join sessions." },
                      { step: "6", title: "Mark Complete", desc: "After the consultation, mark it as completed so the client can leave a review." },
                      { step: "7", title: "Track Earnings", desc: "Monitor your wallet balance, total earned, and transaction history." },
                      { step: "8", title: "Request Payout", desc: "Set up bank details in Payout Settings, then request a withdrawal from your wallet." },
                    ].map((item) => (
                      <li key={item.step} className="flex gap-3">
                        <span className="w-6 h-6 bg-[#00A6A6] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{item.step}</span>
                        <div>
                          <p className="text-sm font-semibold text-[#1B2A4A]">{item.title}</p>
                          <p className="text-xs text-[#667085]">{item.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Admin Guide */}
                <div className="bg-white rounded-xl border border-[#E5EAF0] p-6">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#E5EAF0]">
                    <span className="text-2xl">🛡️</span>
                    <h2 className="text-lg font-bold text-[#1B2A4A]">Admin Flow</h2>
                  </div>
                  <ol className="space-y-3">
                    {[
                      { step: "1", title: "Dashboard Overview", desc: "Monitor platform stats: lawyers, clients, leads, subscriptions, and featured listings." },
                      { step: "2", title: "Verify Lawyers", desc: "Review lawyer profiles and documents — approve or reject. Rejected lawyers can be re-approved." },
                      { step: "3", title: "Manage Users", desc: "View all users, suspend or activate accounts as needed." },
                      { step: "4", title: "Process Payouts", desc: "Review lawyer payout requests — approve, reject, or mark as processed." },
                      { step: "5", title: "Track Revenue", desc: "Monitor consultation transactions, platform fees, lawyer earnings, and subscription revenue." },
                      { step: "6", title: "Platform Guide", desc: "Reference this guide for platform usage across all roles." },
                    ].map((item) => (
                      <li key={item.step} className="flex gap-3">
                        <span className="w-6 h-6 bg-[#5DBB63] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{item.step}</span>
                        <div>
                          <p className="text-sm font-semibold text-[#1B2A4A]">{item.title}</p>
                          <p className="text-xs text-[#667085]">{item.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {manageLawyer && (<LawyerProfileModal lawyer={manageLawyer} onClose={() => setManageLawyer(null)} onUpdate={async (data) => { console.log("Lawyer profile updated:", data); }} />)}
    </div>
  );
}