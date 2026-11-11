"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

const categories = [
  { value: "legal", label: "Legal professionals" },
  { value: "accounting", label: "Accountants" },
  { value: "tax", label: "Tax consultants" },
];

function ProfessionalsDirectory() {
  const searchParams = useSearchParams();
  const requestedCategory = searchParams.get("category");
  const [category, setCategory] = useState(
    categories.some((item) => item.value === requestedCategory) ? requestedCategory! : "legal",
  );
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    city: searchParams.get("city") || "",
    state: searchParams.get("state") || "",
    specialization: searchParams.get("specialization") || "",
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    let active = true;

    const loadProfiles = async () => {
      const requestFilters = Object.fromEntries(
        Object.entries(appliedFilters).filter(([, value]) => value.trim()),
      );
      if (category !== "legal") {
        const result = await api.getProfessionalProfiles(category, requestFilters);
        if (active) setProfiles(result.profiles);
        return;
      }

      const lawyerFilters: Record<string, string> = {};
      if (appliedFilters.search.trim()) lawyerFilters.search = appliedFilters.search.trim();
      if (appliedFilters.specialization.trim()) lawyerFilters.practiceArea = appliedFilters.specialization.trim();
      if (appliedFilters.city.trim()) lawyerFilters.location = appliedFilters.city.trim();
      if (appliedFilters.state.trim()) lawyerFilters.state = appliedFilters.state.trim();

      const [professionalResult, lawyerResult] = await Promise.allSettled([
        api.getProfessionalProfiles(category, requestFilters),
        api.getLawyers(lawyerFilters),
      ]);

      if (!active) return;

      const professionalProfiles = professionalResult.status === "fulfilled"
        ? professionalResult.value.profiles
        : [];
      const lawyerProfiles = lawyerResult.status === "fulfilled"
        ? lawyerResult.value.lawyers.map((lawyer: any) => ({
            ...lawyer,
            category: "legal",
            professionalTitle: lawyer.professionalTitle || "Lawyer",
            photo: lawyer.photo || lawyer.userId?.avatar || "",
            bio: lawyer.bio || "",
            city: lawyer.city || "",
            state: lawyer.state || "",
            specializations: lawyer.practiceAreas || [],
            qualifications: lawyer.barNumber ? [`SCN: ${lawyer.barNumber}`] : [],
            isLegacyLawyer: true,
          }))
        : [];

      const professionalUserIds = new Set(
        professionalProfiles
          .map((profile: any) => profile.userId?._id || profile.userId)
          .filter(Boolean)
          .map((userId: { toString(): string }) => userId.toString()),
      );
      const legacyProfilesWithoutDuplicates = lawyerProfiles.filter((lawyer: any) => {
        const userId = lawyer.userId?._id || lawyer.userId;
        return !userId || !professionalUserIds.has(userId.toString());
      });

      setProfiles([...professionalProfiles, ...legacyProfilesWithoutDuplicates]);

      const failedSources = [
        professionalResult.status === "rejected" ? "new legal profiles" : "",
        lawyerResult.status === "rejected" ? "existing lawyer profiles" : "",
      ].filter(Boolean);
      if (failedSources.length > 0) {
        setError(`Could not load ${failedSources.join(" and ")}. Some profiles may be missing.`);
      }
    };

    loadProfiles()
      .catch((requestError: Error) => {
        if (!active) return;
        setProfiles([]);
        setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [category, appliedFilters]);

  const selectedLabel = categories.find((item) => item.value === category)?.label ?? "Professionals";
  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedFilters({
      search: filters.search.trim(),
      city: filters.city.trim(),
      state: filters.state.trim(),
      specialization: filters.specialization.trim(),
    });
  };
  const clearSearch = () => {
    const emptyFilters = { search: "", city: "", state: "", specialization: "" };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1B2A4A]">Find professionals</h1>
        <p className="mt-2 text-[#667085]">Browse reviewed profiles across legal, accounting, and tax services.</p>
      </div>

      <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Professional category">
        {categories.map((item) => (
          <button key={item.value} type="button" onClick={() => setCategory(item.value)} className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${category === item.value ? "bg-[#1B2A4A] text-white" : "border border-[#E5EAF0] bg-white text-[#475569]"}`}>
            {item.label}
          </button>
        ))}
      </div>

      <form onSubmit={submitSearch} className="mb-8 rounded-xl border border-[#E5EAF0] bg-white p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-medium text-[#475569] lg:col-span-2">
            Search professionals
            <input
              type="search"
              value={filters.search}
              onChange={(event) => setFilters({ ...filters, search: event.target.value })}
              placeholder="Name, service, or expertise..."
              className="mt-1.5 w-full rounded-lg border border-[#D0D5DD] px-4 py-2.5 text-sm focus:border-[#00A6A6] focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20"
            />
          </label>
          <label className="text-sm font-medium text-[#475569]">
            Area of expertise
            <input
              type="search"
              value={filters.specialization}
              onChange={(event) => setFilters({ ...filters, specialization: event.target.value })}
              placeholder="e.g. corporate law"
              className="mt-1.5 w-full rounded-lg border border-[#D0D5DD] px-4 py-2.5 text-sm focus:border-[#00A6A6] focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20"
            />
          </label>
          <label className="text-sm font-medium text-[#475569]">
            City
            <input
              type="text"
              value={filters.city}
              onChange={(event) => setFilters({ ...filters, city: event.target.value })}
              placeholder="Any city"
              className="mt-1.5 w-full rounded-lg border border-[#D0D5DD] px-4 py-2.5 text-sm focus:border-[#00A6A6] focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20"
            />
          </label>
          <label className="text-sm font-medium text-[#475569]">
            State
            <input
              type="text"
              value={filters.state}
              onChange={(event) => setFilters({ ...filters, state: event.target.value })}
              placeholder="Any state"
              className="mt-1.5 w-full rounded-lg border border-[#D0D5DD] px-4 py-2.5 text-sm focus:border-[#00A6A6] focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="submit" className="rounded-lg bg-[#1B2A4A] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#16213A]">
            Search
          </button>
          <button type="button" onClick={clearSearch} className="rounded-lg border border-[#E5EAF0] px-5 py-2.5 text-sm font-semibold text-[#475569] transition-colors hover:bg-[#F5F7FA]">
            Clear filters
          </button>
        </div>
      </form>

      {loading ? (
        <p className="py-12 text-center text-[#667085]">Loading {selectedLabel.toLowerCase()}...</p>
      ) : profiles.length === 0 ? (
        <div className="rounded-xl border border-[#E5EAF0] bg-white p-10 text-center">
          {error ? (
            <p role="alert" className="text-sm text-red-700">{error}</p>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-[#1B2A4A]">{Object.values(appliedFilters).some(Boolean) ? "No matching professionals found" : "No approved profiles yet"}</h2>
              <p className="mt-2 text-sm text-[#667085]">{Object.values(appliedFilters).some(Boolean) ? "Try changing or clearing your search filters." : "Check back soon as more professionals join Advisora."}</p>
            </>
          )}
        </div>
      ) : (
        <>
          {error && <p role="alert" className="mb-5 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">{error}</p>}
          <p className="mb-4 text-sm text-[#667085]">{profiles.length} professional{profiles.length === 1 ? "" : "s"} found</p>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {profiles.map((profile) => (
            <article key={`${profile.isLegacyLawyer ? "lawyer" : "professional"}-${profile._id}`} className="rounded-xl border border-[#E5EAF0] bg-white p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1B2A4A] font-bold text-white">
                  {profile.photo || profile.userId?.avatar
                    ? <img src={profile.photo || profile.userId?.avatar} alt={`${profile.userId?.firstName ?? ""} ${profile.userId?.lastName ?? ""}`} className="h-full w-full object-cover" />
                    : `${profile.userId?.firstName?.[0] ?? ""}${profile.userId?.lastName?.[0] ?? ""}`}
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-[#1B2A4A]">{profile.userId?.firstName} {profile.userId?.lastName}</h2>
                  <p className="text-sm text-[#667085]">{profile.professionalTitle}</p>
                  <p className="mt-1 text-xs text-[#667085]">{profile.city}, {profile.state}</p>
                </div>
              </div>
              {profile.bio && <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-[#475569]">{profile.bio}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.specializations?.slice(0, 3).map((specialty: string) => <span key={specialty} className="rounded-full bg-[#EEF2F7] px-2.5 py-1 text-xs text-[#1B2A4A]">{specialty}</span>)}
              </div>
              {profile.isLegacyLawyer && (
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#667085]">
                  {profile.yearsOfExperience > 0 && <span>{profile.yearsOfExperience} years’ experience</span>}
                  {profile.rating > 0 && <span>★ {profile.rating.toFixed(1)} ({profile.reviewCount || 0} reviews)</span>}
                  {profile.verificationBadge && <span className="font-semibold text-green-700">Verified lawyer</span>}
                </div>
              )}
              <Link href={profile.isLegacyLawyer ? `/lawyers/${profile._id}` : `/professionals/profile/${profile._id}`} className="mt-5 inline-block text-sm font-semibold text-[#00A6A6] hover:underline">View profile →</Link>
            </article>
            ))}
          </div>
        </>
      )}
    </main>
  );
}

export default function ProfessionalsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-12 text-center text-[#667085]">Loading professionals...</div>}>
      <ProfessionalsDirectory />
    </Suspense>
  );
}
