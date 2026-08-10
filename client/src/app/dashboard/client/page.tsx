'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

export default function ClientDashboard() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'enquiries' | 'appointments' | 'profile'>('overview');
  const [expandedEnquiry, setExpandedEnquiry] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [bookingLoading, setBookingLoading] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', phone: '' });

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'client') { router.push('/login'); return; }
    fetchEnquiries();
    fetchAppointments();
    if (user) setProfileForm({ firstName: user.firstName || '', lastName: user.lastName || '', phone: user.phone || '' });
  }, [user, loading]);

  async function fetchEnquiries() { try { const data = await api.getMyEnquiries(); setEnquiries(data.leads); } catch {} }
  async function fetchAppointments() { try { const data = await api.getMyAppointments(); setAppointments(data.appointments || []); } catch {} }
  
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.updateUserProfile(profileForm); await refreshUser(); alert('Profile updated successfully!'); }
    catch (err: any) { alert(err.message || 'Failed to update profile'); }
  };

  const handleCancelAppointment = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try { await api.cancelAppointment(id); fetchAppointments(); fetchEnquiries(); } catch (err: any) { alert(err.message || 'Failed to cancel appointment'); }
  };

  const handleRetryPayment = (appointment: any) => {
    router.push('/payment/checkout?appointmentId=' + appointment._id + '&amount=' + appointment.totalAmount);
  };

  const handleBookFromAcceptedLead = async (lead: any) => {
    const ctx = lead.bookingContext;
    if (!ctx) { alert('This enquiry has no booking details. Please use the booking wizard instead.'); router.push(`/book/${lead.lawyerId?._id}`); return; }
    setBookingLoading(lead._id);
    try {
      const response = await api.bookConsultation(lead._id, { date: ctx.date, timeSlot: ctx.timeSlot, duration: ctx.duration || 30, consultationType: ctx.consultationType || 'video' });
      router.push(`/payment/checkout?appointmentId=${response.appointment._id}&amount=${response.paymentBreakdown.total}`);
    } catch (err: any) { alert(err.message || 'Booking failed'); setBookingLoading(null); }
  };

  if (loading) return <div className="text-center py-20"><div className="animate-spin w-8 h-8 border-2 border-[#1B2A4A] border-t-transparent rounded-full mx-auto"></div></div>;

  const pendingEnquiries = enquiries.filter((e: any) => e.status === 'pending');
  const acceptedEnquiries = enquiries.filter((e: any) => e.status === 'accepted');
  const bookedEnquiries = enquiries.filter((e: any) => e.status === 'booked');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1B2A4A] tracking-tight">Welcome, {user?.firstName}</h1>
        <p className="text-[#667085] mt-1">Manage your enquiries and appointments</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-[#EEF2F7] p-1 rounded-lg w-fit">
        {(['overview', 'enquiries', 'appointments', 'profile'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${activeTab === tab ? 'bg-white text-[#1B2A4A] shadow-sm' : 'text-[#667085] hover:text-[#1B2A4A]'}`}>
            {tab === 'enquiries' ? 'My Enquiries' : tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white rounded-xl border border-[#E5EAF0] p-6">
            <p className="text-sm font-medium text-[#667085] uppercase tracking-wide">Total Enquiries</p>
            <p className="text-3xl font-bold text-[#1B2A4A] mt-2">{enquiries.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E5EAF0] p-6">
            <p className="text-sm font-medium text-[#667085] uppercase tracking-wide">Accepted</p>
            <p className="text-3xl font-bold text-[#5DBB63] mt-2">{acceptedEnquiries.length + bookedEnquiries.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E5EAF0] p-6">
            <p className="text-sm font-medium text-[#667085] uppercase tracking-wide">Appointments</p>
            <p className="text-3xl font-bold text-[#00A6A6] mt-2">{appointments.length}</p>
          </div>
        </div>
      )}

      {/* Enquiries Tab */}
      {activeTab === 'enquiries' && (
        <div className="space-y-4">
          {enquiries.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E5EAF0] p-12 text-center text-[#667085]">No enquiries yet. Browse lawyers and send your first enquiry!</div>
          ) : (
            enquiries.map((enquiry: any) => (
              <div key={enquiry._id} className="bg-white rounded-xl border border-[#E5EAF0] p-5">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1B2A4A] rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {enquiry.lawyerId?.userId?.firstName?.[0]}{enquiry.lawyerId?.userId?.lastName?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-[#1B2A4A]">{enquiry.lawyerId?.userId?.firstName} {enquiry.lawyerId?.userId?.lastName}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          enquiry.status === 'accepted' ? 'bg-[#ECFDF5] text-[#166534]' :
                          enquiry.status === 'booked' ? 'bg-[#EFF6FF] text-[#1E40AF]' :
                          enquiry.status === 'declined' ? 'bg-[#FEF2F2] text-[#991B1B]' :
                          'bg-[#FFFBEB] text-[#92400E]'
                        }`}>{enquiry.status}</span>
                        <span className="text-xs text-[#94A3B8]">{new Date(enquiry.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  {enquiry.status === 'accepted' && (
                    <button onClick={() => handleBookFromAcceptedLead(enquiry)} disabled={bookingLoading === enquiry._id}
                      className="bg-[#1B2A4A] text-white px-4 py-2 rounded-lg hover:bg-[#16213A] font-semibold text-sm disabled:opacity-50 transition-colors">
                      {bookingLoading === enquiry._id ? 'Booking...' : 'Book Consultation'}
                    </button>
                  )}
                </div>
                {enquiry.bookingContext && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="bg-[#EFF6FF] text-[#1E40AF] text-xs px-2 py-1 rounded-full font-medium">{enquiry.bookingContext.service?.name}</span>
                    <span className="bg-[#EEF2F7] text-[#475569] text-xs px-2 py-1 rounded-full font-medium">{enquiry.bookingContext.date}</span>
                    <span className="bg-[#ECFDF5] text-[#166534] text-xs px-2 py-1 rounded-full font-medium">{enquiry.bookingContext.timeSlot}</span>
                  </div>
                )}
                {expandedEnquiry === enquiry._id && (
                  <div className="mt-3 p-4 bg-[#F5F7FA] rounded-lg"><p className="text-sm text-[#475569]">{enquiry.enquiryMessage}</p></div>
                )}
                <button onClick={() => setExpandedEnquiry(expandedEnquiry === enquiry._id ? null : enquiry._id)} className="text-sm text-[#00A6A6] mt-3 hover:underline font-medium">
                  {expandedEnquiry === enquiry._id ? 'Hide' : 'View Message'}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Appointments Tab */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          {appointments.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E5EAF0] p-12 text-center text-[#667085]">No appointments yet. Book a consultation to get started!</div>
          ) : (
            appointments.map((appt: any) => (
              <div key={appt._id} className="bg-white rounded-xl border border-[#E5EAF0] p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-[#1B2A4A] capitalize">{appt.consultationType} Consultation</p>
                    <p className="text-sm text-[#667085]">Date: {new Date(appt.date).toLocaleDateString()} at {appt.timeSlot}</p>
                    <p className="text-sm text-[#667085]">Duration: {appt.duration} minutes</p>
                    <p className="text-sm text-[#667085]">Fee: ₦{appt.consultationFee?.toLocaleString()} + ₦{appt.platformFee?.toLocaleString()} platform fee</p>
                    <p className="text-sm font-semibold mt-1 text-[#1B2A4A]">Total: ₦{appt.totalAmount?.toLocaleString()}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${appt.paymentStatus === 'paid' ? 'bg-[#ECFDF5] text-[#166534]' : 'bg-[#FFFBEB] text-[#92400E]'}`}>{appt.paymentStatus}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        appt.status === 'confirmed' ? 'bg-[#EFF6FF] text-[#1E40AF]' :
                        appt.status === 'completed' ? 'bg-[#ECFDF5] text-[#166534]' :
                        appt.status === 'cancelled' ? 'bg-[#FEF2F2] text-[#991B1B]' :
                        'bg-[#EEF2F7] text-[#667085]'
                      }`}>{appt.status}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    {appt.paymentStatus !== 'paid' && appt.status !== 'cancelled' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleRetryPayment(appt)} className="bg-[#1B2A4A] text-white px-4 py-2 rounded-lg hover:bg-[#16213A] font-semibold text-sm transition-colors">Pay Now</button>
                        <button onClick={() => handleCancelAppointment(appt._id)} className="bg-[#FEF2F2] text-[#EF4444] px-4 py-2 rounded-lg hover:bg-[#FEE2E2] font-semibold text-sm transition-colors">Cancel</button>
                      </div>
                    )}
                    {appt.paymentStatus === 'paid' && appt.status !== 'cancelled' && appt.status !== 'completed' && appt.meetingLink && (
                      <a href={appt.meetingLink} target="_blank" rel="noopener noreferrer" className="bg-[#5DBB63] text-white px-4 py-2 rounded-lg hover:bg-[#4CA652] font-semibold text-sm text-center transition-colors">Join Consultation</a>
                    )}
                    {appt.status === 'completed' && (
                      <button onClick={() => router.push(`/lawyers/${appt.lawyerId?._id || appt.lawyerId}`)} className="bg-[#00A6A6] text-white px-4 py-2 rounded-lg hover:bg-[#008F8F] font-semibold text-sm transition-colors">Leave a Review</button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl border border-[#E5EAF0] p-8 max-w-lg">
          <h2 className="text-xl font-bold text-[#1B2A4A] mb-6 pb-3 border-b border-[#E5EAF0]">Edit Profile</h2>
          <form onSubmit={handleProfileUpdate} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">First Name</label>
                <input type="text" value={profileForm.firstName} onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                  className="w-full px-4 py-3 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm" placeholder="First name" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Last Name</label>
                <input type="text" value={profileForm.lastName} onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                  className="w-full px-4 py-3 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm" placeholder="Last name" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Phone Number</label>
              <input type="tel" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full px-4 py-3 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm" placeholder="e.g., +234 800 000 0000" />
            </div>
            <button type="submit" className="bg-[#1B2A4A] text-white px-6 py-3 rounded-lg hover:bg-[#16213A] font-semibold text-sm transition-colors">Save Changes</button>
          </form>
        </div>
      )}
    </div>
  );
}
