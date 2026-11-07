"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

const categoryLabels: Record<string, string> = {
  legal: "Legal professional",
  accounting: "Accountant",
  tax: "Tax consultant",
};

const arrayFields = ["qualifications", "specializations", "services"] as const;

export default function ProfessionalDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "professional") {
      router.push("/login");
      return;
    }

    Promise.all([api.getMyProfessionalProfiles(), api.getProfessionalEnquiries()])
      .then(([{ profiles: loadedProfiles }, { enquiries: receivedEnquiries }]) => {
        setProfiles(loadedProfiles);
        setEnquiries(receivedEnquiries);
        if (loadedProfiles.length > 0) {
          setSelectedId(loadedProfiles[0]._id);
          setForm(loadedProfiles[0]);
        }
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const selectProfile = (profile: any) => {
    setSelectedId(profile._id);
    setForm(profile);
    setError("");
    setNotice("");
  };

  const updateField = (field: string, value: string | boolean) => {
    setForm((current: any) => ({
      ...current,
      [field]: arrayFields.includes(field as (typeof arrayFields)[number]) && typeof value === "string"
        ? value.split(",").map((item) => item.trim()).filter(Boolean)
        : field === "yearsOfExperience" && typeof value === "string"
          ? Number(value)
          : value,
    }));
  };

  const saveProfile = async () => {
    if (!form) return false;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const { profile } = await api.updateProfessionalProfile(selectedId, form);
      setForm(profile);
      setProfiles((current) => current.map((item) => item._id === profile._id ? profile : item));
      setNotice("Draft saved.");
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not save your profile.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const submitProfile = async () => {
    if (!form) return;
    const saved = await saveProfile();
    if (!saved) return;
    setSaving(true);
    setError("");
    try {
      const { profile, message } = await api.submitProfessionalProfile(selectedId);
      setForm(profile);
      setProfiles((current) => current.map((item) => item._id === profile._id ? profile : item));
      setNotice(message);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not submit your profile.");
    } finally {
      setSaving(false);
    }
  };

  const uploadDocuments = async (files: FileList | null) => {
    if (!files || !form) return;
    if (form.verificationDocs.length + files.length > 5) {
      setError("You can upload a maximum of five supporting documents.");
      return;
    }
    if (Array.from(files).some((file) => file.size > 10 * 1024 * 1024)) {
      setError("Each document must be smaller than 10 MB.");
      return;
    }

    const data = new FormData();
    Array.from(files).forEach((file) => data.append("documents", file));
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const { profile } = await api.uploadProfessionalVerificationDocs(selectedId, data);
      setForm(profile);
      setProfiles((current) => current.map((item) => item._id === profile._id ? profile : item));
      setNotice("Supporting documents uploaded. Save your profile and submit it for review.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not upload supporting documents.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-[#667085]">Loading your professional profiles...</div>;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1B2A4A]">Professional profiles</h1>
          <p className="mt-2 text-[#667085]">Manage each service category from one account.</p>
        </div>
        <Link href="/professionals" className="font-semibold text-[#00A6A6] hover:underline">Browse professionals</Link>
      </div>

      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{notice}</p>}

      <section className="mb-8 rounded-xl border border-[#E5EAF0] bg-white p-5 sm:p-6">
        <h2 className="text-xl font-bold text-[#1B2A4A]">Client enquiries</h2>
        {enquiries.length === 0 ? (
          <p className="mt-2 text-sm text-[#667085]">New enquiries for your approved, available profiles will appear here.</p>
        ) : (
          <div className="mt-4 divide-y divide-[#E5EAF0]">
            {enquiries.map((enquiry) => (
              <article key={enquiry._id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-semibold text-[#1B2A4A]">{enquiry.clientId?.firstName} {enquiry.clientId?.lastName}</p>
                  <time className="text-xs text-[#667085]">{new Date(enquiry.createdAt).toLocaleDateString()}</time>
                </div>
                <p className="mt-1 text-xs text-[#667085]">
                  {categoryLabels[enquiry.professionalProfileId?.category] || "Professional"} · <a href={`mailto:${enquiry.clientId?.email}`} className="text-[#00A6A6] hover:underline">{enquiry.clientId?.email}</a>
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-[#475569]">{enquiry.message}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      {profiles.length === 0 ? (
        <div className="rounded-xl border border-[#E5EAF0] bg-white p-8 text-center text-[#667085]">
          No category profiles were found for this account. Contact support for help.
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap gap-2">
            {profiles.map((profile) => (
              <button
                key={profile._id}
                type="button"
                onClick={() => selectProfile(profile)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold ${selectedId === profile._id ? "bg-[#1B2A4A] text-white" : "border border-[#E5EAF0] bg-white text-[#475569]"}`}
              >
                {categoryLabels[profile.category] || profile.category}
              </button>
            ))}
          </div>

          {form && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void saveProfile();
              }}
              className="space-y-5 rounded-xl border border-[#E5EAF0] bg-white p-5 sm:p-8"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-[#1B2A4A]">{categoryLabels[form.category]}</h2>
                <span className="rounded-full bg-[#F1F5F9] px-3 py-1 text-xs font-semibold capitalize text-[#475569]">
                  {form.verificationStatus.replace("_", " ")}
                </span>
              </div>

              {form.reviewNote && (
                <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Review note: {form.reviewNote}</p>
              )}

              <label className="block text-sm font-medium text-[#344054]">
                Professional title
                <input required value={form.professionalTitle} onChange={(event) => updateField("professionalTitle", event.target.value)} placeholder="e.g. Chartered Accountant" className="mt-1 w-full rounded-lg border border-[#D0D5DD] px-3 py-2.5" />
              </label>

              <label className="block text-sm font-medium text-[#344054]">
                Profile summary
                <textarea required rows={4} value={form.bio} onChange={(event) => updateField("bio", event.target.value)} className="mt-1 w-full rounded-lg border border-[#D0D5DD] px-3 py-2.5" />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-[#344054]">
                  Qualifications <span className="font-normal text-[#667085]">(comma-separated)</span>
                  <input value={form.qualifications.join(", ")} onChange={(event) => updateField("qualifications", event.target.value)} placeholder="e.g. BSc Accounting, ACA" className="mt-1 w-full rounded-lg border border-[#D0D5DD] px-3 py-2.5" />
                </label>
                <label className="block text-sm font-medium text-[#344054]">
                  Professional body
                  <input value={form.professionalBody} onChange={(event) => updateField("professionalBody", event.target.value)} placeholder="e.g. ICAN" className="mt-1 w-full rounded-lg border border-[#D0D5DD] px-3 py-2.5" />
                </label>
                <label className="block text-sm font-medium text-[#344054]">
                  Membership or registration number
                  <input value={form.membershipNumber} onChange={(event) => updateField("membershipNumber", event.target.value)} className="mt-1 w-full rounded-lg border border-[#D0D5DD] px-3 py-2.5" />
                </label>
                <label className="block text-sm font-medium text-[#344054]">
                  Areas of expertise <span className="font-normal text-[#667085]">(comma-separated)</span>
                  <input value={form.specializations.join(", ")} onChange={(event) => updateField("specializations", event.target.value)} placeholder="e.g. Audit, SME accounting" className="mt-1 w-full rounded-lg border border-[#D0D5DD] px-3 py-2.5" />
                </label>
                <label className="block text-sm font-medium text-[#344054]">
                  Services <span className="font-normal text-[#667085]">(comma-separated)</span>
                  <input value={form.services.join(", ")} onChange={(event) => updateField("services", event.target.value)} placeholder="e.g. Bookkeeping, tax filing" className="mt-1 w-full rounded-lg border border-[#D0D5DD] px-3 py-2.5" />
                </label>
                <label className="block text-sm font-medium text-[#344054]">
                  Years of experience
                  <input type="number" min="0" value={form.yearsOfExperience} onChange={(event) => updateField("yearsOfExperience", event.target.value)} className="mt-1 w-full rounded-lg border border-[#D0D5DD] px-3 py-2.5" />
                </label>
                <label className="block text-sm font-medium text-[#344054]">
                  City
                  <input required value={form.city} onChange={(event) => updateField("city", event.target.value)} className="mt-1 w-full rounded-lg border border-[#D0D5DD] px-3 py-2.5" />
                </label>
                <label className="block text-sm font-medium text-[#344054]">
                  State
                  <input required value={form.state} onChange={(event) => updateField("state", event.target.value)} className="mt-1 w-full rounded-lg border border-[#D0D5DD] px-3 py-2.5" />
                </label>
              </div>

              <label className="flex items-center gap-2 text-sm text-[#344054]">
                <input type="checkbox" checked={form.isAvailable} onChange={(event) => updateField("isAvailable", event.target.checked)} />
                Available for new enquiries
              </label>

              <div>
                <label className="block text-sm font-medium text-[#344054]">
                  Supporting credentials
                  <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" disabled={saving || form.verificationDocs.length >= 5} onChange={(event) => {
                    void uploadDocuments(event.target.files);
                    event.currentTarget.value = "";
                  }} className="mt-2 block w-full text-sm text-[#667085]" />
                </label>
                <p className="mt-1 text-xs text-[#667085]">PDF, image, or document files; up to 10 MB each and five per category profile. At least one supporting document is required for review.</p>
                {form.verificationDocs.length > 0 && (
                  <ul className="mt-2 space-y-1 text-sm">
                    {form.verificationDocs.map((document: string, index: number) => (
                      <li key={`${document}-${index}`}><a href={document} target="_blank" rel="noreferrer" className="text-[#00A6A6] hover:underline">View uploaded document {index + 1}</a></li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex flex-wrap gap-3 border-t border-[#E5EAF0] pt-5">
                <button type="submit" disabled={saving} className="rounded-lg bg-[#1B2A4A] px-5 py-2.5 font-semibold text-white disabled:opacity-50">
                  {saving ? "Saving..." : "Save draft"}
                </button>
                <button type="button" disabled={saving || form.verificationStatus === "pending"} onClick={() => void submitProfile()} className="rounded-lg bg-[#00A6A6] px-5 py-2.5 font-semibold text-white disabled:opacity-50">
                  {form.verificationStatus === "pending" ? "Under review" : saving ? "Submitting..." : "Submit for review"}
                </button>
              </div>
              <p className="text-xs text-[#667085]">Only profiles approved by Advisora will be visible in public search.</p>
            </form>
          )}
        </>
      )}
    </main>
  );
}
