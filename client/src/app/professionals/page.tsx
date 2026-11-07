"use client";

import { Suspense, useEffect, useState } from "react";
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
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    const profileRequest = category === "legal"
      ? Promise.all([api.getProfessionalProfiles(category), api.getLawyers()])
          .then(([professionals, lawyers]) => ({
            profiles: [
              ...professionals.profiles,
              ...lawyers.lawyers.map((lawyer: any) => ({
                ...lawyer,
                category: "legal",
                professionalTitle: "Lawyer",
                specializations: lawyer.practiceAreas || [],
                isLegacyLawyer: true,
              })),
            ],
          }))
      : api.getProfessionalProfiles(category);

    profileRequest
      .then(({ profiles: results }) => setProfiles(results))
      .catch((requestError: Error) => {
        setProfiles([]);
        setError(requestError.message);
      })
      .finally(() => setLoading(false));
  }, [category]);

  const selectedLabel = categories.find((item) => item.value === category)?.label ?? "Professionals";

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

      {loading ? (
        <p className="py-12 text-center text-[#667085]">Loading {selectedLabel.toLowerCase()}...</p>
      ) : error ? (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>
      ) : profiles.length === 0 ? (
        <div className="rounded-xl border border-[#E5EAF0] bg-white p-10 text-center">
          <h2 className="text-lg font-semibold text-[#1B2A4A]">No approved profiles yet</h2>
          <p className="mt-2 text-sm text-[#667085]">Check back soon as more professionals join Advisora.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <article key={profile._id} className="rounded-xl border border-[#E5EAF0] bg-white p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1B2A4A] font-bold text-white">
                  {profile.userId?.avatar
                    ? <img src={profile.userId.avatar} alt="" className="h-full w-full object-cover" />
                    : `${profile.userId?.firstName?.[0] ?? ""}${profile.userId?.lastName?.[0] ?? ""}`}
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-[#1B2A4A]">{profile.userId?.firstName} {profile.userId?.lastName}</h2>
                  <p className="text-sm text-[#667085]">{profile.professionalTitle}</p>
                  <p className="mt-1 text-xs text-[#667085]">{profile.city}, {profile.state}</p>
                </div>
              </div>
              <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-[#475569]">{profile.bio}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.specializations?.slice(0, 3).map((specialty: string) => <span key={specialty} className="rounded-full bg-[#EEF2F7] px-2.5 py-1 text-xs text-[#1B2A4A]">{specialty}</span>)}
              </div>
              <Link href={profile.isLegacyLawyer ? `/lawyers/${profile._id}` : `/professionals/profile/${profile._id}`} className="mt-5 inline-block text-sm font-semibold text-[#00A6A6] hover:underline">View profile →</Link>
            </article>
          ))}
        </div>
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
