"use client";

import React from "react";

interface SidebarProps {
  activeSection:
    | "dashboard"
    | "verifications"
    | "users"
    | "reports"
      | "configuration"
      | "payouts"
      | "revenue"
      | "guide";
  onSectionChange: (
    section:
      | "dashboard"
      | "verifications"
      | "users"
      | "reports"
      | "configuration"
      | "payouts"
      | "revenue"
      | "guide",
  ) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "verifications", label: "Verifications", icon: "✓" },
  { id: "users", label: "Users", icon: "👥" },
  { id: "reports", label: "Reports", icon: "📈" },
  { id: "configuration", label: "Configuration", icon: "⚙️" },
  { id: "payouts", label: "Payouts", icon: "💰" },
  { id: "revenue", label: "Revenue", icon: "📈" },
  { id: "guide", label: "Platform Guide", icon: "📖" },
];

export default function Sidebar({
  activeSection,
  onSectionChange,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const handleClick = (id: string) => {
    onSectionChange(id as any);
    if (onMobileClose) onMobileClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`w-64 bg-[#1B2A4A] min-h-screen border-r border-[#2D3E5F] flex flex-col flex-shrink-0
          fixed md:relative z-50 transition-transform duration-200
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
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
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
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
    </>
  );
}