'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'verifications' | 'users'>('overview');
  const [analytics, setAnalytics] = useState<any>(null);
  const [pendingLawyers, setPendingLawyers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [manageLawyer, setManageLawyer] = useState<any>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') { router.push('/login'); return; }
    fetchData();
  }, [user, authLoading]);

  async function fetchData() {
    setLoading(true);
    try {
      const [analyticsData, pendingData, usersData] = await Promise.all([api.getAnalytics(), api.getPendingVerifications(), api.getAdminUsers()]);
      setAnalytics(analyticsData); setPendingLawyers(pendingData.lawyers); setUsers(usersData.users);
    } catch (error) { console.error('Failed to fetch admin data:', error); }
    finally { setLoading(false); }
  }

  const fetchLawyerProfile = async (id: string) => {
    try { const profile = await api.getLawyerProfile(id); setManageLawyer(profile); }
    catch (error) { alert(error instanceof Error ? error.message : 'Failed to fetch lawyer profile'); }
  };

  const handleVerify = async (id: string, status: string) => {
    setActionLoading(id);
    try { await api.verifyLawyer(id, status); await fetchData(); }
    catch (error) { alert(error instanceof Error ? error.message : 'Failed to update verification status'); }
    finally { setActionLoading(null); }
  };

  const handleToggleUserStatus = async (id: string) => {
    setActionLoading(id);
    try { await api.toggleUserStatus(id); await fetchData(); }
    catch (error) { alert(error instanceof Error ? error.message : 'Failed to toggle user status'); }
    finally { setActionLoading(null); }
  };

  if (!user) return null;
  if (loading) return <div className="min-h-[calc(100vh-200px)] flex items-center justify-center"><div className="animate-spin w-10 h-10 border-2 border-[#1B2A4A] border-t-transparent rounded-full"></div></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1B2A4A] tracking-tight">Admin Dashboard</h1>
        <p className="text-[#667085] mt-1">Manage platform users, verifications, and analytics</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-[#EEF2F7] p-1 rounded-lg w-fit">
        {(['overview', 'verifications', 'users'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${activeTab === tab ? 'bg-white text-[#1B2A4A] shadow-sm' : 'text-[#667085] hover:text-[#1B2A4A]'}`}>
            {tab === 'verifications' ? 'Verifications' : tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && analytics && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
          <div className="bg-white rounded-xl border border-[#E5EAF0] p-6"><p className="text-sm font-medium text-[#667085] uppercase tracking-wide">Total Lawyers</p><p className="text-3xl font-bold text-[#1B2A4A] mt-2">{analytics.totalLawyers}</p></div>
          <div className="bg-white rounded-xl border border-[#E5EAF0] p-6"><p className="text-sm font-medium text-[#667085] uppercase tracking-wide">Verified</p><p className="text-3xl font-bold text-[#5DBB63] mt-2">{analytics.verifiedLawyers}</p></div>
          <div className="bg-white rounded-xl border border-[#E5EAF0] p-6"><p className="text-sm font-medium text-[#667085] uppercase tracking-wide">Pending</p><p className="text-3xl font-bold text-[#F59E0B] mt-2">{analytics.pendingLawyers}</p></div>
          <div className="bg-white rounded-xl border border-[#E5EAF0] p-6"><p className="text-sm font-medium text-[#667085] uppercase tracking-wide">Total Clients</p><p className="text-3xl font-bold text-[#2476B8] mt-2">{analytics.totalClients}</p></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div className="bg-white rounded-xl border border-[#E5EAF0] p-6"><p className="text-sm font-medium text-[#667085] uppercase tracking-wide">Total Leads</p><p className="text-3xl font-bold text-[#1B2A4A] mt-2">{analytics.totalLeads}</p></div>
          <div className="bg-white rounded-xl border border-[#E5EAF0] p-6"><p className="text-sm font-medium text-[#667085] uppercase tracking-wide">Paid Leads</p><p className="text-3xl font-bold text-[#5DBB63] mt-2">{analytics.paidLeads}</p></div>
          <div className="bg-white rounded-xl border border-[#E5EAF0] p-6"><p className="text-sm font-medium text-[#667085] uppercase tracking-wide">Active Subs</p><p className="text-3xl font-bold text-[#00A6A6] mt-2">{analytics.activeSubscriptions}</p></div>
          <div className="bg-white rounded-xl border border-[#E5EAF0] p-6"><p className="text-sm font-medium text-[#667085] uppercase tracking-wide">Featured</p><p className="text-3xl font-bold text-[#F59E0B] mt-2">{analytics.featuredActive}</p></div>
        </div>
      </>)}

      {/* Verifications Tab */}
      {activeTab === 'verifications' && (
        <div className="bg-white rounded-xl border border-[#E5EAF0]">
          <div className="p-6 border-b border-[#E5EAF0]"><h2 className="text-xl font-bold text-[#1B2A4A]">Pending Verifications</h2><p className="text-[#667085] text-sm mt-1">{pendingLawyers.length} lawyer{pendingLawyers.length !== 1 ? 's' : ''} awaiting review</p></div>
          {pendingLawyers.length === 0 ? (
            <div className="p-12 text-center"><div className="w-16 h-16 bg-[#ECFDF5] rounded-full flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8 text-[#5DBB63]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div><p className="text-lg text-[#667085] font-medium">All caught up!</p><p className="text-[#94A3B8] mt-1">No pending lawyer verifications</p></div>
          ) : (
            <div className="divide-y divide-[#E5EAF0]">
              {pendingLawyers.map((lawyer: any) => (
                <div key={lawyer._id} className="p-5 hover:bg-[#F5F7FA] transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-[#1B2A4A] rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">{lawyer.userId?.firstName?.[0]}{lawyer.userId?.lastName?.[0]}</div>
                      <div>
                        <p className="font-semibold text-[#1B2A4A]">{lawyer.userId?.firstName} {lawyer.userId?.lastName}</p>
                        <p className="text-sm text-[#667085]">{lawyer.userId?.email}</p>
                        <p className="text-sm text-[#667085] mt-1">Location: {lawyer.city}, {lawyer.state} | Bar: {lawyer.barNumber}</p>
                        <p className="text-sm text-[#667085]">Practice: {lawyer.practiceAreas?.slice(0, 3).join(', ')}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => fetchLawyerProfile(lawyer._id)} className="bg-[#2476B8] text-white px-3 py-1.5 rounded-lg hover:bg-[#1D6299] font-semibold text-sm transition-colors">View Details</button>
                      <button onClick={() => handleVerify(lawyer._id, 'verified')} disabled={actionLoading === lawyer._id} className="bg-[#5DBB63] text-white px-4 py-2 rounded-lg hover:bg-[#4CA652] font-semibold disabled:opacity-50 text-sm transition-colors">{actionLoading === lawyer._id ? '...' : 'Approve'}</button>
                      <button onClick={() => handleVerify(lawyer._id, 'rejected')} disabled={actionLoading === lawyer._id} className="bg-[#EF4444] text-white px-4 py-2 rounded-lg hover:bg-[#DC2626] font-semibold disabled:opacity-50 text-sm transition-colors">Reject</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-[#E5EAF0]">
          <div className="p-6 border-b border-[#E5EAF0]"><h2 className="text-xl font-bold text-[#1B2A4A]">User Management</h2><p className="text-[#667085] text-sm mt-1">{users.length} total users</p></div>
          {users.length === 0 ? (<div className="p-12 text-center"><p className="text-lg text-[#667085] font-medium">No users found</p></div>) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F5F7FA]"><tr><th className="text-left px-6 py-3">User</th><th className="text-left px-6 py-3">Email</th><th className="text-left px-6 py-3">Role</th><th className="text-left px-6 py-3">Status</th><th className="text-left px-6 py-3">Joined</th><th className="text-right px-6 py-3">Actions</th></tr></thead>
                <tbody className="divide-y divide-[#E5EAF0]">
                  {users.map((u: any) => (
                    <tr key={u._id} className="hover:bg-[#F5F7FA] transition-colors">
                      <td className="px-6 py-3"><div className="flex items-center space-x-3"><div className="w-9 h-9 bg-[#1B2A4A] rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">{u.firstName?.[0]}{u.lastName?.[0]}</div><span className="font-medium text-[#1B2A4A] text-sm">{u.firstName} {u.lastName}</span></div></td>
                      <td className="px-6 py-3 text-[#667085] text-sm">{u.email}</td>
                      <td className="px-6 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-[#EEF2F7] text-[#1B2A4A]' : u.role === 'lawyer' ? 'bg-[#EFF6FF] text-[#1E40AF]' : 'bg-[#ECFDF5] text-[#166534]'}`}>{u.role}</span></td>
                      <td className="px-6 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${u.isActive ? 'bg-[#ECFDF5] text-[#166534]' : 'bg-[#FEF2F2] text-[#991B1B]'}`}>{u.isActive ? 'Active' : 'Suspended'}</span></td>
                      <td className="px-6 py-3 text-[#94A3B8] text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-3 text-right">
                        {u.role === 'lawyer' && (<button onClick={() => fetchLawyerProfile(u._id)} className="px-3 py-1.5 mr-2 rounded-lg text-sm font-semibold bg-[#EFF6FF] text-[#2476B8] hover:bg-[#DBEAFE] transition-colors">Manage</button>)}
                        <button onClick={() => handleToggleUserStatus(u._id)} disabled={actionLoading === u._id || u.role === 'admin'}
                          className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${u.isActive ? 'bg-[#FEF2F2] text-[#EF4444] hover:bg-[#FEE2E2]' : 'bg-[#ECFDF5] text-[#5DBB63] hover:bg-[#D1FAE5]'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                          {actionLoading === u._id ? '...' : u.isActive ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Lawyer Profile Modal */}
      {manageLawyer && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="p-6 border-b border-[#E5EAF0] flex justify-between items-center"><h3 className="text-xl font-bold text-[#1B2A4A]">Lawyer Profile Details</h3><button onClick={() => setManageLawyer(null)} className="text-[#94A3B8] hover:text-[#1B2A4A] text-2xl">&times;</button></div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-4 mb-4 col-span-2">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-[#1B2A4A] flex items-center justify-center text-white text-lg font-bold flex-shrink-0">{manageLawyer.photo ? <img src={manageLawyer.photo} alt="" className="w-full h-full object-cover" /> : <span>{manageLawyer.userId?.firstName?.[0]}{manageLawyer.userId?.lastName?.[0]}</span>}</div>
                  <div><p className="text-lg font-bold text-[#1B2A4A]">{manageLawyer.userId?.firstName} {manageLawyer.userId?.lastName}</p><p className="text-sm text-[#667085]">{manageLawyer.userId?.email}</p></div>
                </div>
                <div><p className="text-sm text-[#94A3B8]">SCN Number</p><p className="font-semibold text-[#1B2A4A]">{manageLawyer.barNumber || "N/A"}</p></div>
                <div><p className="text-sm text-[#94A3B8]">Phone</p><p className="font-semibold text-[#1B2A4A]">{manageLawyer.phone || "Not provided"}</p></div>
                <div><p className="text-sm text-[#94A3B8]">Consultation Fee</p><p className="font-semibold text-[#1B2A4A]">₦{manageLawyer.consultationFee || 0}</p></div>
                <div><p className="text-sm text-[#94A3B8]">Status</p><span className={`px-2 py-1 rounded-full text-xs font-semibold ${manageLawyer.verificationStatus === 'verified' ? 'bg-[#ECFDF5] text-[#166534]' : manageLawyer.verificationStatus === 'pending' ? 'bg-[#FFFBEB] text-[#92400E]' : 'bg-[#FEF2F2] text-[#991B1B]'}`}>{manageLawyer.verificationStatus}</span></div>
              </div>
              <div><p className="text-sm text-[#94A3B8] font-semibold">Payout Details</p><p className="font-semibold text-[#1B2A4A] text-sm">Bank: {manageLawyer.bankName || 'Not provided'}</p><p className="font-semibold text-[#1B2A4A] text-sm">Account: {manageLawyer.accountNumber || 'Not provided'}</p><p className="font-semibold text-[#1B2A4A] text-sm">Name: {manageLawyer.accountName || 'Not provided'}</p></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}