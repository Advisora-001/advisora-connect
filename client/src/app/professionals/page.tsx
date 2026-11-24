"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useProfessionals, type LawyerFilters } from "@/hooks/useProfessionals";
import { ProfessionalCardSkeleton, ProfessionalListSkeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { useProfileGate } from "@/hooks/useProfileGate";
import { ProfessionalCategory } from "@/types/api";

const categoryTabs = [
  { key: 'legal', label: 'Legal', icon: '⚖️' },
  { key: 'accounting', label: 'Accounting', icon: '📊' },
  { key: 'tax', label: 'Tax', icon: '🧾' },
];

// Get unique states for filter
const statesList = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi",
  "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun",
  "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

function ProfessionalsContent() {
  const searchParams = useSearchParams();
  const { requireAccess, GateModal } = useProfileGate();
  const [activeCategory, setActiveCategory] = useState<string>('legal');
  const [filters, setFilters] = useState<LawyerFilters>({
    name: searchParams.get("name") || "",
    practiceArea: searchParams.get("practiceArea") || "",
    location: searchParams.get("location") || "",
    state: searchParams.get("state") || "",
    isAvailable: (searchParams.get("isAvailable") === "true" ? "true" : searchParams.get("isAvailable") === "false" ? "false" : undefined),
    category: activeCategory,
  });
  const [specializations, setSpecializations] = useState<string[]>([]);

  // Fetch specializations for active category
  useEffect(() => {
    // This would ideally come from the API, but for now we'll use a mapping
    const specializationMap: Record<string, string[]> = {
      legal: [
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
      ],
      accounting: [
        "Tax Preparation", "Bookkeeping", "Audit & Assurance",
        "Financial Planning", "Corporate Accounting",
      ],
      tax: [
        "Personal Tax", "Business Tax", "International Tax",
        "VAT & Indirect Tax", "Tax Controversy",
      ],
    };
    setSpecializations(specializationMap[activeCategory] || []);
  }, [activeCategory]);

  const { data, isLoading, error } = useProfessionals(filters);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setFilters(prev => ({ ...prev, category, practiceArea: "", specialization: "" }));
  };

  const handleFilterChange = (key: keyof LawyerFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1B2A4A] tracking-tight">Find Professionals</h1>
        <p className="text-[#667085] mt-1">Browse our directory of verified professionals across Legal, Accounting & Tax</p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 border-b border-[#E5EAF0] overflow-x-auto">
        {categoryTabs.map((cat) => (
          <button
            key={cat.key}
            onClick={() => handleCategoryChange(cat.key)}
            className={`
              flex items-center gap-2 px-4 py-3 whitespace-nowrap text-sm font-medium rounded-t-lg transition-all
              ${activeCategory === cat.key
                ? 'bg-[#1B2A4A] text-white border-b-2 border-[#00A6A6]'
                : 'text-[#667085] hover:text-[#1B2A4A] hover:bg-[#F5F7FA]'
              }
            `}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#E5EAF0] p-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="Search by name..."
            value={filters.name}
            onChange={(e) => handleFilterChange('name', e.target.value)}
            className="px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm"
          />
          <select
            value={filters.practiceArea}
            onChange={(e) => handleFilterChange('practiceArea', e.target.value)}
            className="px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] bg-white text-sm"
          >
            <option value="">All Specializations</option>
            {specializations.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="City..."
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
            className="px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm"
          />
          <select
            value={filters.state}
            onChange={(e) => handleFilterChange('state', e.target.value)}
            className="px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] bg-white text-sm"
          >
            <option value="">All States</option>
            {statesList.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={filters.isAvailable}
            onChange={(e) => handleFilterChange('isAvailable', e.target.value)}
            className="px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] bg-white text-sm"
          >
            <option value="">Any Availability</option>
            <option value="true">Available Now</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <ProfessionalListSkeleton count={6} />
      ) : error ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#E5EAF0]">
          <p className="text-[#EF4444] font-semibold">Failed to load professionals</p>
          <p className="text-[#94A3B8] mt-1 text-sm">Please try again later.</p>
        </div>
      ) : data?.professionals.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#E5EAF0]">
          <p className="text-lg text-[#667085]">No professionals found matching your criteria.</p>
          <p className="text-[#94A3B8] mt-1 text-sm">Try adjusting your filters.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-[#667085] mb-4">{data?.professionals.length} professional{data?.professionals.length !== 1 ? "s" : ""} found</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data?.professionals.map((professional: any) => (
              <div
                key={professional._id}
                onClick={(e) => {
                  e.preventDefault();
                  requireAccess(professional._id);
                }}
                className="bg-white border border-[#E5EAF0] rounded-xl p-5 hover:shadow-md hover:border-[#00A6A6]/30 transition-all cursor-pointer group"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-[#1B2A4A] flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                    {professional.photo ? (
                      <img src={professional.photo} alt={professional.userId?.firstName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{professional.userId?.firstName?.[0]}{professional.userId?.lastName?.[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#1B2A4A] truncate group-hover:text-[#00A6A6] transition-colors">
                        {professional.userId?.firstName} {professional.userId?.lastName}
                      </h3>
                      {professional.verificationBadge && (
                        <Badge variant="success" size="sm" dot>
                          Verified
                        </Badge>
                      )}
                      {professional.category && (
                        <Badge variant="info" size="sm">
                          {professional.category.label}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-[#667085]">{professional.city}, {professional.state}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(professional.practiceAreas || professional.specializations || [])?.slice(0, 3).map((area: string) => (
                        <span key={area} className="bg-[#EEF2F7] text-[#475569] text-xs px-2 py-1 rounded-full">{area}</span>
                      ))}
                    </div>
                    <div className="flex items-center mt-2 text-sm">
                      <span className="text-[#F59E0B]">★</span>
                      <span className="ml-1 text-[#1B2A4A] font-medium">{professional.rating?.toFixed(1)}</span>
                      <span className="ml-1 text-[#94A3B8]">({professional.reviewCount})</span>
                      {professional.subscription?.status === "active" && (
                        <span className="ml-auto text-xs text-[#00A6A6] font-medium">{professional.subscription.plan}</span>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <span className="text-sm bg-[#1B2A4A]/5 text-[#1B2A4A] px-3 py-1 rounded-lg font-medium">Contact</span>
                      {professional.consultationFee > 0 && (
                        <span className="text-sm text-[#667085]">₦{professional.consultationFee.toLocaleString()}/hr</span>
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

export default function ProfessionalsPage() {
  return (
    <Suspense fallback={<ProfessionalListSkeleton count={6} />}>
      <ProfessionalsContent />
    </Suspense>
  );
}