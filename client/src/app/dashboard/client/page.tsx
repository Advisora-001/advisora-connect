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
  const [activeTab, setActiveTab] = useState<'overview' | 'enquiries' | 'appointments'>('overview');
  const [expandedEnquiry, setExpandedEnquiry] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'client') {
      router.push('/login');
      return;
    }
    fetchEnquiries();
    fetchAppointments();
  }, [user, loading]);

  async function fetchEnquiries() {
    try {
      const data = await api.getMyEnquiries();
      setEnquiries(data.leads);
    } catch {}
  }

  async function fetchAppointments() {
    try {
      const data = await api.getMyAppointments();
      setAppointments(data.appointments || []);
    } catch {}
  }

  const handleCancelAppointment = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await api.cancelAppointment(id);
      fetchAppointments();
      fetchEnquiries();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel appointment');
    }
  };

  const handleRetryPayment = (appointment: any) => {
    router.push('/payment/checkout?appointmentId=' + appointment._id + '&amount=' + appointment.totalAmount);
  };

  const handleBook = async (enquiryId: string) => {
    const date = prompt('Enter preferred date (YYYY-MM-DD):');
    if (!date) return;
    const timeSlot = prompt('Enter preferred time (e.g., 10:00 AM):');
    if (!timeSlot) return;
    
    try {
      const response = await api.bookConsultation(enquiryId, {
        date,
        timeSlot,
        duration: 30,
        consultationType: 'video',
      });
      router.push(`/payment/checkout?appointmentId=${response.appointment._id}&amount=${response.paymentBreakdown.total}`);
    } catch (err: any) {
      alert(err.message || 'Booking failed');
    }
  };

  if (loading) {
    return <div className="text-center py-20">Loading...</div>;
  }

  const pendingEnquiries = enquiries.filter((e: any) => e.status === 'pending');
  const acceptedEnquiries = enquiries.filter((e: any) => e.status === 'accepted');
  const bookedEnquiries = enquiries.filter((e: any) => e.status === 'booked');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1B2A4A]">
          Welcome, {user?.firstName}
        </h1>
        <p className="text-gray-600 mt-2">Manage your enquiries and appointments</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-lg font-semibold transition-all ${activeTab === 'overview' ? 'bg-accent text-white' : 'bg-gray-200 text-gray-600'}`}>Overview</button>
        <button onClick={() => setActiveTab('enquiries')} className={`px-4 py-2 rounded-lg font-semibold transition-all ${activeTab === 'enquiries' ? 'bg-accent text-white' : 'bg-gray-200 text-gray-600'}`}>My Enquiries</button>
        <button onClick={() => setActiveTab('appointments')} className={`px-4 py-2 rounded-lg font-semibold transition-all ${activeTab === 'appointments' ? 'bg-accent text-white' : 'bg-gray-200 text-gray-600'}`}>Appointments</button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <p className="text-3xl font-bold text-[#1B2A4A]">{enquiries.length}</p>
            <p className="text-gray-600 mt-2">Total Enquiries</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <p className="text-3xl font-bold text-green-600">{acceptedEnquiries.length + bookedEnquiries.length}</p>
            <p className="text-gray-600 mt-2">Accepted</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <p className="text-3xl font-bold text-[#C5A55A]">{appointments.length}</p>
            <p className="text-gray-600 mt-2">Appointments</p>
          </div>
        </div>
      )}

      {/* Enquiries Tab */}
      {activeTab === 'enquiries' && (
        <div className="space-y-6">
          {enquiries.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
              No enquiries yet. Browse lawyers and send your first enquiry!
            </div>
          ) : (
            enquiries.map((enquiry: any) => (
              <div key={enquiry._id} className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1B2A4A] rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {enquiry.lawyerId?.userId?.firstName?.[0]}{enquiry.lawyerId?.userId?.lastName?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-[#1B2A4A]">{enquiry.lawyerId?.userId?.firstName} {enquiry.lawyerId?.userId?.lastName}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          enquiry.status === 'accepted' ? 'bg-green-100 text-green-700' :
                          enquiry.status === 'booked' ? 'bg-blue-100 text-blue-700' :
                          enquiry.status === 'declined' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {enquiry.status}
                        </span>
                        <span className="text-xs text-gray-400">{new Date(enquiry.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  {enquiry.status === 'accepted' && (
                    <button onClick={() => handleBook(enquiry._id)} className="bg-[#C5A55A] text-[#1B2A4A] px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#d4b36a]">
                      Book Consultation
                    </button>
                  )}
                </div>
                
                {expandedEnquiry === enquiry._id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">{enquiry.enquiryMessage}</p>
                  </div>
                )}
                <button onClick={() => setExpandedEnquiry(expandedEnquiry === enquiry._id ? null : enquiry._id)} className="text-sm text-[#1B2A4A] mt-3 hover:underline">
                  {expandedEnquiry === enquiry._id ? 'Hide' : 'View Message'}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Appointments Tab */}
      {activeTab === 'appointments' && (
        <div className="space-y-6">
          {appointments.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
              No appointments yet. Book a consultation to get started!
            </div>
          ) : (
            appointments.map((appt: any) => (
              <div key={appt._id} className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-[#1B2A4A] capitalize">{appt.consultationType} Consultation</p>
                    <p className="text-sm text-gray-600">Date: {appt.date} at {appt.timeSlot}</p>
                    <p className="text-sm text-gray-600">Duration: {appt.duration} minutes</p>
                    <p className="text-sm text-gray-600">Fee: ₦{appt.consultationFee?.toLocaleString()} + ₦{appt.platformFee?.toLocaleString()} platform fee</p>
                    <p className="text-sm font-semibold mt-1">Total: ₦{appt.totalAmount?.toLocaleString()}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        appt.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {appt.paymentStatus}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        appt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        appt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {appt.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {appt.paymentStatus !== 'paid' && appt.status !== 'cancelled' && (
                      <>
                        <button onClick={() => handleRetryPayment(appt)} className="bg-[#C5A55A] text-[#1B2A4A] px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#d4b36a]">
                          Pay Now
                        </button>
                        <button onClick={() => handleCancelAppointment(appt._id)} className="bg-red-100 text-red-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-red-200">
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}