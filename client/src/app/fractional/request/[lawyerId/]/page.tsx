"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { useRequestFractionalGC } from "@/hooks/useFractional";
import { useProfessional } from "@/hooks/useProfessionals";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@/components/ui";
import { showToast } from "@/components/ui/Toaster";

const companyStages = [
  "Pre-seed/Seed",
  "Series A",
  "Series B+",
  "Growth",
  "Enterprise",
  "Mature",
];

const industries = [
  "SaaS",
  "FinTech",
  "Healthcare",
  "E-commerce",
  "Manufacturing",
  "Real Estate",
  "Education",
  "Non-profit",
  "Other",
];

const schema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  companyStage: z.string().min(1, "Company stage is required"),
  industry: z.string().min(1, "Industry is required"),
  legalNeeds: z.string().min(50, "Please describe your legal needs (minimum 50 characters)"),
  budgetRange: z.string().optional(),
  preferredStartDate: z.string().optional(),
  message: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function FractionalRequestPage() {
  const params = useParams();
  const lawyerId = params.lawyerId as string;
  const router = useRouter();
  const { user } = useAuth();
  const { data: professional, isLoading } = useProfessional(lawyerId, !!lawyerId);
  const requestMutation = useRequestFractionalGC();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      budgetRange: "",
      preferredStartDate: "",
      message: "",
    },
  });

  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "client") {
      router.push("/dashboard/client");
      return;
    }
  }, [user, router]);

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      await requestMutation.mutateAsync({
        lawyerId,
        ...data,
      });
      router.push("/fractional/my-proposals");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit request");
    }
  };

  if (!professional) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <div className="animate-spin w-10 h-10 border-2 border-[#1B2A4A] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const fractionalGC = professional.fractionalGC;
  const isFractionalAvailable = fractionalGC?.isAvailable;

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <section className="bg-[#1B2A4A] text-white py-12 md:py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="inline-block bg-[#00A6A6]/20 text-[#00A6A6] px-4 py-1.5 rounded-full text-sm font-semibold mb-6 tracking-wide uppercase">
              Fractional GC Request
            </span>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-4">
              Request Fractional GC Services
            </h1>
            <p className="text-lg md:text-xl text-white/70 leading-relaxed max-w-2xl mx-auto">
              Engage {professional.userId?.firstName} {professional.userId?.lastName} as your part-time General Counsel
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-6">
        {/* Lawyer Info Card */}
        <Card className="mb-6">
          <div className="flex items-center gap-4 p-4 bg-[#F5F7FA] rounded-lg border border-[#E5EAF0]">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-[#1B2A4A] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {professional.photo ? (
                <img src={professional.photo} alt={professional.userId?.firstName} className="w-full h-full object-cover" />
              ) : (
                <span>{professional.userId?.firstName?.[0]}{professional.userId?.lastName?.[0]}</span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[#1B2A4A]">{professional.userId?.firstName} {professional.userId?.lastName}</h3>
              <p className="text-sm text-[#667085]">{professional.city}, {professional.state}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {(professional.practiceAreas || professional.specializations || [])?.slice(0, 3).map((area: string) => (
                  <Badge key={area} variant="info" size="xs">{area}</Badge>
                ))}
              </div>
            </div>
            {fractionalGC?.monthlyRetainerMin && fractionalGC?.monthlyRetainerMax && (
              <div className="text-right">
                <p className="text-sm text-[#667085]">Monthly Retainer</p>
                <p className="font-bold text-[#1B2A4A]">₦{fractionalGC.monthlyRetainerMin.toLocaleString()} - ₦{fractionalGC.monthlyRetainerMax.toLocaleString()}</p>
                {fractionalGC.hoursPerMonth && (
                  <p className="text-xs text-[#94A3B8]">{fractionalGC.hoursPerMonth} hrs/month</p>
                )}
              </div>
            )}
          </div>
        </Card>

        {!isFractionalAvailable && (
          <div className="mb-6 p-4 bg-[#FEF2F2] border border-[#FECACA]/50 rounded-lg text-center">
            <p className="font-semibold text-[#991B1B]">Fractional GC Services Not Currently Available</p>
            <p className="text-sm text-[#991B1B] mt-1">This lawyer is not currently accepting new fractional GC engagements.</p>
          </div>
        )}

        {/* Request Form */}
        {isFractionalAvailable && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Company Details</CardTitle>
                <CardDescription>Help the lawyer understand your business and legal needs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <Input label="Company Name *" {...register("companyName")} error={errors.companyName?.message} placeholder="e.g., Acme Inc." />

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Company Stage *</label>
                    <select {...register("companyStage")} className="w-full px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] bg-white text-sm" error={errors.companyStage?.message}>
                      <option value="">Select stage</option>
                      {companyStages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
                    </select>
                    {errors.companyStage && <p className="mt-1 text-sm text-[#EF4444]">{errors.companyStage.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Industry *</label>
                    <select {...register("industry")} className="w-full px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] bg-white text-sm" error={errors.industry?.message}>
                      <option value="">Select industry</option>
                      {industries.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                    </select>
                    {errors.industry && <p className="mt-1 text-sm text-[#EF4444]">{errors.industry.message}</p>}
                  </div>
                </div>

                <Input label="Budget Range (₦/month)" {...register("budgetRange")} placeholder="e.g., ₦500,000 - ₦1,000,000" />

                <Input label="Preferred Start Date" type="date" {...register("preferredStartDate")} />

                <div>
                  <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Legal Needs *</label>
                  <textarea
                    {...register("legalNeeds")}
                    rows={5}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm resize-none ${errors.legalNeeds ? 'border-[#EF4444]' : 'border-[#E5EAF0]'}`}
                    placeholder="Describe your legal needs in detail. What specific areas do you need help with? (e.g., contract review, compliance, fundraising, employment law, IP protection, board governance, etc.)"
                  />
                  {errors.legalNeeds && <p className="mt-1 text-sm text-[#EF4444]">{errors.legalNeeds.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Additional Message (Optional)</label>
                  <textarea
                    {...register("message")}
                    rows={3}
                    className="w-full px-4 py-3 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm resize-none"
                    placeholder="Any additional context, urgency, or specific requirements..."
                  />
                </div>
              </CardContent>
            </Card>

            {error && (
              <div className="p-4 bg-[#FEF2F2] border border-[#FECACA]/50 rounded-lg text-[#991B1B]">
                {error}
              </div>
            )}

            {/* Important Notes */}
            <div className="bg-[#FFFBEB] border border-[#F59E0B]/20 rounded-xl p-5">
              <h4 className="font-semibold text-[#92400E] mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                Important Notes
              </h4>
              <ul className="space-y-2 text-sm text-[#92400E]">
                <li className="flex items-start gap-2">• <span>Monthly retainer range: ₦{fractionalGC?.monthlyRetainerMin?.toLocaleString() || 0} - ₦{fractionalGC?.monthlyRetainerMax?.toLocaleString() || 0}</span></li>
                <li className="flex items-start gap-2">• <span>Hours included: {fractionalGC?.hoursPerMonth || 0} hours/month</span></li>
                <li className="flex items-start gap-2">• <span>Minimum engagement: {fractionalGC?.minimumEngagementMonths || 3} months</span></li>
                <li className="flex items-start gap-2">• <span>Platform fee: ₦10,000 (one-time, paid upon proposal acceptance)</span></li>
                <li className="flex items-start gap-2">• <span>Lawyer will review and send a proposal within 5 business days</span></li>
                <li className="flex items-start gap-2">• <span>Proposal valid for 14 days. Payment required to activate engagement.</span></li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button type="submit" variant="primary" size="lg" disabled={requestMutation.isPending} className="flex-1">
                {requestMutation.isPending ? "Submitting Request..." : "Submit Request"}
              </Button>
              <Link href="/professionals" className="inline-flex items-center justify-center px-8 py-3.5 border-2 border-[#E5EAF0] text-[#667085] rounded-lg hover:border-[#00A6A6] hover:text-[#00A6A6] transition-colors font-semibold">
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}