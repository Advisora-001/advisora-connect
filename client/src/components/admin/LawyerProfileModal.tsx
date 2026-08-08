"use client";

import React, { useState } from "react";

interface LawyerProfileModalProps {
  lawyer: any;
  onClose: () => void;
  onUpdate?: (data: any) => Promise<void>;
}

export default function LawyerProfileModal({
  lawyer,
  onClose,
  onUpdate,
}: LawyerProfileModalProps) {
  const [activeTab, setActiveTab] = useState<
    "profile" | "professional" | "payout" | "settings"
  >("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: lawyer.userId?.firstName || "",
    lastName: lawyer.userId?.lastName || "",
    email: lawyer.userId?.email || "",
    phone: lawyer.phone || "",
    city: lawyer.city || "",
    state: lawyer.state || "",
    address: lawyer.address || "",
    barNumber: lawyer.barNumber || "",
    consultationFee: lawyer.consultationFee || 0,
    bankName: lawyer.bankName || "",
    accountName: lawyer.accountName || "",
    accountNumber: lawyer.accountNumber || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (onUpdate) {
      setIsSaving(true);
      try {
        await onUpdate(formData);
        setIsEditing(false);
      } catch (error) {
        console.error("Failed to update lawyer profile:", error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const statusColor = {
    verified: "bg-[#ECFDF5] text-[#166534]",
    pending: "bg-[#FFFBEB] text-[#92400E]",
    rejected: "bg-[#FEF2F2] text-[#991B1B]",
  };

  const currentStatusColor =
    statusColor[lawyer.verificationStatus as keyof typeof statusColor] ||
    statusColor.pending;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex">
        {/* Sidebar Navigation */}
        <div className="w-56 bg-[#F5F7FA] border-r border-[#E5EAF0] flex flex-col">
          <div className="p-6 border-b border-[#E5EAF0]">
            <h3 className="text-sm font-bold text-[#1B2A4A] uppercase tracking-wide">
              Profile Management
            </h3>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {[
              { id: "profile", label: "Profile", icon: "👤" },
              { id: "professional", label: "Professional", icon: "💼" },
              { id: "payout", label: "Payout Details", icon: "💳" },
              { id: "settings", label: "Settings", icon: "⚙️" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-[#00A6A6] text-white shadow-md"
                    : "text-[#667085] hover:bg-[#E5EAF0] hover:text-[#1B2A4A]"
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-[#E5EAF0]">
            <button
              onClick={onClose}
              className="w-full text-left text-xs text-[#94A3B8] hover:text-[#1B2A4A] transition-colors py-2 font-medium"
            >
              ← Close
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header - Teal Gradient */}
          <div className="bg-gradient-to-r from-[#00A6A6] to-[#008F8F] p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-white/20 border-2 border-white flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                  {lawyer.photo ? (
                    <img
                      src={lawyer.photo}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>
                      {lawyer.userId?.firstName?.[0]}
                      {lawyer.userId?.lastName?.[0]}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {formData.firstName} {formData.lastName}
                  </h2>
                  <div className="flex gap-4 mt-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span>📍</span>
                      <span>
                        {formData.city}, {formData.state}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>📞</span>
                      <span>{formData.phone || "Not provided"}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2 bg-white text-[#00A6A6] rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm"
                  >
                    Edit
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          firstName: lawyer.userId?.firstName || "",
                          lastName: lawyer.userId?.lastName || "",
                          email: lawyer.userId?.email || "",
                          phone: lawyer.phone || "",
                          city: lawyer.city || "",
                          state: lawyer.state || "",
                          address: lawyer.address || "",
                          barNumber: lawyer.barNumber || "",
                          consultationFee: lawyer.consultationFee || 0,
                          bankName: lawyer.bankName || "",
                          accountName: lawyer.accountName || "",
                          accountNumber: lawyer.accountNumber || "",
                        });
                      }}
                      className="px-6 py-2 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-colors text-sm border border-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-6 py-2 bg-white text-[#00A6A6] rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[#1B2A4A] mb-4">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#667085] mb-2">
                        First Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-[#1B2A4A]"
                        />
                      ) : (
                        <p className="px-4 py-2.5 text-[#1B2A4A] font-medium">
                          {formData.firstName}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#667085] mb-2">
                        Last Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-[#1B2A4A]"
                        />
                      ) : (
                        <p className="px-4 py-2.5 text-[#1B2A4A] font-medium">
                          {formData.lastName}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#667085] mb-2">
                        Email
                      </label>
                      <p className="px-4 py-2.5 text-[#1B2A4A] font-medium bg-[#F5F7FA] rounded-lg">
                        {formData.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#1B2A4A] mb-4">
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#667085] mb-2">
                        Phone Number
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-[#1B2A4A]"
                        />
                      ) : (
                        <p className="px-4 py-2.5 text-[#1B2A4A] font-medium">
                          {formData.phone || "Not provided"}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#667085] mb-2">
                        City
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-[#1B2A4A]"
                        />
                      ) : (
                        <p className="px-4 py-2.5 text-[#1B2A4A] font-medium">
                          {formData.city}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#667085] mb-2">
                        State
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-[#1B2A4A]"
                        />
                      ) : (
                        <p className="px-4 py-2.5 text-[#1B2A4A] font-medium">
                          {formData.state}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#667085] mb-2">
                    Verification Status
                  </label>
                  <span
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold inline-block ${currentStatusColor}`}
                  >
                    {lawyer.verificationStatus || "pending"}
                  </span>
                </div>
              </div>
            )}

            {/* Professional Tab */}
            {activeTab === "professional" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[#1B2A4A] mb-4">
                    Professional Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#667085] mb-2">
                        Bar Number (SCN)
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="barNumber"
                          value={formData.barNumber}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-[#1B2A4A]"
                        />
                      ) : (
                        <p className="px-4 py-2.5 text-[#1B2A4A] font-medium">
                          {formData.barNumber || "N/A"}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#667085] mb-2">
                        Consultation Fee (₦)
                      </label>
                      {isEditing ? (
                        <input
                          type="number"
                          name="consultationFee"
                          value={formData.consultationFee}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-[#1B2A4A]"
                        />
                      ) : (
                        <p className="px-4 py-2.5 text-[#1B2A4A] font-medium">
                          ₦{formData.consultationFee || 0}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-[#1B2A4A] mb-3">
                    Practice Areas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {lawyer.practiceAreas && lawyer.practiceAreas.length > 0 ? (
                      lawyer.practiceAreas.map((area: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 bg-[#EFF6FF] text-[#1E40AF] rounded-full text-sm font-medium"
                        >
                          {area}
                        </span>
                      ))
                    ) : (
                      <p className="text-[#94A3B8] text-sm">
                        No practice areas listed
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Payout Tab */}
            {activeTab === "payout" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[#1B2A4A] mb-4">
                    Payout Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#667085] mb-2">
                        Bank Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="bankName"
                          value={formData.bankName}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-[#1B2A4A]"
                        />
                      ) : (
                        <p className="px-4 py-2.5 text-[#1B2A4A] font-medium">
                          {formData.bankName || "Not provided"}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#667085] mb-2">
                        Account Number
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="accountNumber"
                          value={formData.accountNumber}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-[#1B2A4A]"
                        />
                      ) : (
                        <p className="px-4 py-2.5 text-[#1B2A4A] font-medium">
                          {formData.accountNumber || "Not provided"}
                        </p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-[#667085] mb-2">
                        Account Holder Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="accountName"
                          value={formData.accountName}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-[#1B2A4A]"
                        />
                      ) : (
                        <p className="px-4 py-2.5 text-[#1B2A4A] font-medium">
                          {formData.accountName || "Not provided"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[#1B2A4A] mb-4">
                    Account Settings
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-[#F5F7FA] rounded-lg border border-[#E5EAF0]">
                      <p className="text-sm font-medium text-[#1B2A4A]">
                        Account Created
                      </p>
                      <p className="text-[#667085] text-sm mt-1">
                        {lawyer.userId?.createdAt
                          ? new Date(
                              lawyer.userId.createdAt,
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div className="p-4 bg-[#F5F7FA] rounded-lg border border-[#E5EAF0]">
                      <p className="text-sm font-medium text-[#1B2A4A]">
                        Verification Status
                      </p>
                      <p className="text-[#667085] text-sm mt-1 capitalize">
                        {lawyer.verificationStatus || "pending"}
                      </p>
                    </div>
                    {lawyer.updatedAt && (
                      <div className="p-4 bg-[#F5F7FA] rounded-lg border border-[#E5EAF0]">
                        <p className="text-sm font-medium text-[#1B2A4A]">
                          Last Updated
                        </p>
                        <p className="text-[#667085] text-sm mt-1">
                          {new Date(lawyer.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
