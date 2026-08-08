"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useProfileGate } from "@/hooks/useProfileGate";

const practiceAreas = [
  "Corporate & Commercial Law", "Mergers & Acquisitions", "Banking & Finance",
  "Capital Markets", "Private Equity & Venture Capital", "Technology Law",
  "Data Protection & Privacy", "Artificial Intelligence (AI) Law", "FinTech Law",
  "Intellectual Property", "Trademarks", "Copyright", "Patent Law",
  "Telecommunications", "Media & Entertainment", "Employment & Labour Law",
  "Immigration Law", "Tax Law", "Competition & Antitrust", "Regulatory & Compliance",
  "Energy & Power", "Oil & Gas", "Mining Law", "Infrastructure & PPP",
  "Construction Law", "Real Estate & Property", "Environmental Law",
  "Maritime & Shipping", "Aviation Law", "Insurance Law", "Litigation",
  "Arbitration", "Mediation", "Debt Recovery", "Insolvency & Restructuring",
  "Criminal Defence", "Family Law", "Divorce & Matrimonial", "Child & Adoption Law",
  "Wills, Probate & Estate Planning", "Trusts & Wealth Management", "Human Rights Law",
  "NGO & Non-Profit Law", "Public Procurement", "Government Relations & Public Sector",
];

const statesList = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi",
  "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun",
  "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

function LawyersContent() {
  const searchParams = useSearchParams();
  const { requireAccess, GateModal } = useProfileGate();
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    name: searchParams.get("name") || "",
    practiceArea: searchParams.get("practiceArea") || "",
    location: searchParams.get("location") || "",
    state: searchParams.get("state") || "",
    isAvailable: searchParams.get("isAvailable") || "",
  });

  async function fetchLawyers() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filters.name) params.name = filters.name;
      if (filters.practiceArea) params.practiceArea = filters.practiceArea;
      if (filters.location) params.location = filters.location;
      if (filters.state) params.state = filters.state;
      if (filters.isAvailable) params.isAvailable = filters.isAvailable;
      const data = await api.getLawyers(params);
      setLawyers(data.lawyers);
    } catch {
      setLawyers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLawyers();
  }, [filters]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1B2A4A] tracking-tight">Find Lawyers</h1>
        <p className="text-[#667085] mt-1">Browse our directory of verified legal professionals</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#E5EAF0] p-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input type="text" placeholder="Search by name..." value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            className="px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm" />
          <select value={filters.practiceArea}
            onChange={(e) => setFilters({ ...filters, practiceArea: e.target.value })}
            className="px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] bg-white text-sm">
            <option value="">All Practice Areas</option>
            {practiceAreas.map((area) => (<option key={area} value={area}>{area}</option>))}
          </select>
          <input type="text" placeholder="City..." value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            className="px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm" />
          <select value={filters.state}
            onChange={(e) => setFilters({ ...filters, state: e.target.value })}
            className="px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] bg-white text-sm">
            <option value="">All States</option>
            {statesList.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
          <select value={filters.isAvailable}
            onChange={(e) => setFilters({ ...filters, isAvailable: e.target.value })}
            className="px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] bg-white text-sm">
            <option value="">Any Availability</option>
            <option value="true">Available Now</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin w-8 h-8 border-2 border-[#1B2A4A] border-t-transparent rounded-full mx-auto"></div>
          <p className="text-[#667085] mt-4 text-sm">Searching lawyers...</p>
        </div>
      ) : lawyers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#E5EAF0]">
          <p className="text-lg text-[#667085]">No lawyers found matching your criteria.</p>
          <p className="text-[#94A3B8] mt-1 text-sm">Try adjusting your filters.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-[#667085] mb-4">{lawyers.length} lawyer{lawyers.length !== 1 ? "s" : ""} found</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {lawyers.map((lawyer: any) => (
              <div key={lawyer._id}
                onClick={(e) => { e.preventDefault(); requireAccess(lawyer._id); }}
                className="bg-white border border-[#E5EAF0] rounded-xl p-5 hover:shadow-md hover:border-[#00A6A6]/30 transition-all cursor-pointer group">
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-[#1B2A4A] flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                    {lawyer.photo ? (
                      <img src={lawyer.photo} alt={lawyer.userId?.firstName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{lawyer.userId?.firstName?.[0]}{lawyer.userId?.lastName?.[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#1B2A4A] truncate group-hover:text-[#00A6A6] transition-colors">{lawyer.userId?.firstName} {lawyer.userId?.lastName}</h3>
                      {lawyer.verificationBadge && (
                        <span className="bg-[#ECFDF5] text-[#166534] text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium">✓ Verified</span>
                      )}
                    </div>
                    <p className="text-sm text-[#667085]">{lawyer.city}, {lawyer.state}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {lawyer.practiceAreas?.slice(0, 3).map((area: string) => (
                        <span key={area} className="bg-[#EEF2F7] text-[#475569] text-xs px-2 py-1 rounded-full">{area}</span>
                      ))}
                    </div>
                    <div className="flex items-center mt-2 text-sm">
                      <span className="text-[#F59E0B]">★</span>
                      <span className="ml-1 text-[#1B2A4A] font-medium">{lawyer.rating?.toFixed(1)}</span>
                      <span className="ml-1 text-[#94A3B8]">({lawyer.reviewCount})</span>
                      {lawyer.subscription?.status === "active" && (
                        <span className="ml-auto text-xs text-[#00A6A6] font-medium">{lawyer.subscription.plan}</span>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <span className="text-sm bg-[#1B2A4A]/5 text-[#1B2A4A] px-3 py-1 rounded-lg font-medium">Contact</span>
                      {lawyer.consultationFee > 0 && (
                        <span className="text-sm text-[#667085]">₦{lawyer.consultationFee.toLocaleString()}/hr</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {GateModal}
    </div>
  );
}

export default function LawyersPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-[#667085]">Loading...</div>}>
      <LawyersContent />
    </Suspense>
  );
}