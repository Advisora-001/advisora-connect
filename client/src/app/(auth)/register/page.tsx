"use client";

import React, { Suspense, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

// Validation helpers
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "At least 1 uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "At least 1 lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "At least 1 number", test: (p) => /\d/.test(p) },
  { label: "At least 1 special character (@$!%*#?&)", test: (p) => /[@$!%*#?&]/.test(p) },
];

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: "", color: "bg-gray-200" };
  const passed = passwordRequirements.filter((req) => req.test(password)).length;
  if (passed <= 2) return { score: 25, label: "Weak", color: "bg-red-500" };
  if (passed <= 3) return { score: 50, label: "Fair", color: "bg-orange-500" };
  if (passed <= 4) return { score: 75, label: "Good", color: "bg-yellow-500" };
  return { score: 100, label: "Strong", color: "bg-green-500" };
}

function generateStrongPassword(): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "@$!%*#?&";
  const all = uppercase + lowercase + numbers + special;

  let password = "";
  // Ensure at least one of each required character type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill remaining with random characters to reach 12-16 length
  const remainingLength = Math.floor(Math.random() * 5) + 8; // 8-12 extra chars
  for (let i = 0; i < remainingLength; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle the password characters
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

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
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [emailError, setEmailError] = useState("");

  const passwordStrength = getPasswordStrength(formData.password);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validate email in real-time
    if (name === "email") {
      if (value && !EMAIL_REGEX.test(value)) {
        setEmailError("Please enter a valid email address");
      } else {
        setEmailError("");
      }
    }
  };

  const handleSuggestPassword = useCallback(() => {
    const newPassword = generateStrongPassword();
    setFormData((prev) => ({ ...prev, password: newPassword }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate email format
    if (!EMAIL_REGEX.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    // Validate password strength
    if (!PASSWORD_REGEX.test(formData.password)) {
      setError("Password must be at least 8 characters with uppercase, lowercase, number, and special character");
      return;
    }

    if (!formData.termsAccepted || !formData.policiesAccepted) {
      setError("You must accept the Terms & Conditions and all platform policies to register.");
      return;
    }

    setLoading(true);

    try {
      await register(formData);
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
              Please check your email to verify your account.               You'll need to
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
              className={`w-full px-4 py-3 bg-white border-2 rounded-lg focus:outline-none focus:ring-4 text-accent placeholder-gray-400 ${
                emailError
                  ? "border-red-500 focus:ring-red-200 focus:border-red-500"
                  : formData.email && !emailError
                    ? "border-green-500 focus:ring-green-200 focus:border-green-500"
                    : "border-primary focus:ring-primary/30 focus:border-primary-dark"
              }`}
              placeholder="you@example.com"
            />
            {emailError && (
              <p className="text-red-500 text-xs mt-1">{emailError}</p>
            )}
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
            <div className="relative">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                required
                className={`w-full px-4 py-3 bg-white border-2 rounded-lg focus:outline-none focus:ring-4 text-accent placeholder-gray-400 ${
                  formData.password && PASSWORD_REGEX.test(formData.password)
                    ? "border-green-500 focus:ring-green-200 focus:border-green-500"
                    : formData.password
                      ? "border-red-500 focus:ring-red-200 focus:border-red-500"
                      : "border-primary focus:ring-primary/30 focus:border-primary-dark"
                }`}
                placeholder="Create a strong password"
              />
            </div>

            {/* Password strength bar */}
            {formData.password && (
              <div className="mt-2">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: `${passwordStrength.score}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Strength: {passwordStrength.label}
                </p>
              </div>
            )}

            {/* Password requirements list */}
            {(passwordFocused || formData.password.length > 0) && (
              <div className="mt-2 space-y-1">
                {passwordRequirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <span className={req.test(formData.password) ? "text-green-600" : "text-gray-400"}>
                      {req.test(formData.password) ? "✓" : "○"}
                    </span>
                    <span className={req.test(formData.password) ? "text-green-700" : "text-gray-500"}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Suggest Password button */}
            <button
              type="button"
              onClick={handleSuggestPassword}
              className="mt-2 text-sm text-accent font-semibold hover:underline focus:outline-none"
            >
              Suggest a strong password
            </button>
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
                </a>, and{" "}
                <a href="/professional-onboarding-agreement" target="_blank" className="font-bold text-accent underline hover:text-accent/80">
                  Professional Onboarding Agreement
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