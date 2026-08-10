"use client";

import React from "react";
import Link from "next/link";

interface SidebarProps {
  activeSection:
    | "dashboard"
    | "verifications"
    | "users"
    | "reports"
    | "configuration"
    | "payouts";
  onSectionChange: (
    section:
      | "dashboard"
      | "verifications"
      | "users"
      | "reports"
      | "configuration"
      | "payouts",
  ) => void;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "verifications", label: "Verifications", icon: "✓" },
  { id: "users", label: "Users", icon: "👥" },
  { id: "reports", label: "Reports", icon: "📈" },
  { id: "configuration", label: "Configuration", icon: "⚙️" },
  { id: "payouts", label: "Payouts", icon: "💰" },
];

export default function Sidebar({
  activeSection,
  onSectionChange,
}: SidebarProps) {
  return (
    <div className="w-64 bg-[#1B2A4A] min-h-screen border-r border-[#2D3E5F] flex flex-col">
      {/* Logo/Header */}
      <div className="p-6 border-b border-[#2D3E5F]">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-[#00A6A6] rounded-lg flex items-center justify-center text-white font-bold text-sm">
            A
          </div>
          <h1 className="text-xl font-bold text-white">AdvisoryConnect</h1>
        </div>
        <p className="text-xs text-[#94A3B8]">Admin Panel</p>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id as any)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left text-sm font-medium ${
              activeSection === item.id
                ? "bg-[#00A6A6] text-white shadow-lg"
                : "text-[#94A3B8] hover:bg-[#2D3E5F] hover:text-white"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#2D3E5F]">
        <button className="w-full text-left text-xs text-[#94A3B8] hover:text-white transition-colors py-2">
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}
