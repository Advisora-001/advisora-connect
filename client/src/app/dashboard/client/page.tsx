'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

export default function ClientDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'enquiries' | 'history'>('overview');
  const [expandedEnquiry, setExpandedEnquiry] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'client') {
      router.push('/login');
      return;
    }
    fetchEnquiries();
  }, [user, loading]);

  async function fetchEnquiries() {
    try {
      const data = await api.getMyEnquiries();
      setEnquiries(data.leads);
    } catch {}
  }

  const handleBookConsultation = async (leadId: string) => {
    try {
      const response = await api.bookConsultation(leadId, {
        date: new Date(),
        timeSlot: "Morning",
        duration: 30,
        consultationType: "video"
      });
      if (response.appointment) {
        // Navigate to payment checkout page
        const appointment = response.appointment;
        router.push(`/payment/checkout?appointmentId=${appointment._id}&amount=${response.paymentBreakdown?.total}`);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to book consultation');
    }
  };

  if (!user) return null;

  const acceptedEnquiries = enquiries.filter(e => e.status === 'accepted');
  const bookedEnquiries = enquiries.filter(e => e.status === 'booked');
  const pendingEnquiries = enquiries.filter(e => e.status === 'pending');

  const getStatusBadge = (enquiry: any) => {
    const status = enquiry.status || enquiry.paymentStatus;
    switch (status) {
      case 'accepted':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Lawyer Accepted - Book Consultation</span>;
      case 'booked':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Booked</span>;
      case 'declined':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Lawyer Declined</span>;
      case 'paid':
      case 'contacted':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Contact Revealed</span>;
      case 'pending':
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">Awaiting Response</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-accent">Client Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user.firstName} {user.lastName}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b-2 border-primary/30 pb-2">
        {(['overview', 'enquiries', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium capitalize transition-all rounded-t-lg ${
              activeTab === tab 
                ? 'text-accent border-b-4 border-primary bg-white shadow-sm' 
                : 'text-gray-500 hover:text-accent hover:bg-white/50'
            }`}
          >
            {tab === 'history' ? 'Payment History' : tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-primary hover:shadow-lg transition-shadow">
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Enquiries</p>
              <p className="text-4xl font-bold text-accent mt-3">{enquiries.length}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500 hover:shadow-lg transition-shadow">
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Pending</p>
              <p className="text-4xl font-bold text-yellow-600 mt-3">{pendingEnquiries.length}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500 hover:shadow-lg transition-shadow">
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Accepted</p>
              <p className="text-4xl font-bold text-green-600 mt-3">{acceptedEnquiries.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-primary/20 p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-accent">Need Legal Help?</h2>
                <p className="text-gray-600 mt-1">Find the right lawyer for your needs</p>
              </div>
              <Link
                href="/lawyers"
                className="bg-accent text-white px-6 py-3 rounded-lg hover:bg-accent/90 font-bold shadow-md transition-all"
              >
                Browse Lawyers
              </Link>
            </div>
          </div>

          {/* Recent Enquiries Preview */}
          {enquiries.length > 0 && (
            <div className="mt-8 bg-white rounded-xl shadow-lg border-2 border-primary/20">
              <div className="p-6 border-b-2 border-primary/20 bg-primary/5">
                <h2 className="text-xl font-bold text-accent">Recent Enquiries</h2>
              </div>
              <div className="divide-y divide-primary/10">
                {enquiries.slice(0, 3).map((enquiry: any) => (
                  <div key={enquiry._id} className="p-6 hover:bg-primary/5 transition-colors">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {enquiry.lawyerId?.userId?.firstName?.[0]}{enquiry.lawyerId?.userId?.lastName?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-accent">
                          {enquiry.lawyerId?.userId?.firstName} {enquiry.lawyerId?.userId?.lastName}
                        </p>
                        <p className="text-gray-600 mt-1 line-clamp-2">{enquiry.enquiryMessage}</p>
                        <p className="text-sm text-gray-400 mt-2">
                          {new Date(enquiry.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', month: 'long', day: 'numeric' 
                          })}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusBadge(enquiry)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {enquiries.length > 3 && (
                <div className="p-4 text-center border-t border-primary/10">
                  <button
                    onClick={() => setActiveTab('enquiries')}
                    className="text-accent font-semibold hover:underline"
                  >
                    View All Enquiries →
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Enquiries Tab */}
      {activeTab === 'enquiries' && (
        <div className="bg-white rounded-xl shadow-lg border-2 border-primary/20">
          <div className="p-6 border-b-2 border-primary/20 bg-primary/5">
            <h2 className="text-2xl font-bold text-accent">My Enquiries</h2>
            <p className="text-gray-600 text-sm mt-1">
              {enquiries.length} total {enquiries.length === 1 ? 'enquiry' : 'enquiries'}
            </p>
          </div>
          {enquiries.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-primary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <p className="text-xl text-gray-500 font-medium">No enquiries yet</p>
              <p className="text-gray-400 mt-2">Start by browsing lawyers and sending an enquiry</p>
              <Link
                href="/lawyers"
                className="inline-block mt-6 bg-accent text-white px-6 py-3 rounded-lg hover:bg-accent/90 font-bold shadow-md transition-all"
              >
                Browse Lawyers
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-primary/10">
              {enquiries.map((enquiry: any) => (
                <div key={enquiry._id} className="p-6 hover:bg-primary/5 transition-colors">
                  <div 
                    className="flex items-start space-x-4 cursor-pointer"
                    onClick={() => setExpandedEnquiry(expandedEnquiry === enquiry._id ? null : enquiry._id)}
                  >
                    <div className="w-14 h-14 bg-accent rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                      {enquiry.lawyerId?.userId?.firstName?.[0]}{enquiry.lawyerId?.userId?.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-accent text-lg">
                            {enquiry.lawyerId?.userId?.firstName} {enquiry.lawyerId?.userId?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {enquiry.lawyerId?.practiceAreas?.slice(0, 2).join(', ') || 'Legal Professional'}
                          </p>
                        </div>
                        {getStatusBadge(enquiry)}
                      </div>
                      <p className="text-gray-600 mt-2 line-clamp-2">{enquiry.enquiryMessage}</p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                        <span>{new Date(enquiry.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', month: 'long', day: 'numeric' 
                        })}</span>
                        {enquiry.paymentRef && (
                          <span>Ref: {enquiry.paymentRef}</span>
                        )}
                      </div>
                    </div>
                    <svg className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${expandedEnquiry === enquiry._id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* Expanded Details */}
                  {expandedEnquiry === enquiry._id && (
                    <div className="mt-4 ml-18 pl-4 border-l-2 border-primary/30 p-4 bg-primary/5 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-semibold text-accent">Lawyer City</p>
                          <p className="text-gray-600">{enquiry.lawyerId?.city || 'N/A'}, {enquiry.lawyerId?.state || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-accent">Status</p>
                          <p className="text-gray-600 capitalize">{enquiry.status}</p>
                        </div>
                        {enquiry.status === 'accepted' && (
                          <div className="col-span-2">
                            <button
                              onClick={() => handleBookConsultation(enquiry._id)}
                              className="bg-accent text-white px-6 py-3 rounded-lg hover:bg-accent/90 font-bold shadow-md transition-all"
                            >
                              Book Consultation
                            </button>
                            <p className="text-sm text-gray-500 mt-2">Click to book and proceed to payment</p>
                          </div>
                        )}
                        {enquiry.lawyerId?.userId?.email && (enquiry.status === 'paid' || enquiry.status === 'booked') && (
                          <div className="col-span-2">
                            <p className="text-sm font-semibold text-accent">Lawyer Contact</p>
                            <p className="text-gray-600">📧 {enquiry.lawyerId.userId.email}</p>
                            {enquiry.lawyerId.userId.phone && (
                              <p className="text-gray-600">📞 {enquiry.lawyerId.userId.phone}</p>
                            )}
                          </div>
                        )}
                        {enquiry.lawyerId?.consultationFee && (
                          <div>
                            <p className="text-sm font-semibold text-accent">Consultation Fee</p>
                            <p className="text-gray-600">₦{enquiry.lawyerId.consultationFee?.toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payment History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl shadow-lg border-2 border-primary/20">
          <div className="p-6 border-b-2 border-primary/20 bg-primary/5">
            <h2 className="text-2xl font-bold text-accent">Payment History</h2>
            <p className="text-gray-600 text-sm mt-1">
              {bookedEnquiries.length} completed {bookedEnquiries.length === 1 ? 'booking' : 'bookings'}
            </p>
          </div>
          {bookedEnquiries.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-primary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xl text-gray-500 font-medium">No payments yet</p>
              <p className="text-gray-400 mt-2">Payments will appear here after consultation bookings</p>
            </div>
          ) : (
            <div className="divide-y divide-primary/10">
              {bookedEnquiries.map((enquiry: any) => (
                <div key={enquiry._id} className="p-6 hover:bg-primary/5 transition-colors">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-accent">
                            {enquiry.lawyerId?.userId?.firstName} {enquiry.lawyerId?.userId?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(enquiry.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', month: 'long', day: 'numeric' 
                            })}
                          </p>
                        </div>
                        <span className="text-green-600 font-bold">
                          ₦{enquiry.lawyerId?.consultationFee ? (enquiry.lawyerId.consultationFee + 10000).toLocaleString() : '10,000'}
                        </span>
                      </div>
                      {enquiry.paymentRef && (
                        <p className="text-xs text-gray-400 mt-2">Reference: {enquiry.paymentRef}</p>
                      )}
                      {enquiry.lawyerId?.userId?.email && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-sm font-semibold text-green-700">Contact Details Revealed</p>
                          <p className="text-sm text-green-600 mt-1">📧 {enquiry.lawyerId.userId.email}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
