"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

const categoryLabels: Record<string, string> = {
  legal: "Legal professional",
  accounting: "Accountant",
  tax: "Tax consultant",
};

export default function ProfessionalProfilePage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getProfessionalProfile(params.id)
      .then(({ profile: result }) => setProfile(result))
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  const sendEnquiry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const result = await api.createProfessionalEnquiry(params.id, message);
      setNotice(result.message || "Your enquiry has been sent.");
      setMessage("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not send your enquiry.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="py-16 text-center text-[#667085]">Loading profile...</p>;
  if (error || !profile) {
    return <main className="mx-auto max-w-3xl px-4 py-16 text-center"><p role="alert" className="text-[#667085]">{error || "Profile not found"}</p><Link href="/professionals" className="mt-4 inline-block font-semibold text-[#00A6A6]">Back to professionals</Link></main>;
  }

  const profileOwner = profile.userId;
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link href={`/professionals?category=${profile.category}`} className="text-sm font-semibold text-[#00A6A6] hover:underline">← Back to {categoryLabels[profile.category]}s</Link>
      <article className="mt-6 rounded-xl border border-[#E5EAF0] bg-white p-6 sm:p-10">
        <div className="flex flex-wrap items-center gap-4">
          {profileOwner?.avatar ? <img src={profileOwner.avatar} alt="" className="h-16 w-16 rounded-full object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1B2A4A] text-xl font-bold text-white">{profileOwner?.firstName?.[0]}{profileOwner?.lastName?.[0]}</div>}
          <div>
            <p className="text-sm font-semibold text-[#00A6A6]">{categoryLabels[profile.category]}</p>
            <h1 className="text-2xl font-bold text-[#1B2A4A]">{profileOwner?.firstName} {profileOwner?.lastName}</h1>
            <p className="text-[#667085]">{profile.professionalTitle}</p>
            <p className="mt-1 text-sm text-[#667085]">{profile.city}, {profile.state}</p>
          </div>
        </div>
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-[#1B2A4A]">About</h2>
          <p className="mt-2 whitespace-pre-wrap leading-relaxed text-[#475569]">{profile.bio}</p>
        </section>
        {[
          ["Qualifications", profile.qualifications],
          ["Areas of expertise", profile.specializations],
          ["Services", profile.services],
        ].map(([label, values]) => (
          <section key={label as string} className="mt-6">
            <h2 className="text-lg font-semibold text-[#1B2A4A]">{label}</h2>
            <ul className="mt-2 list-inside list-disc space-y-1 text-[#475569]">
              {(values as string[]).map((value) => <li key={value}>{value}</li>)}
            </ul>
          </section>
        ))}
        {profile.professionalBody && <p className="mt-6 text-sm text-[#475569]"><strong>Professional body:</strong> {profile.professionalBody}</p>}
        <p className="mt-2 text-sm text-[#475569]"><strong>Experience:</strong> {profile.yearsOfExperience} years</p>
        <p className={`mt-4 text-sm font-semibold ${profile.isAvailable ? "text-green-700" : "text-[#667085]"}`}>{profile.isAvailable ? "Available for new enquiries" : "Not currently available"}</p>
        {profile.isAvailable && user?.role === "client" && (
          <form onSubmit={sendEnquiry} className="mt-8 border-t border-[#E5EAF0] pt-6">
            <h2 className="text-lg font-semibold text-[#1B2A4A]">Contact this professional</h2>
            <label className="mt-3 block text-sm font-medium text-[#344054]">
              Tell them what support you need
              <textarea required maxLength={2000} rows={4} value={message} onChange={(event) => setMessage(event.target.value)} className="mt-1 w-full rounded-lg border border-[#D0D5DD] px-3 py-2.5" />
            </label>
            {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
            {notice && <p role="status" className="mt-2 text-sm text-green-700">{notice}</p>}
            <button type="submit" disabled={submitting} className="mt-3 rounded-lg bg-[#00A6A6] px-5 py-2.5 font-semibold text-white disabled:opacity-50">{submitting ? "Sending..." : "Send enquiry"}</button>
            <p className="mt-2 text-xs text-[#667085]">Initial enquiries are free. Your verified email will be shared with the professional.</p>
          </form>
        )}
        {profile.isAvailable && !user && (
          <p className="mt-8 border-t border-[#E5EAF0] pt-6 text-sm text-[#667085]">Please <Link href="/login" className="font-semibold text-[#00A6A6] hover:underline">sign in</Link> with a verified client account to send an enquiry.</p>
        )}
      </article>
    </main>
  );
}
