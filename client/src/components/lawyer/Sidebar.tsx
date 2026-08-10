"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  activeSection: "dashboard" | "enquiries" | "appointments" | "profile" | "payout" | "wallet";
  onSectionChange: (section: "dashboard" | "enquiries" | "appointments" | "profile" | "payout" | "wallet") => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "enquiries", label: "Enquiries", icon: "📨" },
  { id: "appointments", label: "Appointments", icon: "📅" },
  { id: "wallet", label: "Wallet", icon: "💳" },
  { id: "profile", label: "Profile", icon: "👤" },
  { id: "payout", label: "Payout", icon: "💰" },
];

export default function LawyerSidebar({ activeSection, onSectionChange, mobileOpen, onMobileClose }: SidebarProps) {
  const { user, logout } = useAuth();

  const handleClick = (id: string) => {
    onSectionChange(id as any);
    if (onMobileClose) onMobileClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onMobileClose} />
      )}

      {/* Sidebar */}
      <div className={`w-64 bg-[#1B2A4A] min-h-screen border-r border-[#2D3E5F] flex flex-col flex-shrink-0
        fixed md:relative z-50 transition-transform duration-200
        ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        {/* Logo/Header */}
        <div className="p-6 border-b border-[#2D3E5F]">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-[#00A6A6] rounded-lg flex items-center justify-center text-white font-bold text-sm">A</div>
            <h1 className="text-xl font-bold text-white">AdvisoryConnect</h1>
          </div>
          <p className="text-xs text-[#94A3B8]">Lawyer Panel</p>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => handleClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left text-sm font-medium ${
                activeSection === item.id ? "bg-[#00A6A6] text-white shadow-lg" : "text-[#94A3B8] hover:bg-[#2D3E5F] hover:text-white"
              }`}>
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#2D3E5F]">
          <div className="mb-3 px-2"><p className="text-xs text-[#94A3B8] truncate">{user?.email}</p></div>
          <button onClick={() => logout()} className="w-full text-left text-xs text-[#94A3B8] hover:text-white transition-colors py-2">← Logout</button>
        </div>
      </div>
    </>
  );
}