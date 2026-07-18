"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

function RegisterPageContent() {
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get("role") || "client";
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    role: defaultRole,
    termsAccepted: false,
    policiesAccepted: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!formData.termsAccepted || !formData.policiesAccepted) {
        setError("You must accept the Terms & Conditions and all platform policies to register.");
        return;
      }
      await register(formData);
      // Show verification notice instead of redirecting
      setError("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 bg-primary/10">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border-2 border-primary/30 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-accent">
            Create Your Account
          </h1>
          <p className="text-gray-600 mt-2">Join Advisora Connect today</p>
        </div>

        {error === "success" ? (
          <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-semibold">Registration successful! 🎉</p>
            <p className="text-sm mt-1">
              Please check your email to verify your account.               You&apos;ll need to
              verify your email before logging in.
            </p>
          </div>
        ) : (
          error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-accent mb-2">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white border-2 border-primary rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/30 focus:border-primary-dark text-accent placeholder-gray-400"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-accent mb-2">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white border-2 border-primary rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/30 focus:border-primary-dark text-accent placeholder-gray-400"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-accent mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-white border-2 border-primary rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/30 focus:border-primary-dark text-accent placeholder-gray-400"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-accent mb-2">
              Phone (Optional)
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border-2 border-primary rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/30 focus:border-primary-dark text-accent placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-accent mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-white border-2 border-primary rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/30 focus:border-primary-dark text-accent placeholder-gray-400"
              placeholder="At least 6 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-accent mb-2">
              I am a...
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border-2 border-primary rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/30 focus:border-primary-dark text-accent"
            >
              <option value="client">Client looking for legal help</option>
              <option value="lawyer">Lawyer / Legal Professional</option>
            </select>
          </div>

          <div className="space-y-3 p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                name="termsAccepted"
                checked={formData.termsAccepted}
                onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                className="mt-1 w-5 h-5 text-primary border-primary rounded focus:ring-2 focus:ring-primary-dark"
              />
              <label className="text-sm text-accent">
                I have read and agree to the{' '}
                <a href="/terms-of-use" target="_blank" className="font-bold text-accent underline hover:text-accent/80">
                  Terms of Use
                </a>,{' '}
                <a href="/privacy-policy" target="_blank" className="font-bold text-accent underline hover:text-accent/80">
                  Privacy Policy
                </a>, and{' '}
                <a href="/data-protection" target="_blank" className="font-bold text-accent underline hover:text-accent/80">
                  Data Protection Policy
                </a>.
              </label>
            </div>
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                name="policiesAccepted"
                checked={formData.policiesAccepted}
                onChange={(e) => setFormData({ ...formData, policiesAccepted: e.target.checked })}
                className="mt-1 w-5 h-5 text-primary border-primary rounded focus:ring-2 focus:ring-primary-dark"
              />
              <label className="text-sm text-accent">
                I have read and agree to the{' '}
                <a href="/code-of-conduct" target="_blank" className="font-bold text-accent underline hover:text-accent/80">
                  Code of Conduct
                </a>{' '}
                and all other applicable platform policies.
              </label>
            </div>
          </div>

          {error !== "success" && (
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-white py-3.5 rounded-lg hover:bg-accent/90 font-bold text-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          )}
        </form>

        <p className="text-center text-gray-600 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-accent font-bold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 bg-primary/10">
          <div className="text-accent">Loading...</div>
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
