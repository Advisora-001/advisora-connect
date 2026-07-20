'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'verifications' | 'users'>('overview');
  const [analytics, setAnalytics] = useState<any>(null);
  const [pendingLawyers, setPendingLawyers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [manageLawyer, setManageLawyer] = useState<any>(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/login');
      return;
    }
    fetchData();
  }, [user]);

  async function fetchData() {
    setLoading(true);
    try {
      const [analyticsData, pendingData, usersData] = await Promise.all([
        api.getAnalytics(),
        api.getPendingVerifications(),
        api.getAdminUsers(),
      ]);
      setAnalytics(analyticsData);
      setPendingLawyers(pendingData.lawyers);
      setUsers(usersData.users);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLawyerProfile = async (id: string) => {
    try {
      const profile = await api.getLawyerProfile(id);
      setManageLawyer(profile);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to fetch lawyer profile');
    }
  };

  const handleVerify = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      await api.verifyLawyer(id, status);
      await fetchData();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update verification status');
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
      alert(error instanceof Error ? error.message : 'Failed to toggle user status');
    } finally {
      setActionLoading(null);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-primary/10">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-accent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-accent">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage platform users, verifications, and analytics</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b-2 border-primary/30 pb-2">
        {(['overview', 'verifications', 'users'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium capitalize transition-all rounded-t-lg ${
              activeTab === tab
                ? 'text-accent border-b-4 border-primary bg-white shadow-sm'
                : 'text-gray-500 hover:text-accent hover:bg-white/50'
            }`}
          >
            {tab === 'verifications' ? 'Verifications' : tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && analytics && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-primary hover:shadow-lg transition-shadow">
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Lawyers</p>
              <p className="text-3xl font-bold text-accent mt-2">{analytics.totalLawyers}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500 hover:shadow-lg transition-shadow">
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Verified</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{analytics.verifiedLawyers}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500 hover:shadow-lg transition-shadow">
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Pending</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{analytics.pendingLawyers}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Clients</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{analytics.totalClients}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Leads</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{analytics.totalLeads}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500 hover:shadow-lg transition-shadow">
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Paid Leads</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{analytics.paidLeads}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-indigo-500 hover:shadow-lg transition-shadow">
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Active Subs</p>
              <p className="text-3xl font-bold text-indigo-600 mt-2">{analytics.activeSubscriptions}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500 hover:shadow-lg transition-shadow">
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Featured</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{analytics.featuredActive}</p>
            </div>
          </div>
        </>
      )}

      {/* Verifications Tab */}
      {activeTab === 'verifications' && (
        <div className="bg-white rounded-xl shadow-lg border-2 border-primary/20">
          <div className="p-6 border-b-2 border-primary/20 bg-primary/5">
            <h2 className="text-2xl font-bold text-accent">Pending Verifications</h2>
            <p className="text-gray-600 text-sm mt-1">
              {pendingLawyers.length} lawyer{pendingLawyers.length !== 1 ? 's' : ''} awaiting review
            </p>
          </div>
          {pendingLawyers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xl text-gray-500 font-medium">All caught up!</p>
              <p className="text-gray-400 mt-2">No pending lawyer verifications</p>
            </div>
          ) : (
            <div className="divide-y divide-primary/10">
              {pendingLawyers.map((lawyer: any) => (
                <div key={lawyer._id} className="p-6 hover:bg-primary/5 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-14 h-14 bg-accent rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                        {lawyer.userId?.firstName?.[0]}{lawyer.userId?.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-accent text-lg">
                          {lawyer.userId?.firstName} {lawyer.userId?.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{lawyer.userId?.email}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Location: {lawyer.city}, {lawyer.state} | Bar: {lawyer.barNumber}
                        </p>
                        <p className="text-sm text-gray-500">
                          Practice: {lawyer.practiceAreas?.slice(0, 3).join(', ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => fetchLawyerProfile(lawyer._id)}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 font-semibold transition-all text-sm"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleVerify(lawyer._id, 'verified')}
                        disabled={actionLoading === lawyer._id}
                        className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50 transition-all"
                      >
                        {actionLoading === lawyer._id ? '...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleVerify(lawyer._id, 'rejected')}
                        disabled={actionLoading === lawyer._id}
                        className="bg-red-500 text-white px-5 py-2.5 rounded-lg hover:bg-red-600 font-semibold disabled:opacity-50 transition-all"
                      >
                        Reject
                      </button>
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
        <div className="bg-white rounded-xl shadow-lg border-2 border-primary/20">
          <div className="p-6 border-b-2 border-primary/20 bg-primary/5">
            <h2 className="text-2xl font-bold text-accent">User Management</h2>
            <p className="text-gray-600 text-sm mt-1">{users.length} total users</p>
          </div>
          {users.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-xl text-gray-500 font-medium">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-accent">User</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-accent">Email</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-accent">Role</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-accent">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-accent">Joined</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-accent">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10">
                  {users.map((u: any) => (
                    <tr key={u._id} className="hover:bg-primary/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {u.firstName?.[0]}{u.lastName?.[0]}
                          </div>
                          <span className="font-medium text-accent">{u.firstName} {u.lastName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                          u.role === 'lawyer' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {u.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {u.role === 'lawyer' && (
                          <button
                            onClick={() => fetchLawyerProfile(u._id)}
                            className="px-3 py-1.5 mr-2 rounded-lg text-sm font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
                          >
                            Manage
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleUserStatus(u._id)}
                          disabled={actionLoading === u._id || u.role === 'admin'}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            u.isActive
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-primary/20 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-accent">Lawyer Profile Details</h3>
              <button onClick={() => setManageLawyer(null)} className="text-gray-400 hover:text-accent text-2xl">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-4 mb-4 col-span-2">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-accent flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {manageLawyer.photo ? (
                      <img src={manageLawyer.photo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>{manageLawyer.userId?.firstName?.[0]}{manageLawyer.userId?.lastName?.[0]}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-accent">{manageLawyer.userId?.firstName} {manageLawyer.userId?.lastName}</p>
                    <p className="text-sm text-gray-500">{manageLawyer.userId?.email}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bar Number</p>
                  <p className="font-semibold text-accent">{manageLawyer.barNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fee</p>
                  <p className="font-semibold text-accent">￦{manageLawyer.consultationFee || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bar Number</p>
                  <p className="font-semibold text-accent">{manageLawyer.barNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Consultation Fee</p>
                  <p className="font-semibold text-accent">₦{manageLawyer.consultationFee || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    manageLawyer.verificationStatus === 'verified' ? 'bg-green-100 text-green-700' :
                    manageLawyer.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {manageLawyer.verificationStatus}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-semibold">Payout Details</p>
                <p className="font-semibold text-accent">Bank: {manageLawyer.bankName || 'Not provided'}</p>
                <p className="font-semibold text-accent">Account: {manageLawyer.accountNumber || 'Not provided'}</p>
                <p className="font-semibold text-accent">Name: {manageLawyer.accountName || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}