"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

function getDashboardPath(role?: string): string {
  if (role === "lawyer") return "/dashboard/lawyer";
  if (role === "admin") return "/admin";
  return "/dashboard/client";
}

function VerifyEmailPageContent() {
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");
  const [role, setRole] = useState<string | undefined>(undefined);
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (verifiedRef.current) return;
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    verifiedRef.current = true;

    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const verifyUrl = `${apiBaseUrl}/auth/verify-email?token=${encodeURIComponent(token)}`;

    fetch(verifyUrl, { credentials: "include" })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
          if (data.user?.role) {
            setRole(data.user.role);
          }
          // The server set auth cookies on success; refresh the auth context
          // so the app treats the user as logged in.
          try {
            await refreshUser();
          } catch {
            // If the context refresh fails the user can still click a link.
          }
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      });
  }, [token, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        {status === "loading" && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900">
              Verifying your email...
            </h2>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Email Verified!
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <Link
                href={getDashboardPath(role)}
                className="block bg-blue-900 text-white px-6 py-3 rounded-md hover:bg-blue-800 transition"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/login"
                className="block text-blue-900 underline"
              >
                Go to Login instead
              </Link>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-red-500 text-5xl mb-4">✕</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verification Failed
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <Link
                href="/login"
                className="block bg-blue-900 text-white px-6 py-3 rounded-md hover:bg-blue-800 transition"
              >
                Go to Login
              </Link>
              <p className="text-sm text-gray-500">
                Need a new link?{" "}
                <Link
                  href="/resend-verification"
                  className="text-blue-900 underline"
                >
                  Resend verification email
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
          <div className="text-blue-900">Loading...</div>
        </div>
      }
    >
      <VerifyEmailPageContent />
    </Suspense>
  );
}
