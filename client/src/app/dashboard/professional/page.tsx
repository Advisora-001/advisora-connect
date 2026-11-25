"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useProfessionalAppointments, useLeads, useWallet, useNotifications, useProfessional, useUpdateProfessionalProfile, useUploadPhoto, useAcceptOnboardingAgreement, useSubmitDeclaration, useSubmitProfessionalVerification, useRequestPayout } from "@/hooks";
import { AppSidebar, sidebarConfigs } from "@/components/AppSidebar";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, Modal, Badge, Select, Skeleton } from "@/components/ui";
import { showToast } from "@/components/ui/Toaster";
import { PLATFORM_FEE_AMOUNT } from "@/lib/api";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIME_OPTIONS_FROM = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM"];
const TIME_OPTIONS_TO = ["12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM"];

export default function ProfessionalDashboard() {
  const { user, profile, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<
    "dashboard" | "enquiries" | "appointments" | "profile" | "payout" | "wallet" | "fractional"
  >("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [meetingLinkInput, setMeetingLinkInput] = useState("");
  const [showMeetingInput, setShowMeetingInput] = useState<string | null>(null);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [profileForm, setProfileForm] = useState<any>({});
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [enquiryMsg, setEnquiryMsg] = useState("");

  // Data fetching hooks
  const { data: professional, isLoading: profLoading, refetch: refetchProfessional } = useProfessional(profile?._id, !!profile?._id);
  const { data: leadsData, isLoading: leadsLoading, refetch: refetchLeads } = useLeads();
  const { data: appointmentsData, isLoading: apptLoading, refetch: refetchAppointments } = useProfessionalAppointments();
  const { data: walletData, isLoading: walletLoading, refetch: refetchWallet } = useWallet();
  const { data: notificationsData, refetch: refetchNotifications } = useNotifications();

  // Mutations
  const updateProfileMutation = useUpdateProfessionalProfile();
  const uploadPhotoMutation = useUploadPhoto();
  const acceptOnboardingMutation = useAcceptOnboardingAgreement();
  const submitDeclarationMutation = useSubmitDeclaration();
  const submitVerificationMutation = useSubmitProfessionalVerification();
  const requestPayoutMutation = useRequestPayout();

  const leads = leadsData?.leads || [];
  const appointments = appointmentsData?.appointments || [];
  const wallet = walletData;
  const notifications = notificationsData?.notifications || [];
  const unreadCount = notificationsData?.unreadCount || 0;

  useEffect(() => {
    if (authLoading) return;
    if (!user || (user.role !== "lawyer" && user.role !== "professional")) {
      router.push("/login");
      return;
    }
    if (profile) setProfileForm(profile);
  }, [user, profile, authLoading, router]);

  // Update profile form when professional data loads
  useEffect(() => {
    if (professional && Object.keys(profileForm).length === 0) {
      setProfileForm(professional);
    }
  }, [professional]);

  const pendingEnquiries = leads.filter((l: any) => l.status === "pending");
  const acceptedEnquiries = leads.filter((l: any) => l.status === "accepted");
  const bookedEnquiries = leads.filter((l: any) => l.status === "booked");
  const unpaidLeads = leads.filter((l: any) => l.paymentStatus === "unpaid");

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading("profile");
    try {
      const dataToSave = { ...profileForm };
      if (dataToSave.availableFrom && dataToSave.availableTo) {
        dataToSave.availableHours = `${dataToSave.availableFrom} - ${dataToSave.availableTo}`;
      }
      await updateProfileMutation.mutateAsync(dataToSave);
      await refreshUser();
      showToast.success("Profile updated successfully!");
    } catch (error: any) {
      showToast.error(error.message || "Failed to update profile");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast.error("File too large. Maximum size is 5MB.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("photo", file);
      await uploadPhotoMutation.mutateAsync(formData);
      await refreshUser();
      showToast.success("Photo uploaded successfully!");
    } catch (error) {
      showToast.error("Failed to upload photo");
    }
  };

  const handleRespond = async (leadId: string, status: "accepted" | "declined") => {
    setActionLoading(leadId);
    try {
      await api.respondToLead(leadId, status);
      await refetchLeads();
      showToast.success(`Enquiry ${status}!`);
    } catch (error: any) {
      showToast.error(error.message || "Failed to respond");
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateMeeting = async (appointmentId: string) => {
    setActionLoading(appointmentId);
    try {
      const result = await api.generateMeetingLink(appointmentId);
      if (result.meetingLink) {
        showToast.success("Google Meet link generated successfully!");
      } else {
        showToast.info(result.message || "Auto-generation unavailable. Please add a link manually.");
      }
      await refetchAppointments();
    } catch (err: any) {
      showToast.error(err.message || "Failed to generate meeting link");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetMeetingLink = async (appointmentId: string) => {
    if (!meetingLinkInput) return;
    setActionLoading(appointmentId);
    try {
      await api.setMeetingLink(appointmentId, meetingLinkInput);
      setMeetingLinkInput("");
      setShowMeetingInput(null);
      await refetchAppointments();
      showToast.success("Meeting link saved!");
    } catch (err: any) {
      showToast.error(err.message || "Failed to set meeting link");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteAppointment = async (appointmentId: string) => {
    if (!confirm("Mark this consultation as completed?")) return;
    setActionLoading(appointmentId);
    try {
      await api.completeAppointment(appointmentId);
      await refetchAppointments();
      showToast.success("Appointment marked complete!");
    } catch (err: any) {
      showToast.error(err.message || "Failed to complete appointment");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestPayout = async () => {
    const amount = Number(payoutAmount);
    if (!amount || amount <= 0) {
      showToast.error("Please enter a valid amount");
      return;
    }
    if (!confirm(`Request a payout of ₦${amount.toLocaleString()}?`)) return;
    setActionLoading("payout");
    try {
      await requestPayoutMutation.mutateAsync(amount);
      setPayoutAmount("");
      await refetchWallet();
      showToast.success("Payout request submitted!");
    } catch (err: any) {
      showToast.error(err.message || "Failed to request payout");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptOnboarding = async () => {
    try {
      await acceptOnboardingMutation.mutateAsync();
      await refreshUser();
      showToast.success("Onboarding agreement accepted!");
    } catch (error: any) {
      showToast.error(error.message || "Failed to accept agreement");
    }
  };

  const handleSubmitDeclaration = async () => {
    try {
      await submitDeclarationMutation.mutateAsync({
        informationAccurate: true,
        qualifiedToPractise: true,
        noDisciplinaryAction: true,
      });
      await refreshUser();
      showToast.success("Declaration submitted!");
    } catch (error: any) {
      showToast.error(error.message || "Failed to submit declaration");
    }
  };

  const handleSubmitVerification = async () => {
    if (!professional?.category) {
      showToast.error("Please complete your profile first");
      return;
    }
    try {
      const categoryId = typeof professional.category === 'object' ? professional.category._id : professional.category;
      await submitVerificationMutation.mutateAsync({
        category: categoryId,
        specialization: professional.specialization,
        categoryData: professional.categoryData,
        declaration: {
          informationAccurate: true,
          qualifiedToPractise: true,
          noDisciplinaryAction: true,
        },
      });
      await refetchProfessional();
      showToast.success("Verification submitted for review!");
    } catch (error: any) {
      showToast.error(error.message || "Failed to submit verification");
    }
  };

  if (!user) return null;
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-2 border-[#1B2A4A] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const sidebarConfig = sidebarConfigs.professional(activeSection, setActiveSection, {
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
  });

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <AppSidebar
        {...sidebarConfig}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto bg-[#F5F7FA]">
        {/* Mobile hamburger */}
        <button className="md:hidden mb-4 p-2 text-[#667085] hover:text-[#1B2A4A] rounded-lg hover:bg-[#EEF2F7]" onClick={() => setSidebarOpen(true)}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        {/* Dashboard */}
        {activeSection === "dashboard" && (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[#1B2A4A] tracking-tight">Dashboard</h1>
              <p className="text-[#667085] mt-1">Welcome back, {user.firstName} {user.lastName}</p>
            </div>
            {(profLoading || leadsLoading || apptLoading || walletLoading) ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} variant="rectangular" className="rounded-xl bg-white border border-[#E5EAF0] p-6" style={{ minHeight: 100 }} />
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                <Card>
                  <p className="text-sm font-medium text-[#667085] uppercase tracking-wide">Total Enquiries</p>
                  <p className="text-3xl font-bold text-[#1B2A4A] mt-2">{leads.length}</p>
                </Card>
                <Card>
                  <p className="text-sm font-medium text-[#667085] uppercase tracking-wide">Unpaid Leads</p>
                  <p className="text-3xl font-bold text-[#F59E0B] mt-2">{unpaidLeads.length}</p>
                </Card>
                <Card>
                  <p className="text-sm font-medium text-[#667085] uppercase tracking-wide">Appointments</p>
                  <p className="text-3xl font-bold text-[#5DBB63] mt-2">{appointments.length}</p>
                </Card>
                <Card>
                  <p className="text-sm font-medium text-[#667085] uppercase tracking-wide">Verification</p>
                  <p className={`text-xl font-bold mt-2 capitalize ${professional?.verificationStatus === "verified" ? "text-[#5DBB63]" : "text-[#F59E0B]"}`}>
                    {professional?.verificationStatus || "pending"}
                  </p>
                  {professional?.verificationStatus !== "verified" && (
                    <p className="text-sm text-[#667085] mt-1">Profile pending admin review</p>
                  )}
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Enquiries */}
        {activeSection === "enquiries" && (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[#1B2A4A] tracking-tight">Client Enquiries</h1>
              <p className="text-[#667085] mt-1">Manage incoming client enquiries and booking requests</p>
            </div>
            <Card>
              {leadsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} variant="rectangular" className="rounded-xl bg-white border border-[#E5EAF0] p-5" style={{ minHeight: 120 }} />
                  ))}
                </div>
              ) : leads.length === 0 ? (
                <div className="p-12 text-center text-[#667085]">No enquiries yet.</div>
              ) : (
                <div className="divide-y divide-[#E5EAF0]">
                  {leads.map((lead: any) => (
                    <div key={lead._id} className="p-5 hover:bg-[#F5F7FA] transition-colors">
                      <div className="mb-3">
                        <p className="font-semibold text-[#1B2A4A]">{lead.enquiryMessage?.substring(0, 100)}{lead.enquiryMessage?.length > 100 ? "..." : ""}</p>
                        <p className="text-sm text-[#667085] mt-1">{new Date(lead.createdAt).toLocaleDateString()} • {lead.clientName}</p>
                        {lead.bookingContext && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge variant="info" size="sm">{lead.bookingContext.service?.name}</Badge>
                            <Badge variant="default" size="sm">{lead.bookingContext.date}</Badge>
                            <Badge variant="success" size="sm">{lead.bookingContext.timeSlot}</Badge>
                            <Badge variant="outline" size="sm" className="capitalize">{lead.bookingContext.consultationType}</Badge>
                          </div>
                        )}
                      </div>
                      {lead.status === "pending" && (
                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleRespond(lead._id, "accepted")}
                            disabled={lead.responding || actionLoading === lead._id}
                            variant="success"
                            size="sm"
                          >
                            {actionLoading === lead._id ? "..." : "Accept"}
                          </Button>
                          <Button
                            onClick={() => handleRespond(lead._id, "declined")}
                            disabled={lead.responding || actionLoading === lead._id}
                            variant="danger"
                            size="sm"
                          >
                            {actionLoading === lead._id ? "..." : "Decline"}
                          </Button>
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
                        <Badge variant="danger" size="sm">Declined</Badge>
                      )}
                      {lead.status === "booked" && (
                        <Badge variant="info" size="sm">Booked</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Appointments */}
        {activeSection === "appointments" && (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[#1B2A4A] tracking-tight">Appointments</h1>
              <p className="text-[#667085] mt-1">Manage your consultations and meeting links</p>
            </div>
            <Card>
              {apptLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} variant="rectangular" className="rounded-xl bg-white border border-[#E5EAF0] p-5" style={{ minHeight: 140 }} />
                  ))}
                </div>
              ) : appointments.length === 0 ? (
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
                            <Badge variant={appt.paymentStatus === 'paid' ? 'success' : 'warning'} size="sm">{appt.paymentStatus}</Badge>
                            <Badge
                              variant={
                                appt.status === 'confirmed' ? 'info' :
                                appt.status === 'completed' ? 'success' :
                                appt.status === 'cancelled' ? 'danger' : 'outline'
                              }
                              size="sm"
                            >
                              {appt.status}
                            </Badge>
                            {appt.completionSource && <span className="text-xs text-[#94A3B8]">via {appt.completionSource}</span>}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          {appt.paymentStatus === 'paid' && appt.status !== 'cancelled' && appt.status !== 'completed' && (
                            <>
                              {appt.meetingLink ? (
                                <>
                                  <a href={appt.meetingLink} target="_blank" rel="noopener noreferrer" className="bg-[#5DBB63] text-white px-4 py-2 rounded-lg hover:bg-[#4CA652] font-semibold text-sm text-center transition-colors">
                                    Join Consultation
                                  </a>
                                  <Button onClick={() => handleGenerateMeeting(appt._id)} disabled={actionLoading === appt._id} variant="ghost" size="sm">
                                    Regenerate Link
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button onClick={() => handleGenerateMeeting(appt._id)} disabled={actionLoading === appt._id} size="sm">
                                    {actionLoading === appt._id ? 'Generating...' : 'Generate Meet Link'}
                                  </Button>
                                  {showMeetingInput === appt._id ? (
                                    <div className="flex gap-2 mt-1">
                                      <Input
                                        type="text"
                                        value={meetingLinkInput}
                                        onChange={(e) => setMeetingLinkInput(e.target.value)}
                                        placeholder="Paste Meet/Zoom link"
                                        className="w-48"
                                      />
                                      <Button onClick={() => handleSetMeetingLink(appt._id)} disabled={actionLoading === appt._id} size="sm">
                                        Save
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button onClick={() => { setShowMeetingInput(appt._id); setMeetingLinkInput(''); }} variant="ghost" size="sm">
                                      Add Link Manually
                                    </Button>
                                  )}
                                </>
                              )}
                              <Button onClick={() => handleCompleteAppointment(appt._id)} disabled={actionLoading === appt._id} variant="secondary" size="sm">
                                {actionLoading === appt._id ? '...' : 'Mark Complete'}
                              </Button>
                            </>
                          )}
                          {appt.status === 'completed' && appt.meetingLink && (
                            <a href={appt.meetingLink} target="_blank" rel="noopener noreferrer" className="bg-[#EEF2F7] text-[#667085] px-4 py-2 rounded-lg font-semibold text-sm">View Meeting Link</a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Profile */}
        {activeSection === "profile" && (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[#1B2A4A] tracking-tight">Edit Profile</h1>
              <p className="text-[#667085] mt-1">Manage your professional profile and availability</p>
            </div>
            <Card className="max-w-3xl">
              <form onSubmit={handleProfileUpdate} className="space-y-5">
                {/* Profile Photo */}
                <div className="flex items-center gap-6 p-4 bg-[#F5F7FA] rounded-lg border border-[#E5EAF0]">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-[#1B2A4A] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                    {profileForm.photo ? (
                      <img src={profileForm.photo} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span>{user.firstName[0]}{user.lastName[0]}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#1B2A4A] mb-2">Profile Photo</p>
                    <label className="inline-block bg-[#1B2A4A] text-white px-4 py-2 rounded-lg hover:bg-[#16213A] cursor-pointer font-medium text-sm transition-colors">
                      Upload Photo
                      <input type="file" accept="image/jpeg,image/png,image/jpg" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                    <p className="text-xs text-[#94A3B8] mt-1">JPG or PNG. Max 5MB.</p>
                  </div>
                </div>

                <Input label="Other Names" value={profileForm.otherNames || ""} onChange={(e) => setProfileForm({ ...profileForm, otherNames: e.target.value })} placeholder="e.g., Maiden name, alias" />
                <Input label="Phone Number" type="tel" value={profileForm.phone || ""} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="e.g., +234 800 000 0000" />

                <div className="grid grid-cols-2 gap-5">
                  <Input label="SCN / License Number *" value={profileForm.barNumber || profileForm.licenseNumber || profileForm.taxIdNumber || ""} onChange={(e) => setProfileForm({ ...profileForm, [professional?.category?.key === 'tax' ? 'taxIdNumber' : professional?.category?.key === 'accounting' ? 'licenseNumber' : 'barNumber']: e.target.value })} required placeholder={professional?.category?.key === 'tax' ? 'Enter tax ID number' : professional?.category?.key === 'accounting' ? 'Enter license number' : 'Enter SCN number'} />
                  <Input label="State / Certifying Body *" value={profileForm.stateOfCall || profileForm.certifyingBody || ""} onChange={(e) => setProfileForm({ ...profileForm, [professional?.category?.key === 'tax' ? 'certifyingBody' : 'stateOfCall']: e.target.value })} required placeholder={professional?.category?.key === 'tax' ? 'Enter certifying body' : 'Enter state'} />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <Input label="Year of Call / Experience" type="number" value={profileForm.yearOfCall || profileForm.yearsOfExperience || ""} onChange={(e) => setProfileForm({ ...profileForm, yearOfCall: parseInt(e.target.value), yearsOfExperience: parseInt(e.target.value) })} required placeholder="e.g., 2020" />
                  <Input label="Consultation Fee (₦)" type="number" value={profileForm.consultationFee || ""} onChange={(e) => setProfileForm({ ...profileForm, consultationFee: parseFloat(e.target.value) })} placeholder="e.g., 15000" step="0.01" />
                </div>

                <Input label="Practice Areas / Specializations" value={(profileForm.practiceAreas || profileForm.specializations || [])?.join(", ") || ""} onChange={(e) => setProfileForm({ ...profileForm, practiceAreas: e.target.value.split(",").map((s: string) => s.trim()), specializations: e.target.value.split(",").map((s: string) => s.trim()) })} placeholder="e.g., Corporate Law, Tax Preparation, Audit" />

                <Input label="Office Address" value={profileForm.officeAddress || ""} onChange={(e) => setProfileForm({ ...profileForm, officeAddress: e.target.value })} placeholder="Enter office address" />

                <div className="grid grid-cols-2 gap-5">
                  <Input label="City *" value={profileForm.city || ""} onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })} required placeholder="Enter city" />
                  <Input label="State *" value={profileForm.state || ""} onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })} required placeholder="Enter state" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Bio</label>
                  <textarea value={profileForm.bio || ""} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} rows={4} className="w-full px-4 py-3 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm resize-none" placeholder="Tell clients about yourself and your expertise..." />
                </div>

                <Input label="Languages" value={profileForm.languages?.join(", ") || ""} onChange={(e) => setProfileForm({ ...profileForm, languages: e.target.value.split(",").map((s: string) => s.trim()) })} placeholder="e.g., English, French, Yoruba" />

                <div>
                  <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Available Days</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((day) => {
                      const isSelected = profileForm.availableDays?.includes(day);
                      return (
                        <button key={day} type="button" className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isSelected ? "bg-[#1B2A4A] text-white" : "bg-[#EEF2F7] text-[#667085] hover:bg-[#E5EAF0]"}`} onClick={() => { const days = profileForm.availableDays || []; const updated = isSelected ? days.filter((d: string) => d !== day) : [...days, day]; setProfileForm({ ...profileForm, availableDays: updated }); }}>
                          {day.substring(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Available From</label>
                    <Select value={profileForm.availableFrom || ""} onChange={(e) => setProfileForm({ ...profileForm, availableFrom: e.target.value })} options={TIME_OPTIONS_FROM.map(t => ({ value: t, label: t }))} placeholder="Select start time" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Available To</label>
                    <Select value={profileForm.availableTo || ""} onChange={(e) => setProfileForm({ ...profileForm, availableTo: e.target.value })} options={TIME_OPTIONS_TO.map(t => ({ value: t, label: t }))} placeholder="Select end time" />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-[#F5F7FA] rounded-lg border border-[#E5EAF0]">
                  <input type="checkbox" id="isAvailable" checked={profileForm.isAvailable ?? true} onChange={(e) => setProfileForm({ ...profileForm, isAvailable: e.target.checked })} className="w-5 h-5 text-[#00A6A6] border-[#E5EAF0] rounded focus:ring-2 focus:ring-[#00A6A6]/20" />
                  <label htmlFor="isAvailable" className="text-sm font-semibold text-[#1B2A4A] cursor-pointer">Available for new clients</label>
                </div>

                {/* Fractional GC Configuration */}
                {professional?.category?.key === 'legal' && (
                  <div className="p-4 bg-[#F0FDFA] border border-[#00A6A6]/20 rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-[#00A6A6]/10 text-[#00A6A6] rounded-lg flex items-center justify-center text-xl font-bold">
                        ⚖️
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#1B2A4A]">Fractional General Counsel Services</h4>
                        <p className="text-sm text-[#667085]">Offer part-time ongoing legal leadership to businesses on a monthly retainer</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <input type="checkbox" id="fractionalGCOffered" checked={profileForm.fractionalGC?.isAvailable ?? false} onChange={(e) => setProfileForm({ ...profileForm, fractionalGC: { ...profileForm.fractionalGC, isAvailable: e.target.checked } })} className="w-5 h-5 text-[#00A6A6] border-[#E5EAF0] rounded focus:ring-2 focus:ring-[#00A6A6]/20" />
                      <label htmlFor="fractionalGCOffered" className="text-sm font-semibold text-[#1B2A4A] cursor-pointer">I offer Fractional GC services</label>
                    </div>
                    {profileForm.fractionalGC?.isAvailable && (
                      <div className="space-y-5">
                        <div className="grid md:grid-cols-2 gap-5">
                          <Input label="Monthly Retainer Min (₦)" type="number" value={profileForm.fractionalGC?.monthlyRetainerMin || ""} onChange={(e) => setProfileForm({ ...profileForm, fractionalGC: { ...profileForm.fractionalGC, monthlyRetainerMin: parseInt(e.target.value) || 0 } })} placeholder="e.g., 500000" step="50000" min="0" />
                          <Input label="Monthly Retainer Max (₦)" type="number" value={profileForm.fractionalGC?.monthlyRetainerMax || ""} onChange={(e) => setProfileForm({ ...profileForm, fractionalGC: { ...profileForm.fractionalGC, monthlyRetainerMax: parseInt(e.target.value) || 0 } })} placeholder="e.g., 1500000" step="50000" min="0" />
                        </div>
                        <div className="grid md:grid-cols-2 gap-5">
                          <Input label="Hours per Month" type="number" value={profileForm.fractionalGC?.hoursPerMonth || ""} onChange={(e) => setProfileForm({ ...profileForm, fractionalGC: { ...profileForm.fractionalGC, hoursPerMonth: parseInt(e.target.value) || 0 } })} placeholder="e.g., 20" step="5" min="1" max="160" />
                          <Input label="Min Engagement (months)" type="number" value={profileForm.fractionalGC?.minimumEngagementMonths || ""} onChange={(e) => setProfileForm({ ...profileForm, fractionalGC: { ...profileForm.fractionalGC, minimumEngagementMonths: parseInt(e.target.value) || 3 } })} placeholder="e.g., 3" step="1" min="1" max="24" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Industries</label>
                          <div className="flex flex-wrap gap-2">
                            {['SaaS', 'FinTech', 'Healthcare', 'E-commerce', 'Manufacturing', 'Real Estate', 'Education', 'Non-profit', 'Other'].map((industry) => {
                              const isSelected = profileForm.fractionalGC?.industries?.includes(industry);
                              return (
                                <button key={industry} type="button" className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isSelected ? "bg-[#00A6A6] text-white" : "bg-[#EEF2F7] text-[#667085] hover:bg-[#E5EAF0]"}`} onClick={() => { const industries = profileForm.fractionalGC?.industries || []; const updated = isSelected ? industries.filter((i: string) => i !== industry) : [...industries, industry]; setProfileForm({ ...profileForm, fractionalGC: { ...profileForm.fractionalGC, industries: updated } }); }}>
                                  {industry}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Company Stages</label>
                          <div className="flex flex-wrap gap-2">
                            {['Pre-seed/Seed', 'Series A', 'Series B+', 'Growth', 'Enterprise', 'Mature'].map((stage) => {
                              const isSelected = profileForm.fractionalGC?.companyStages?.includes(stage);
                              return (
                                <button key={stage} type="button" className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isSelected ? "bg-[#00A6A6] text-white" : "bg-[#EEF2F7] text-[#667085] hover:bg-[#E5EAF0]"}`} onClick={() => { const stages = profileForm.fractionalGC?.companyStages || []; const updated = isSelected ? stages.filter((s: string) => s !== stage) : [...stages, stage]; setProfileForm({ ...profileForm, fractionalGC: { ...profileForm.fractionalGC, companyStages: updated } }); }}>
                                  {stage}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Engagement Types</label>
                          <div className="flex flex-wrap gap-2">
                            {['Monthly Retainer', 'Project-based', 'Interim GC', 'Board Advisor'].map((type) => {
                              const isSelected = profileForm.fractionalGC?.engagementTypes?.includes(type);
                              return (
                                <button key={type} type="button" className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isSelected ? "bg-[#00A6A6] text-white" : "bg-[#EEF2F7] text-[#667085] hover:bg-[#E5EAF0]"}`} onClick={() => { const types = profileForm.fractionalGC?.engagementTypes || []; const updated = isSelected ? types.filter((t: string) => t !== type) : [...types, type]; setProfileForm({ ...profileForm, fractionalGC: { ...profileForm.fractionalGC, engagementTypes: updated } }); }}>
                                  {type}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Scope of Work</label>
                          <div className="flex flex-wrap gap-2">
                            {['Contract Review & Negotiation', 'Compliance & Regulatory', 'Corporate Governance', 'Employment Law', 'IP Protection', 'Fundraising Support', 'M&A Support', 'Risk Management', 'Policy Development', 'Board Meeting Prep'].map((scope) => {
                              const isSelected = profileForm.fractionalGC?.scopeOfWork?.includes(scope);
                              return (
                                <button key={scope} type="button" className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isSelected ? "bg-[#00A6A6] text-white" : "bg-[#EEF2F7] text-[#667085] hover:bg-[#E5EAF0]"}`} onClick={() => { const scopes = profileForm.fractionalGC?.scopeOfWork || []; const updated = isSelected ? scopes.filter((s: string) => s !== scope) : [...scopes, scope]; setProfileForm({ ...profileForm, fractionalGC: { ...profileForm.fractionalGC, scopeOfWork: updated } }); }}>
                                  {scope}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <input type="checkbox" id="autoRenew" checked={profileForm.fractionalGC?.autoRenew ?? true} onChange={(e) => setProfileForm({ ...profileForm, fractionalGC: { ...profileForm.fractionalGC, autoRenew: e.target.checked } })} className="w-5 h-5 text-[#00A6A6] border-[#E5EAF0] rounded focus:ring-2 focus:ring-[#00A6A6]/20" />
                          <label htmlFor="autoRenew" className="text-sm font-semibold text-[#1B2A4A] cursor-pointer">Auto-renew engagement</label>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Verification Actions */}
                {professional?.verificationStatus === "pending" && (
                  <div className="p-4 bg-[#FFFBEB] border border-[#F59E0B]/20 rounded-lg">
                    <p className="font-semibold text-[#92400E] mb-2">Verification Pending</p>
                    <p className="text-sm text-[#92400E] mb-3">Your verification is under review. You can resubmit if needed.</p>
                    <Button type="button" onClick={handleSubmitVerification} disabled={submitVerificationMutation.isPending} variant="secondary" size="sm">
                      {submitVerificationMutation.isPending ? "Submitting..." : "Resubmit Verification"}
                    </Button>
                  </div>
                )}

                {professional?.verificationStatus !== "verified" && professional?.onboardingAgreementAccepted !== true && (
                  <div className="p-4 bg-[#EFF6FF] border border-[#00A6A6]/20 rounded-lg">
                    <p className="font-semibold text-[#1E40AF] mb-2">Onboarding Agreement Required</p>
                    <p className="text-sm text-[#1E40AF] mb-3">Please accept the Professional Onboarding Agreement to proceed.</p>
                    <Button type="button" onClick={handleAcceptOnboarding} disabled={acceptOnboardingMutation.isPending} variant="secondary" size="sm">
                      {acceptOnboardingMutation.isPending ? "Accepting..." : "Accept Agreement"}
                    </Button>
                  </div>
                )}

                {professional?.verificationStatus !== "verified" && professional?.onboardingAgreementAccepted === true && professional?.declaration?.informationAccurate !== true && (
                  <div className="p-4 bg-[#EFF6FF] border border-[#00A6A6]/20 rounded-lg">
                    <p className="font-semibold text-[#1E40AF] mb-2">Professional Declaration Required</p>
                    <p className="text-sm text-[#1E40AF] mb-3">Please confirm your professional declaration.</p>
                    <Button type="button" onClick={handleSubmitDeclaration} disabled={submitDeclarationMutation.isPending} variant="secondary" size="sm">
                      {submitDeclarationMutation.isPending ? "Submitting..." : "Submit Declaration"}
                    </Button>
                  </div>
                )}

                <Button type="submit" disabled={actionLoading === "profile" || updateProfileMutation.isPending} className="w-full" size="lg">
                  {actionLoading === "profile" || updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </Card>
          </div>
        )}

        {/* Payout */}
        {activeSection === "payout" && (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[#1B2A4A] tracking-tight">Payout Settings</h1>
              <p className="text-[#667085] mt-1">Add your bank account details to receive payouts for consultations</p>
            </div>
            <Card className="max-w-3xl">
              <form onSubmit={handleProfileUpdate} className="space-y-5">
                <Input label="Account Name" value={profileForm.accountName || ""} onChange={(e) => setProfileForm({ ...profileForm, accountName: e.target.value })} placeholder="e.g., John Doe" />
                <Input label="Account Number" value={profileForm.accountNumber || ""} onChange={(e) => setProfileForm({ ...profileForm, accountNumber: e.target.value })} placeholder="e.g., 0123456789" maxLength={10} />
                <Input label="Bank Name" value={profileForm.bankName || ""} onChange={(e) => setProfileForm({ ...profileForm, bankName: e.target.value })} placeholder="e.g., GTBank, Access Bank, First Bank" />
                <Button type="submit" disabled={actionLoading === "payout"} className="w-full" size="lg">
                  Save Payout Details
                </Button>
              </form>
            </Card>
          </div>
        )}

        {/* Wallet */}
        {activeSection === "wallet" && (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[#1B2A4A] tracking-tight">Wallet</h1>
              <p className="text-[#667085] mt-1">Track your earnings and request payouts</p>
            </div>
            {walletLoading ? (
              <div className="grid md:grid-cols-3 gap-5 mb-6">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} variant="rectangular" className="rounded-xl bg-white border border-[#E5EAF0] p-6" style={{ minHeight: 100 }} />
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-5 mb-6">
                <Card>
                  <p className="text-sm font-medium text-[#667085] uppercase tracking-wide">Balance</p>
                  <p className="text-3xl font-bold text-[#1B2A4A] mt-2">₦{wallet?.balance?.toLocaleString() || 0}</p>
                </Card>
                <Card>
                  <p className="text-sm font-medium text-[#667085] uppercase tracking-wide">Total Earned</p>
                  <p className="text-3xl font-bold text-[#5DBB63] mt-2">₦{wallet?.totalEarned?.toLocaleString() || 0}</p>
                </Card>
                <Card>
                  <p className="text-sm font-medium text-[#667085] uppercase tracking-wide">Pending</p>
                  <p className="text-3xl font-bold text-[#F59E0B] mt-2">₦{wallet?.pendingBalance?.toLocaleString() || 0}</p>
                </Card>
              </div>
            )}

            {/* Request Payout */}
            <Card className="max-w-lg mb-6">
              <CardHeader>
                <CardTitle>Request Payout</CardTitle>
                <CardDescription>Payouts are processed manually by admin. Ensure your bank details are saved in Payout Settings.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Input type="number" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} placeholder="Amount (₦)" />
                  <Button onClick={handleRequestPayout} disabled={actionLoading === "payout" || requestPayoutMutation.isPending} size="lg">
                    {actionLoading === "payout" || requestPayoutMutation.isPending ? "..." : "Request Payout"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Transaction History */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                {wallet && wallet.transactions && wallet.transactions.length > 0 ? (
                  <div className="divide-y divide-[#E5EAF0]">
                    {[...wallet.transactions].reverse().map((tx: any, i: number) => (
                      <div key={i} className="p-4 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-[#1B2A4A]">{tx.description}</p>
                          <p className="text-xs text-[#94A3B8]">{new Date(tx.createdAt).toLocaleDateString()} • {tx.type}</p>
                        </div>
                        <p className={`text-sm font-semibold ${tx.type === 'credit' ? 'text-[#5DBB63]' : 'text-[#EF4444]'}`}>{tx.type === 'credit' ? '+' : '-'}₦{tx.amount?.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-[#667085]">No transactions yet.</div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Fractional GC */}
        {activeSection === "fractional" && (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[#1B2A4A] tracking-tight">Fractional GC Management</h1>
              <p className="text-[#667085] mt-1">Manage your fractional General Counsel engagements and proposals</p>
            </div>
            <div className="bg-white rounded-xl border border-[#E5EAF0] p-8">
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[#00A6A6]/10 text-[#00A6A6] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  ⚖️
                </div>
                <h3 className="text-lg font-semibold text-[#1B2A4A] mb-2">Fractional GC Dashboard</h3>
                <p className="text-[#667085] mb-6">View and manage your fractional GC requests, proposals, and active engagements.</p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <a href="/dashboard/professional?section=enquiries" className="bg-[#00A6A6] text-white px-6 py-3 rounded-lg hover:bg-[#008F8F] transition-colors font-semibold">
                    View Requests
                  </a>
                  <a href="/fractional/my-proposals" className="border-2 border-[#00A6A6] text-[#00A6A6] px-6 py-3 rounded-lg hover:bg-[#00A6A6] hover:text-white transition-colors font-semibold">
                    My Proposals
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

// Import api for appointment mutations (they don't have hooks yet)
import api from "@/lib/api";