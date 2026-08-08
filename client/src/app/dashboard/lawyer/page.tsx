"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import LawyerSidebar from "@/components/lawyer/Sidebar";

export default function LawyerDashboard() {
  const { user, profile, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [leads, setLeads] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState<
    "dashboard" | "enquiries" | "appointments" | "profile" | "payout"
  >("dashboard");
  const [profileForm, setProfileForm] = useState<any>({});
  const [meetingLinkInput, setMeetingLinkInput] = useState("");
  const [showMeetingInput, setShowMeetingInput] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "lawyer") { router.push("/login"); return; }
    fetchLeads(); fetchAppointments();
    if (profile) setProfileForm(profile);
  }, [user, profile, loading]);

  async function fetchLeads() { try { const data = await api.getLeads(); setLeads(data.leads); } catch {} }
  async function fetchAppointments() { try { const data = await api.getLawyerAppointments(); setAppointments(data.appointments || []); } catch {} }

  const handleRespond = async (leadId: string, status: "accepted" | "declined") => {
    setLeads(leads.map((l) => (l._id === leadId ? { ...l, responding: true } : l)));
    try { await api.respondToLead(leadId, status); await fetchLeads(); }
    catch (error) { alert(error instanceof Error ? error.message : "Failed to respond"); setLeads(leads.map((l) => (l._id === leadId ? { ...l, responding: false } : l))); }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = { ...profileForm };
    if (dataToSave.availableFrom && dataToSave.availableTo) dataToSave.availableHours = `${dataToSave.availableFrom} - ${dataToSave.availableTo}`;
    try { await api.updateLawyerProfile(dataToSave); await refreshUser(); alert("Profile updated successfully!"); }
    catch (error) { alert(`Failed to update profile: ${error instanceof Error ? error.message : "Unknown error"}`); }
  };

  const handleGenerateMeeting = async (appointmentId: string) => {
    setActionLoading(appointmentId);
    try { const result = await api.generateMeetingLink(appointmentId); if (result.meetingLink) alert("Google Meet link generated successfully!"); else alert(result.message || "Auto-generation unavailable. Please add a link manually."); await fetchAppointments(); }
    catch (err: any) { alert(err.message || "Failed to generate meeting link"); }
    finally { setActionLoading(null); }
  };

  const handleSetMeetingLink = async (appointmentId: string) => {
    if (!meetingLinkInput) return; setActionLoading(appointmentId);
    try { await api.setMeetingLink(appointmentId, meetingLinkInput); setMeetingLinkInput(""); setShowMeetingInput(null); await fetchAppointments(); }
    catch (err: any) { alert(err.message || "Failed to set meeting link"); }
    finally { setActionLoading(null); }
  };

  const handleCompleteAppointment = async (appointmentId: string) => {
    if (!confirm("Mark this consultation as completed?")) return; setActionLoading(appointmentId);
    try { await api.completeAppointment(appointmentId); await fetchAppointments(); }
    catch (err: any) { alert(err.message || "Failed to complete appointment"); }
    finally { setActionLoading(null); }
  };

  if (!user) return null;

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <LawyerSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8 overflow-auto bg-[#F5F7FA]">
        {/* Dashboard Section */}
        {activeSection === "dashboard" && (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[#1B2A4A] tracking-tight">Dashboard</h1>
              <p className="text-[#667085] mt-1">Welcome back, {user.firstName} {user.lastName}</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white rounded-xl border border-[#E5EAF0] p-6">
                <p className="text-sm font-medium text-[#667085] uppercase tracking-wide">Total Leads</p>
                <p className="text-3xl font-bold text-[#1B2A4A] mt-2">{leads.length}</p>
              </div>
              <div className="bg-white rounded-xl border border-[#E5EAF0] p-6">
                <p className="text-sm font-medium text-[#667085] uppercase tracking-wide">Unpaid Leads</p>
                <p className="text-3xl font-bold text-[#F59E0B] mt-2">{leads.filter((l) => l.paymentStatus === "unpaid").length}</p>
              </div>
              <div className="bg-white rounded-xl border border-[#E5EAF0] p-6">
                <p className="text-sm font-medium text-[#667085] uppercase tracking-wide">Appointments</p>
                <p className="text-3xl font-bold text-[#5DBB63] mt-2">{appointments.length}</p>
              </div>
              <div className="bg-white rounded-xl border border-[#E5EAF0] p-6">
                <p className="text-sm font-medium text-[#667085] uppercase tracking-wide">Verification</p>
                <p className={`text-xl font-bold mt-2 capitalize ${profile?.verificationStatus === "verified" ? "text-[#5DBB63]" : "text-[#F59E0B]"}`}>
                  {profile?.verificationStatus || "pending"}
                </p>
                {profile?.verificationStatus !== "verified" && (
                  <p className="text-sm text-[#667085] mt-1">Profile pending admin review</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Enquiries Section */}
        {activeSection === "enquiries" && (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[#1B2A4A] tracking-tight">Client Enquiries</h1>
              <p className="text-[#667085] mt-1">Manage incoming client enquiries and booking requests</p>
            </div>
            <div className="bg-white rounded-xl border border-[#E5EAF0]">
              {leads.length === 0 ? (
                <div className="p-12 text-center text-[#667085]">No enquiries yet.</div>
              ) : (
                <div className="divide-y divide-[#E5EAF0]">
                  {leads.map((lead: any) => (
                    <div key={lead._id} className="p-5 hover:bg-[#F5F7FA] transition-colors">
                      <div className="mb-3">
                        <p className="font-semibold text-[#1B2A4A]">
                          {lead.enquiryMessage?.substring(0, 100)}{lead.enquiryMessage?.length > 100 ? "..." : ""}
                        </p>
                        <p className="text-sm text-[#667085] mt-1">{new Date(lead.createdAt).toLocaleDateString()} • {lead.clientName}</p>
                        {lead.bookingContext && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="bg-[#EFF6FF] text-[#1E40AF] text-xs px-2 py-1 rounded-full font-medium">{lead.bookingContext.service?.name}</span>
                            <span className="bg-[#EEF2F7] text-[#475569] text-xs px-2 py-1 rounded-full font-medium">{lead.bookingContext.date}</span>
                            <span className="bg-[#ECFDF5] text-[#166534] text-xs px-2 py-1 rounded-full font-medium">{lead.bookingContext.timeSlot}</span>
                            <span className="bg-[#EEF2F7] text-[#667085] text-xs px-2 py-1 rounded-full font-medium capitalize">{lead.bookingContext.consultationType}</span>
                          </div>
                        )}
                      </div>
                      {lead.status === "pending" && (
                        <div className="flex gap-3">
                          <button onClick={() => handleRespond(lead._id, "accepted")} disabled={lead.responding}
                            className="px-4 py-2 bg-[#5DBB63] text-white rounded-lg hover:bg-[#4CA652] disabled:opacity-50 font-semibold text-sm transition-colors">Accept</button>
                          <button onClick={() => handleRespond(lead._id, "declined")} disabled={lead.responding}
                            className="px-4 py-2 bg-[#EF4444] text-white rounded-lg hover:bg-[#DC2626] disabled:opacity-50 font-semibold text-sm transition-colors">Decline</button>
                        </div>
                      )}
                      {lead.status === "accepted" && (
                        <div className="mt-3 p-4 bg-[#ECFDF5] rounded-lg border border-[#5DBB63]/20">
                          <p className="font-semibold text-[#166534] mb-2">Contact Details:</p>
                          <p className="text-[#1B2A4A] text-sm">📧 {lead.clientEmail}</p>
                          {lead.clientPhone && <p className="text-[#1B2A4A] text-sm">📱 {lead.clientPhone}</p>}
                        </div>
                      )}
                      {lead.status === "declined" && (
                        <span className="inline-block px-4 py-2 bg-[#FEF2F2] text-[#991B1B] rounded-full font-semibold text-sm">Declined</span>
                      )}
                      {lead.status === "booked" && (
                        <span className="inline-block px-4 py-2 bg-[#EFF6FF] text-[#1E40AF] rounded-full font-semibold text-sm">Booked</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Appointments Section */}
        {activeSection === "appointments" && (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[#1B2A4A] tracking-tight">Appointments</h1>
              <p className="text-[#667085] mt-1">Manage your consultations and meeting links</p>
            </div>
            <div className="bg-white rounded-xl border border-[#E5EAF0]">
              {appointments.length === 0 ? (
                <div className="p-12 text-center text-[#667085]">No appointments yet.</div>
              ) : (
                <div className="divide-y divide-[#E5EAF0]">
                  {appointments.map((appt: any) => (
                    <div key={appt._id} className="p-5 hover:bg-[#F5F7FA] transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-[#1B2A4A] capitalize">{appt.consultationType} Consultation</p>
                          <p className="text-sm text-[#667085]">Client: {appt.clientId?.firstName} {appt.clientId?.lastName} ({appt.clientId?.email})</p>
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
                            {appt.completionSource && <span className="text-xs text-[#94A3B8]">via {appt.completionSource}</span>}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          {appt.paymentStatus === 'paid' && appt.status !== 'cancelled' && appt.status !== 'completed' && (<>
                            {appt.meetingLink ? (<>
                              <a href={appt.meetingLink} target="_blank" rel="noopener noreferrer"
                                className="bg-[#5DBB63] text-white px-4 py-2 rounded-lg hover:bg-[#4CA652] font-semibold text-sm text-center transition-colors">Join Consultation</a>
                              <button onClick={() => handleGenerateMeeting(appt._id)} disabled={actionLoading === appt._id}
                                className="text-xs text-[#00A6A6] hover:underline">Regenerate Link</button>
                            </>) : (<>
                              <button onClick={() => handleGenerateMeeting(appt._id)} disabled={actionLoading === appt._id}
                                className="bg-[#1B2A4A] text-white px-4 py-2 rounded-lg hover:bg-[#16213A] font-semibold text-sm disabled:opacity-50 transition-colors">
                                {actionLoading === appt._id ? 'Generating...' : 'Generate Meet Link'}
                              </button>
                              {showMeetingInput === appt._id ? (
                                <div className="flex gap-2 mt-1">
                                  <input type="text" value={meetingLinkInput} onChange={(e) => setMeetingLinkInput(e.target.value)}
                                    placeholder="Paste Meet/Zoom link" className="px-3 py-1.5 border border-[#E5EAF0] rounded-lg text-sm w-48" />
                                  <button onClick={() => handleSetMeetingLink(appt._id)} disabled={actionLoading === appt._id}
                                    className="bg-[#00A6A6] text-white px-3 py-1.5 rounded-lg font-semibold text-sm disabled:opacity-50 transition-colors">Save</button>
                                </div>
                              ) : (
                                <button onClick={() => { setShowMeetingInput(appt._id); setMeetingLinkInput(''); }}
                                  className="text-xs text-[#00A6A6] hover:underline">Add Link Manually</button>
                              )}
                            </>)}
                            <button onClick={() => handleCompleteAppointment(appt._id)} disabled={actionLoading === appt._id}
                              className="bg-[#00A6A6] text-white px-4 py-2 rounded-lg hover:bg-[#008F8F] font-semibold text-sm disabled:opacity-50 transition-colors">
                              {actionLoading === appt._id ? '...' : 'Mark Complete'}
                            </button>
                          </>)}
                          {appt.status === 'completed' && appt.meetingLink && (
                            <a href={appt.meetingLink} target="_blank" rel="noopener noreferrer"
                              className="bg-[#EEF2F7] text-[#667085] px-4 py-2 rounded-lg font-semibold text-sm">View Meeting Link</a>
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

        {/* Profile Section */}
        {activeSection === "profile" && (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[#1B2A4A] tracking-tight">Edit Profile</h1>
              <p className="text-[#667085] mt-1">Manage your professional profile and availability</p>
            </div>
            <div className="bg-white rounded-xl border border-[#E5EAF0] p-8 max-w-3xl">
              <form onSubmit={handleProfileUpdate} className="space-y-5">
                <div className="flex items-center gap-6 p-4 bg-[#F5F7FA] rounded-lg border border-[#E5EAF0]">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-[#1B2A4A] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                    {profileForm.photo ? <img src={profileForm.photo} alt="Profile" className="w-full h-full object-cover" /> : <span>{user.firstName[0]}{user.lastName[0]}</span>}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#1B2A4A] mb-2">Profile Photo</p>
                    <label className="inline-block bg-[#1B2A4A] text-white px-4 py-2 rounded-lg hover:bg-[#16213A] cursor-pointer font-medium text-sm transition-colors">
                      Upload Photo
                      <input type="file" accept="image/jpeg,image/png,image/jpg" className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]; if (!file) return;
                          if (file.size > 5 * 1024 * 1024) { alert("File too large. Maximum size is 5MB."); return; }
                          try { const formData = new FormData(); formData.append("photo", file); const result = await api.uploadPhoto(formData); setProfileForm({ ...profileForm, photo: result.photo }); await refreshUser(); alert("Photo uploaded successfully!"); }
                          catch (err) { alert("Failed to upload photo"); }
                        }} />
                    </label>
                    <p className="text-xs text-[#94A3B8] mt-1">JPG or PNG. Max 5MB.</p>
                  </div>
                </div>
                <div><label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Other Names</label><input type="text" value={profileForm.otherNames || ""} onChange={(e) => setProfileForm({ ...profileForm, otherNames: e.target.value })} className="w-full px-4 py-3 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm" placeholder="e.g., Maiden name, alias" /></div>
                <div><label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Phone Number</label><input type="tel" value={profileForm.phone || ""} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="w-full px-4 py-3 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm" placeholder="e.g., +234 800 000 0000" /></div>
                <div className="grid grid-cols-2 gap-5">
                  <div><label className="block text-sm font-semibold text-[#1B2A4A] mb-2">SCN Number *</label><input type="text" value={profileForm.barNumber || ""} onChange={(e) => setProfileForm({ ...profileForm, barNumber: e.target.value })} required className="w-full px-4 py-3 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm" placeholder="Enter SCN number" /></div>
                  <div><label className="block text-sm font-semibold text-[#1B2A4A] mb-2">State of Call *</label><input type="text" value={profileForm.stateOfCall || ""} onChange={(e) => setProfileForm({ ...profileForm, stateOfCall: e.target.value })} required className="w-full px-4 py-3 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm" placeholder="Enter state of call" /></div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div><label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Year of Call *</label><input type="number" value={profileForm.yearOfCall || ""} onChange={(e) => setProfileForm({ ...profileForm, yearOfCall: parseInt(e.target.value) })} required className="w-full px-4 py-3 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm" placeholder="e.g., 2020" /></div>
                  <div><label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Consultation Fee (₦)</label><input type="number" value={profileForm.consultationFee || ""} onChange={(e) => setProfileForm({ ...profileForm, consultationFee: parseFloat(e.target.value) })} className="w-full px-4 py-3 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm" placeholder="e.g., 150" step="0.01" /></div>
                </div>
                <div><label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Years of Experience</label><input type="number" value={profileForm.yearsOfExperience || ""} onChange={(e) => setProfileForm({ ...profileForm, yearsOfExperience: parseInt(e.target.value) })} className="w-full px-4 py-3 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm" placeholder="e.g., 5" min="0" /></div>
                <div><label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Practice Areas <span className="text-[#94A3B8] font-normal">(comma separated)</span></label><input type="text" value={profileForm.practiceAreas?.join(", ") || ""} onChange={(e) => setProfileForm({ ...profileForm, practiceAreas: e.target.value.split(",").map((s: string) => s.trim()) })} className="w-full px-4 py-3 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm" placeholder="e.g., Family Law, Corporate Law, Criminal Law" /></div>
                <div><label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Office Address</label><input type="text" value={profileForm.officeAddress || ""} onChange={(e) => setProfileForm({ ...profileForm, officeAddress: e.target.value })} className="w-full px-4 py-3 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm" placeholder="Enter office address" /></div>
                <div className="grid grid-cols-2 gap-5">
                  <div><label className="block text-sm font-semibold text-[#1B2A4A] mb-2">City *</label><input type="text" value={profileForm.city || ""} onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })} required className="w-full px-4 py-3 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm" placeholder="Enter city" /></div>
                  <div><label className="block text-sm font-semibold text-[#1B2A4A] mb-2">State *</label><input type="text" value={profileForm.state || ""} onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })} required className="w-full px-4 py-3 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm" placeholder="Enter state" /></div>
                </div>
                <div><label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Bio</label><textarea value={profileForm.bio || ""} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} rows={4} className="w-full px-4 py-3 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm resize-none" placeholder="Tell clients about yourself and your expertise..." /></div>
                <div><label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Languages <span className="text-[#94A3B8] font-normal">(comma separated)</span></label><input type="text" value={profileForm.languages?.join(", ") || ""} onChange={(e) => setProfileForm({ ...profileForm, languages: e.target.value.split(",").map((s: string) => s.trim()) })} className="w-full px-4 py-3 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm" placeholder="e.g., English, French, Yoruba" /></div>
                <div><label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Available Days</label><div className="flex flex-wrap gap-2">{["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map((day) => { const isSelected = profileForm.availableDays?.includes(day); return (<button key={day} type="button" className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isSelected ? "bg-[#1B2A4A] text-white" : "bg-[#EEF2F7] text-[#667085] hover:bg-[#E5EAF0]"}`} onClick={() => { const days = profileForm.availableDays || []; const updated = isSelected ? days.filter((d: string) => d !== day) : [...days, day]; setProfileForm({ ...profileForm, availableDays: updated }); }}>{day.substring(0, 3)}</button>); })}</div></div>
                <div><label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Available From</label><select value={profileForm.availableFrom || ""} onChange={(e) => setProfileForm({ ...profileForm, availableFrom: e.target.value })} className="w-full px-4 py-3 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] bg-white text-sm"><option value="">Select start time</option>{["8:00 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM"].map(t => (<option key={t} value={t}>{t}</option>))}</select></div>
                <div><label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Available To</label><select value={profileForm.availableTo || ""} onChange={(e) => setProfileForm({ ...profileForm, availableTo: e.target.value })} className="w-full px-4 py-3 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] bg-white text-sm"><option value="">Select end time</option>{["12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM","6:00 PM","7:00 PM"].map(t => (<option key={t} value={t}>{t}</option>))}</select></div>
                <div className="flex items-center gap-3 p-4 bg-[#F5F7FA] rounded-lg border border-[#E5EAF0]"><input type="checkbox" id="isAvailable" checked={profileForm.isAvailable ?? true} onChange={(e) => setProfileForm({ ...profileForm, isAvailable: e.target.checked })} className="w-5 h-5 text-[#00A6A6] border-[#E5EAF0] rounded focus:ring-2 focus:ring-[#00A6A6]/20" /><label htmlFor="isAvailable" className="text-sm font-semibold text-[#1B2A4A] cursor-pointer">Available for new clients</label></div>
                <button type="submit" className="w-full bg-[#1B2A4A] text-white px-6 py-3 rounded-lg hover:bg-[#16213A] font-semibold text-sm transition-colors">Save Changes</button>
              </form>
            </div>
          </div>
        )}

        {/* Payout Section */}
        {activeSection === "payout" && (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[#1B2A4A] tracking-tight">Payout Settings</h1>
              <p className="text-[#667085] mt-1">Add your bank account details to receive payouts for consultations</p>
            </div>
            <div className="bg-white rounded-xl border border-[#E5EAF0] p-8 max-w-3xl">
              <form onSubmit={handleProfileUpdate} className="space-y-5">
                <div><label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Account Name</label><input type="text" value={profileForm.accountName || ""} onChange={(e) => setProfileForm({ ...profileForm, accountName: e.target.value })} className="w-full px-4 py-3 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm" placeholder="e.g., John Doe" /></div>
                <div><label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Account Number</label><input type="text" value={profileForm.accountNumber || ""} onChange={(e) => setProfileForm({ ...profileForm, accountNumber: e.target.value })} className="w-full px-4 py-3 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm" placeholder="e.g., 0123456789" maxLength={10} /></div>
                <div><label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Bank Name</label><input type="text" value={profileForm.bankName || ""} onChange={(e) => setProfileForm({ ...profileForm, bankName: e.target.value })} className="w-full px-4 py-3 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm" placeholder="e.g., GTBank, Access Bank, First Bank" /></div>
                <button type="submit" className="w-full bg-[#1B2A4A] text-white px-6 py-3 rounded-lg hover:bg-[#16213A] font-semibold text-sm transition-colors">Save Payout Details</button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}