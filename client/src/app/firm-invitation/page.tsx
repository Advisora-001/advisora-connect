"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

function InvitationContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const { user, loading } = useAuth();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const accept = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const result = await api.acceptFirmInvitation(token);
      setMessage(result.message || "Invitation accepted.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not accept this invitation.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <section className="rounded-xl border border-[#E5EAF0] bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-[#1B2A4A]">Firm invitation</h1>
        {!token && <p className="mt-4 text-sm text-red-700">This invitation link is missing its token.</p>}
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {message && <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</p>}
        {!loading && !user && token && (
          <div className="mt-5 space-y-3">
            <p className="text-sm text-[#667085]">Sign in or create an account using the email address that received this invitation, then return to this link.</p>
            <div className="flex justify-center gap-3">
              <Link href="/login" className="rounded-lg bg-[#1B2A4A] px-4 py-2 font-semibold text-white">Sign in</Link>
              <Link href="/register?role=professional" className="rounded-lg border border-[#D0D5DD] px-4 py-2 font-semibold text-[#344054]">Create account</Link>
            </div>
          </div>
        )}
        {user && token && !message && (
          <div className="mt-5">
            <p className="text-sm text-[#667085]">Signed in as {user.email}. Accept the invitation to join the firm workspace.</p>
            <button type="button" disabled={saving} onClick={() => void accept()} className="mt-4 rounded-lg bg-[#00A6A6] px-5 py-2.5 font-semibold text-white disabled:opacity-50">
              {saving ? "Accepting..." : "Accept invitation"}
            </button>
          </div>
        )}
        {message && <Link href="/dashboard/professional" className="mt-5 inline-block font-semibold text-[#00A6A6] hover:underline">Go to professional dashboard</Link>}
      </section>
    </main>
  );
}

export default function FirmInvitationPage() {
  return <Suspense fallback={<main className="p-12 text-center text-[#667085]">Loading invitation...</main>}><InvitationContent /></Suspense>;
}
