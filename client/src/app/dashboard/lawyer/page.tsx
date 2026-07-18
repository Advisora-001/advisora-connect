"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

export default function LawyerDashboard() {
  const { user, profile, refreshUser } = useAuth();
  const router = useRouter();
  const [leads, setLeads] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "profile" | "leads" | "payout">(
    "overview",
  );
  const [profileForm, setProfileForm] = useState<any>({});

  useEffect(() => {
    if (!user || user.role !== "lawyer") {
      router.push("/login");
      return;
    }
    fetchLeads();
    if (profile) setProfileForm(profile);
  }, [user, profile]);

  async function fetchLeads() {
    try {
      const data = await api.getLeads();
      setLeads(data.leads);
    } catch {}
  }

  const handleRespond = async (
    leadId: string,
    status: "accepted" | "declined",
  ) => {
    setLeads(
      leads.map((l) => (l._id === leadId ? { ...l, responding: true } : l)),
    );
    try {
      await api.respondToLead(leadId, status);
      await fetchLeads();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to respond");
      setLeads(
        leads.map((l) => (l._id === leadId ? { ...l, responding: false } : l)),
      );
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateLawyerProfile(profileForm);
      await refreshUser();
      alert("Profile updated successfully!");
    } catch (error) {
      alert(
        `Failed to update profile: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-accent">Lawyer Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome, {user.firstName} {user.lastName}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b-2 border-primary/30 pb-2">
        {(["overview", "profile", "leads", "payout"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium capitalize transition-all rounded-t-lg ${
              activeTab === tab
                ? "text-accent border-b-4 border-primary bg-white shadow-sm"
                : "text-gray-500 hover:text-accent hover:bg-white/50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-primary hover:shadow-lg transition-shadow">
            <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
              Total Leads
            </p>
            <p className="text-4xl font-bold text-accent mt-3">
              {leads.length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500 hover:shadow-lg transition-shadow">
            <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
              Unpaid Leads
            </p>
            <p className="text-4xl font-bold text-yellow-600 mt-3">
              {leads.filter((l) => l.paymentStatus === "unpaid").length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-accent hover:shadow-lg transition-shadow">
            <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
              Verification
            </p>
            <p
              className={`text-2xl font-bold mt-3 capitalize ${profile?.verificationStatus === "verified" ? "text-green-600" : "text-yellow-600"}`}
            >
              {profile?.verificationStatus || "pending"}
            </p>
            {profile?.verificationStatus !== "verified" && (
              <p className="text-sm text-gray-500 mt-2">
                Profile pending admin review
              </p>
            )}
          </div>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-xl shadow-lg border-2 border-primary/30 p-8 max-w-3xl">
          <h2 className="text-2xl font-bold text-accent mb-8 pb-3 border-b border-primary/20">
            Edit Profile
          </h2>
          <form onSubmit={handleProfileUpdate} className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-accent mb-2">
                  Bar Number *
                </label>
                <input
                  type="text"
                  value={profileForm.barNumber || ""}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      barNumber: e.target.value,
                    })
                  }
                  required
                  className="w-full px-4 py-3 bg-white border-2 border-primary rounded-lg focus:ring-4 focus:ring-primary/30 focus:border-primary-dark focus:outline-none text-accent placeholder-gray-400"
                  placeholder="Enter bar number"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-accent mb-2">
                  State of Call *
                </label>
                <input
                  type="text"
                  value={profileForm.stateOfCall || ""}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      stateOfCall: e.target.value,
                    })
                  }
                  required
                  className="w-full px-4 py-3 bg-white border-2 border-primary rounded-lg focus:ring-4 focus:ring-primary/30 focus:border-primary-dark focus:outline-none text-accent placeholder-gray-400"
                  placeholder="Enter state of call"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-accent mb-2">
                  Year of Call *
                </label>
                <input
                  type="number"
                  value={profileForm.yearOfCall || ""}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      yearOfCall: parseInt(e.target.value),
                    })
                  }
                  required
                  className="w-full px-4 py-3 bg-white border-2 border-primary rounded-lg focus:ring-4 focus:ring-primary/30 focus:border-primary-dark focus:outline-none text-accent placeholder-gray-400"
                  placeholder="e.g., 2020"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-accent mb-2">
                  Consultation Fee ($)
                </label>
                <input
                  type="number"
                  value={profileForm.consultationFee || ""}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      consultationFee: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-4 py-3 bg-white border-2 border-primary rounded-lg focus:ring-4 focus:ring-primary/30 focus:border-primary-dark focus:outline-none text-accent placeholder-gray-400"
                  placeholder="e.g., 150"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-accent mb-2">
                Years of Experience
              </label>
              <input
                type="number"
                value={profileForm.yearsOfExperience || ""}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    yearsOfExperience: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-3 bg-white border-2 border-primary rounded-lg focus:ring-4 focus:ring-primary/30 focus:border-primary-dark focus:outline-none text-accent placeholder-gray-400"
                placeholder="e.g., 5"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-accent mb-2">
                Practice Areas{" "}
                <span className="text-gray-500 font-normal">
                  (comma separated)
                </span>
              </label>
              <input
                type="text"
                value={profileForm.practiceAreas?.join(", ") || ""}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    practiceAreas: e.target.value
                      .split(",")
                      .map((s: string) => s.trim()),
                  })
                }
                className="w-full px-4 py-3 bg-white border-2 border-primary rounded-lg focus:ring-4 focus:ring-primary/30 focus:border-primary-dark focus:outline-none text-accent placeholder-gray-400"
                placeholder="e.g., Family Law, Corporate Law, Criminal Law"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-accent mb-2">
                Office Address
              </label>
              <input
                type="text"
                value={profileForm.officeAddress || ""}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    officeAddress: e.target.value,
                  })
                }
                className="w-full px-4 py-3 bg-white border-2 border-primary rounded-lg focus:ring-4 focus:ring-primary/30 focus:border-primary-dark focus:outline-none text-accent placeholder-gray-400"
                placeholder="Enter office address"
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-accent mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={profileForm.city || ""}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, city: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 bg-white border-2 border-primary rounded-lg focus:ring-4 focus:ring-primary/30 focus:border-primary-dark focus:outline-none text-accent placeholder-gray-400"
                  placeholder="Enter city"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-accent mb-2">
                  State *
                </label>
                <input
                  type="text"
                  value={profileForm.state || ""}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, state: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 bg-white border-2 border-primary rounded-lg focus:ring-4 focus:ring-primary/30 focus:border-primary-dark focus:outline-none text-accent placeholder-gray-400"
                  placeholder="Enter state"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-accent mb-2">
                Bio
              </label>
              <textarea
                value={profileForm.bio || ""}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, bio: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-3 bg-white border-2 border-primary rounded-lg focus:ring-4 focus:ring-primary/30 focus:border-primary-dark focus:outline-none text-accent placeholder-gray-400 resize-none"
                placeholder="Tell clients about yourself and your expertise..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-accent mb-2">
                Languages{" "}
                <span className="text-gray-500 font-normal">
                  (comma separated)
                </span>
              </label>
              <input
                type="text"
                value={profileForm.languages?.join(", ") || ""}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    languages: e.target.value
                      .split(",")
                      .map((s: string) => s.trim()),
                  })
                }
                className="w-full px-4 py-3 bg-white border-2 border-primary rounded-lg focus:ring-4 focus:ring-primary/30 focus:border-primary-dark focus:outline-none text-accent placeholder-gray-400"
                placeholder="e.g., English, French, Yoruba"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-accent mb-2">
                Available Days{" "}
                <span className="text-gray-500 font-normal">
                  (comma separated)
                </span>
              </label>
              <input
                type="text"
                value={profileForm.availableDays?.join(", ") || ""}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    availableDays: e.target.value
                      .split(",")
                      .map((s: string) => s.trim()),
                  })
                }
                className="w-full px-4 py-3 bg-white border-2 border-primary rounded-lg focus:ring-4 focus:ring-primary/30 focus:border-primary-dark focus:outline-none text-accent placeholder-gray-400"
                placeholder="e.g., Monday, Tuesday, Wednesday"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-accent mb-2">
                Available Hours
              </label>
              <input
                type="text"
                value={profileForm.availableHours || ""}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    availableHours: e.target.value,
                  })
                }
                className="w-full px-4 py-3 bg-white border-2 border-primary rounded-lg focus:ring-4 focus:ring-primary/30 focus:border-primary-dark focus:outline-none text-accent placeholder-gray-400"
                placeholder="e.g., 9:00 AM - 5:00 PM"
              />
            </div>

            <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg border-2 border-primary/30">
              <input
                type="checkbox"
                id="isAvailable"
                checked={profileForm.isAvailable ?? true}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    isAvailable: e.target.checked,
                  })
                }
                className="w-5 h-5 text-primary border-primary rounded focus:ring-2 focus:ring-primary-dark"
              />
              <label
                htmlFor="isAvailable"
                className="text-sm font-semibold text-accent cursor-pointer"
              >
                Available for new clients
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-accent text-white px-6 py-3.5 rounded-lg hover:bg-accent/90 font-bold text-lg shadow-md hover:shadow-lg transition-all"
            >
              Save Changes
            </button>
          </form>
        </div>
      )}

      {/* Leads Tab */}
      
      {/* Payout Tab */}
      {activeTab === "payout" && (
        <div className="bg-white rounded-xl shadow-lg border-2 border-primary/30 p-8 max-w-3xl">
          <h2 className="text-2xl font-bold text-accent mb-2">Payout Settings</h2>
          <p className="text-gray-600 mb-8 pb-3 border-b border-primary/20">
            Add your bank account details to receive payouts for consultations.
          </p>
          <form onSubmit={handleProfileUpdate} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-accent mb-2">Account Name</label>
              <input
                type="text"
                value={profileForm.accountName || ""}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, accountName: e.target.value })
                }
                className="w-full px-4 py-3 bg-white border-2 border-primary rounded-lg focus:ring-4 focus:ring-primary/30 focus:border-primary-dark focus:outline-none text-accent placeholder-gray-400"
                placeholder="e.g., John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-accent mb-2">Account Number</label>
              <input
                type="text"
                value={profileForm.accountNumber || ""}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, accountNumber: e.target.value })
                }
                className="w-full px-4 py-3 bg-white border-2 border-primary rounded-lg focus:ring-4 focus:ring-primary/30 focus:border-primary-dark focus:outline-none text-accent placeholder-gray-400"
                placeholder="e.g., 0123456789"
                maxLength={10}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-accent mb-2">Bank Name</label>
              <input
                type="text"
                value={profileForm.bankName || ""}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, bankName: e.target.value })
                }
                className="w-full px-4 py-3 bg-white border-2 border-primary rounded-lg focus:ring-4 focus:ring-primary/30 focus:border-primary-dark focus:outline-none text-accent placeholder-gray-400"
                placeholder="e.g., GTBank, Access Bank, First Bank"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-accent text-white px-6 py-3.5 rounded-lg hover:bg-accent/90 font-bold text-lg shadow-md hover:shadow-lg transition-all"
            >
              Save Payout Details
            </button>
          </form>
        </div>
      )}
{activeTab === "leads" && (
        <div className="bg-white rounded-xl shadow-lg border-2 border-primary/20">
          <div className="p-6 border-b-2 border-primary/20 bg-primary/5">
            <h2 className="text-2xl font-bold text-accent">Client Enquiries</h2>
          </div>
          {leads.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-lg">
              No enquiries yet.
            </div>
          ) : (
            <div className="divide-y divide-primary/10">
              {leads.map((lead: any) => (
                <div key={lead._id} className="p-6 hover:bg-primary/5 transition-colors">
                  <div className="flex-1 mb-3">
                    <p className="font-semibold text-accent text-lg">
                      {lead.enquiryMessage?.substring(0, 100)}...
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      {new Date(lead.createdAt).toLocaleDateString()} • {lead.clientName}
                    </p>
                  </div>

                  {lead.status === "pending" && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleRespond(lead._id, "accepted")}
                        disabled={lead.responding}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRespond(lead._id, "declined")}
                        disabled={lead.responding}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold"
                      >
                        Decline
                      </button>
                    </div>
                  )}

                  {lead.status === "accepted" && (
                    <div className="mt-3 p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="font-semibold text-green-800 mb-2">Contact Details:</p>
                      <p className="text-accent">📧 {lead.clientEmail}</p>
                      {lead.clientPhone && (
                        <p className="text-accent">📱 {lead.clientPhone}</p>
                      )}
                    </div>
                  )}

                  {lead.status === "declined" && (
                    <span className="inline-block px-4 py-2 bg-red-100 text-red-700 rounded-full font-semibold text-sm">
                      Declined
                    </span>
                  )}

                  {lead.status === "booked" && (
                    <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-semibold text-sm">
                      Booked
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}