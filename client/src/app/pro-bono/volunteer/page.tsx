"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRegisterVolunteerLawyer } from "@/hooks/useProBono";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { showToast } from "@/components/ui/Toaster";

const legalCategories = [
  { value: 'domestic_violence', label: 'Domestic Violence and Abuse' },
  { value: 'sexual_abuse', label: 'Sexual Abuse, Harassment and Exploitation' },
  { value: 'child_abuse', label: 'Child Abuse, Neglect and Safeguarding' },
  { value: 'child_custody', label: 'Child Custody, Maintenance and Welfare' },
  { value: 'women_rights', label: 'Protection of Rights of Women and Children' },
  { value: 'exceptional_hardship', label: 'Exceptional Hardship / Urgent Rights Violations' },
  { value: 'other', label: 'Other' },
];

const licenseTypes = [
  { value: 'scn', label: 'SCN (Supreme Court Number)' },
  { value: 'bar_number', label: 'Bar Number' },
  { value: 'practicing_license', label: 'Practicing License' },
  { value: 'other', label: 'Other' },
];

const commitmentLevels = [
  { value: 'occasional', label: 'Occasional (1-2 cases per year)' },
  { value: 'regular', label: 'Regular (1-2 cases per month)' },
  { value: 'dedicated', label: 'Dedicated (3+ cases per month)' },
];

const consultationModes = [
  { value: 'video', label: 'Video Consultation' },
  { value: 'audio', label: 'Audio/Phone Consultation' },
  { value: 'in-person', label: 'In-Person Consultation' },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1950 + 1 }, (_, i) => (currentYear - i).toString());

const schema = z.object({
  // Personal info
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is required"),

  // Licensing
  licenseType: z.string().min(1, "License type is required"),
  licenseNumber: z.string().min(1, "License number is required"),
  licensingBody: z.string().min(1, "Licensing body is required"),
  yearOfCall: z.string().min(1, "Year of call is required"),
  jurisdiction: z.string().min(1, "Jurisdiction is required"),
  isCurrentlyPracticing: z.boolean().default(true),

  // Practice areas
  practiceAreas: z.array(z.string()).min(1, "Select at least one practice area"),

  // Volunteering preferences
  preferredCategories: z.array(z.string()).min(1, "Select at least one preferred category"),
  maxCasesPerMonth: z.number().min(1, "Minimum 1 case per month").max(20, "Maximum 20 cases per month").default(2),
  availabilityHoursPerWeek: z.number().min(1, "Minimum 1 hour per week").max(40, "Maximum 40 hours per week").default(5),
  preferredConsultationModes: z.array(z.string()).min(1, "Select at least one consultation mode"),
  languages: z.array(z.string()).optional(),

  // Commitment
  commitmentLevel: z.string().min(1, "Commitment level is required"),
  willingToMentor: z.boolean().default(false),

  // Declarations
  noDisciplinaryActions: z.literal(true, { errorMap: () => ({ message: "You must confirm no disciplinary actions" }) }),
  noConflictsOfInterest: z.literal(true, { errorMap: () => ({ message: "You must confirm no conflicts of interest" }) }),
  understandsProBonoObligations: z.literal(true, { errorMap: () => ({ message: "You must confirm understanding of pro bono obligations" }) }),
  professionalIndemnityInsurance: z.boolean().default(false),
});

type FormData = z.infer<typeof schema>;

export default function ProBonoVolunteerPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const submitMutation = useRegisterVolunteerLawyer();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      jurisdiction: "Nigeria",
      isCurrentlyPracticing: true,
      maxCasesPerMonth: 2,
      availabilityHoursPerWeek: 5,
      preferredConsultationModes: ["video"],
      commitmentLevel: "regular",
      willingToMentor: false,
      professionalIndemnityInsurance: false,
    },
  });

  const practiceAreas = watch("practiceAreas");
  const preferredCategories = watch("preferredCategories");
  const preferredConsultationModes = watch("preferredConsultationModes");
  const languagesInput = watch("languages") || [];

  const toggleArrayItem = (fieldName: string, value: string) => {
    const current = watch(fieldName) || [];
    const updated = current.includes(value) ? current.filter((v: string) => v !== value) : [...current, value];
    setValue(fieldName, updated, { shouldValidate: true });
  };

  const handleLanguageAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && e.currentTarget.value.trim()) {
      e.preventDefault();
      const newLang = e.currentTarget.value.trim();
      if (!languagesInput.includes(newLang)) {
        setValue("languages", [...languagesInput, newLang], { shouldValidate: true });
      }
      e.currentTarget.value = "";
    }
  };

  const removeLanguage = (lang: string) => {
    setValue("languages", languagesInput.filter((l: string) => l !== lang), { shouldValidate: true });
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const onSubmit = async (data: FormData) => {
    await submitMutation.mutateAsync({
      ...data,
      yearOfCall: parseInt(data.yearOfCall, 10),
      practiceAreas: data.practiceAreas,
      preferredCategories: data.preferredCategories,
      preferredConsultationModes: data.preferredConsultationModes,
      languages: data.languages || [],
    });
  };

  const steps = [
    { number: 1, title: "Professional Details", desc: "Your licensing and practice information" },
    { number: 2, title: "Volunteering Preferences", desc: "What cases and how you'd like to help" },
    { number: 3, title: "Commitment & Declarations", desc: "Your availability and professional commitments" },
    { number: 4, title: "Review & Submit", desc: "Confirm and send your registration" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Progress Header */}
      <section className="bg-white border-b border-[#E5EAF0] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#667085]">Step {currentStep} of 4</p>
              <h1 className="text-xl font-bold text-[#1B2A4A] mt-1">{steps[currentStep - 1].title}</h1>
              <p className="text-sm text-[#667085]">{steps[currentStep - 1].desc}</p>
            </div>
            <div className="hidden md:flex items-center gap-2">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index + 1 < currentStep ? 'bg-[#5DBB63] text-white' :
                    index + 1 === currentStep ? 'bg-[#00A6A6] text-white' :
                    'bg-[#E5EAF0] text-[#94A3B8]'
                  }`}>
                    {index + 1 < currentStep ? '✓' : step.number}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-1 mx-2 ${
                      index + 1 < currentStep ? 'bg-[#5DBB63]' : 'bg-[#E5EAF0]'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl mx-auto px-4 py-8">
        {/* Step 1: Professional Details */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Professional Information</CardTitle>
                <CardDescription>Please provide your licensing and practice details for verification.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <Input label="First Name *" {...register("firstName")} error={errors.firstName?.message} placeholder="e.g., John" />
                  <Input label="Last Name *" {...register("lastName")} error={errors.lastName?.message} placeholder="e.g., Adebayo" />
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  <Input label="Email Address *" type="email" {...register("email")} error={errors.email?.message} placeholder="john@lawfirm.com" />
                  <Input label="Phone Number *" type="tel" {...register("phone")} error={errors.phone?.message} placeholder="+234 800 000 0000" />
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">License Type *</label>
                    <select {...register("licenseType")} className="w-full px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] bg-white text-sm" error={errors.licenseType?.message}>
                      <option value="">Select license type</option>
                      {licenseTypes.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                    {errors.licenseType && <p className="mt-1 text-sm text-[#EF4444]">{errors.licenseType.message}</p>}
                  </div>
                  <Input label="License Number *" {...register("licenseNumber")} error={errors.licenseNumber?.message} placeholder="e.g., SCN/12345" />
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <Input label="Licensing Body *" {...register("licensingBody")} error={errors.licensingBody?.message} placeholder="e.g., Nigerian Bar Association" />
                  <div>
                    <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Year of Call *</label>
                    <select {...register("yearOfCall")} className="w-full px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] bg-white text-sm" error={errors.yearOfCall?.message}>
                      <option value="">Select year</option>
                      {years.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                    {errors.yearOfCall && <p className="mt-1 text-sm text-[#EF4444]">{errors.yearOfCall.message}</p>}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <Input label="Jurisdiction *" {...register("jurisdiction")} error={errors.jurisdiction?.message} placeholder="e.g., Nigeria" defaultValue="Nigeria" />
                  <div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" {...register("isCurrentlyPracticing")} className="w-5 h-5 text-[#00A6A6] border-[#E5EAF0] rounded focus:ring-2 focus:ring-[#00A6A6]/20" />
                      <span className="text-sm font-semibold text-[#1B2A4A]">Currently Practicing</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Practice Areas * (select all that apply)</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Corporate & Commercial Law", "Family Law", "Criminal Law", "Employment & Labour Law",
                      "Property & Real Estate", "Human Rights Law", "Child Law", "Tax Law",
                      "Immigration Law", "Alternative Dispute Resolution", "Civil Litigation",
                      "Intellectual Property", "Banking & Finance", "Other"
                    ].map((area) => (
                      <label key={area} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E5EAF0] rounded-lg cursor-pointer hover:border-[#00A6A6]/50 transition-colors">
                        <input type="checkbox" value={area} checked={practiceAreas.includes(area)} onChange={(e) => toggleArrayItem("practiceAreas", area)} className="w-4 h-4 text-[#00A6A6] border-[#E5EAF0] rounded focus:ring-2 focus:ring-[#00A6A6]/20" />
                        <span className="text-sm text-[#475569]">{area}</span>
                      </label>
                    ))}
                  </div>
                  {errors.practiceAreas && <p className="mt-1 text-sm text-[#EF4444]">{errors.practiceAreas.message}</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Volunteering Preferences */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Volunteering Preferences</CardTitle>
                <CardDescription>Tell us what types of cases you'd like to handle and how you prefer to work.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Preferred Case Categories * (select all that apply)</label>
                  <div className="space-y-2">
                    {legalCategories.map((cat) => (
                      <label key={cat.value} className="flex items-center gap-3 p-3 bg-white border border-[#E5EAF0] rounded-lg cursor-pointer hover:border-[#00A6A6]/50 transition-colors">
                        <input type="checkbox" value={cat.value} checked={preferredCategories.includes(cat.value)} onChange={(e) => toggleArrayItem("preferredCategories", cat.value)} className="w-5 h-5 text-[#00A6A6] border-[#E5EAF0] rounded focus:ring-2 focus:ring-[#00A6A6]/20" />
                        <span className="text-sm text-[#475569]">{cat.label}</span>
                      </label>
                    ))}
                  </div>
                  {errors.preferredCategories && <p className="mt-1 text-sm text-[#EF4444]">{errors.preferredCategories.message}</p>}
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Max Cases Per Month *</label>
                    <input type="number" {...register("maxCasesPerMonth", { valueAsNumber: true })} min="1" max="20" className="w-full px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm" error={errors.maxCasesPerMonth?.message} />
                    {errors.maxCasesPerMonth && <p className="mt-1 text-sm text-[#EF4444]">{errors.maxCasesPerMonth.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Availability Hours Per Week *</label>
                    <input type="number" {...register("availabilityHoursPerWeek", { valueAsNumber: true })} min="1" max="40" className="w-full px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm" error={errors.availabilityHoursPerWeek?.message} />
                    {errors.availabilityHoursPerWeek && <p className="mt-1 text-sm text-[#EF4444]">{errors.availabilityHoursPerWeek.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Preferred Consultation Modes * (select all that apply)</label>
                  <div className="flex flex-wrap gap-3">
                    {consultationModes.map((mode) => (
                      <label key={mode.value} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#E5EAF0] rounded-lg cursor-pointer hover:border-[#00A6A6]/50 transition-colors">
                        <input type="checkbox" value={mode.value} checked={preferredConsultationModes.includes(mode.value)} onChange={(e) => toggleArrayItem("preferredConsultationModes", mode.value)} className="w-4 h-4 text-[#00A6A6] border-[#E5EAF0] rounded focus:ring-2 focus:ring-[#00A6A6]/20" />
                        <span className="text-sm font-medium text-[#475569]">{mode.label}</span>
                      </label>
                    ))}
                  </div>
                  {errors.preferredConsultationModes && <p className="mt-1 text-sm text-[#EF4444]">{errors.preferredConsultationModes.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Languages Spoken</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {languagesInput.map((lang) => (
                      <span key={lang} className="inline-flex items-center gap-1 px-3 py-1 bg-[#00A6A6]/10 text-[#00A6A6] rounded-full text-sm">
                        {lang}
                        <button type="button" onClick={() => removeLanguage(lang)} className="text-[#00A6A6] hover:text-[#008F8F]">×</button>
                      </span>
                    ))}
                  </div>
                  <input type="text" onKeyDown={handleLanguageAdd} placeholder="Type a language and press Enter" className="w-full px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm" />
                  <p className="mt-1 text-xs text-[#94A3B8]">Press Enter to add each language (e.g., English, Yoruba, French, Hausa)</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Commitment & Declarations */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Commitment Level</CardTitle>
                <CardDescription>Help us understand your availability and commitment to pro bono work.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Commitment Level *</label>
                  <div className="space-y-2">
                    {commitmentLevels.map((level) => (
                      <label key={level.value} className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${watch("commitmentLevel") === level.value ? 'border-[#00A6A6] bg-[#00A6A6]/5' : 'border-[#E5EAF0] hover:border-[#00A6A6]/50'}`}>
                        <input type="radio" value={level.value} {...register("commitmentLevel")} className="w-4 h-4 text-[#00A6A6] border-[#E5EAF0] focus:ring-2 focus:ring-[#00A6A6]/20" />
                        <div>
                          <p className="font-semibold text-[#1B2A4A]">{level.label}</p>
                          <p className="text-sm text-[#667085]">
                            {level.value === 'occasional' && 'Suitable for lawyers with limited availability who want to contribute occasionally'}
                            {level.value === 'regular' && 'Standard commitment for most volunteer lawyers - regular but manageable caseload'}
                            {level.value === 'dedicated' && 'For lawyers who want to make pro bono a significant part of their practice'}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.commitmentLevel && <p className="mt-1 text-sm text-[#EF4444]">{errors.commitmentLevel.message}</p>}
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" {...register("willingToMentor")} className="w-5 h-5 text-[#00A6A6] border-[#E5EAF0] rounded focus:ring-2 focus:ring-[#00A6A6]/20" />
                    <div>
                      <p className="font-semibold text-[#1B2A4A]">Willing to Mentor Junior Lawyers</p>
                      <p className="text-sm text-[#667085]">I am open to mentoring or supervising junior volunteer lawyers on pro bono cases.</p>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Professional Declarations</CardTitle>
                <CardDescription>Please confirm the following declarations. These are mandatory for registration.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-[#EFF6FF] border border-[#00A6A6]/20 rounded-xl p-5">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" {...register("noDisciplinaryActions")} className="w-5 h-5 mt-0.5 text-[#00A6A6] border-[#E5EAF0] rounded focus:ring-2 focus:ring-[#00A6A6]/20" />
                    <div>
                      <p className="font-semibold text-[#1B2A4A]">I have no current or past disciplinary actions by any legal regulatory body</p>
                      <p className="text-sm text-[#667085] mt-1">I confirm that I am in good standing with my licensing body and have not been subject to any disciplinary proceedings, sanctions, or disbarment.</p>
                    </div>
                  </label>
                  {errors.noDisciplinaryActions && <p className="mt-2 text-sm text-[#EF4444] pl-8">{errors.noDisciplinaryActions.message}</p>}
                </div>

                <div className="bg-[#EFF6FF] border border-[#00A6A6]/20 rounded-xl p-5">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" {...register("noConflictsOfInterest")} className="w-5 h-5 mt-0.5 text-[#00A6A6] border-[#E5EAF0] rounded focus:ring-2 focus:ring-[#00A6A6]/20" />
                    <div>
                      <p className="font-semibold text-[#1B2A4A]">I have no conflicts of interest that would prevent me from serving pro bono clients</p>
                      <p className="text-sm text-[#667085] mt-1">I agree to conduct conflict checks for each referral and will decline any assignment where a conflict exists or may arise.</p>
                    </div>
                  </label>
                  {errors.noConflictsOfInterest && <p className="mt-2 text-sm text-[#EF4444] pl-8">{errors.noConflictsOfInterest.message}</p>}
                </div>

                <div className="bg-[#EFF6FF] border border-[#00A6A6]/20 rounded-xl p-5">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" {...register("understandsProBonoObligations")} className="w-5 h-5 mt-0.5 text-[#00A6A6] border-[#E5EAF0] rounded focus:ring-2 focus:ring-[#00A6A6]/20" />
                    <div>
                      <p className="font-semibold text-[#1B2A4A]">I understand my professional obligations in pro bono work</p>
                      <p className="text-sm text-[#667085] mt-1">I acknowledge that pro bono work carries the same professional duties as paid work, including competence, diligence, confidentiality, and communication. I will maintain professional indemnity insurance where required.</p>
                    </div>
                  </label>
                  {errors.understandsProBonoObligations && <p className="mt-2 text-sm text-[#EF4444] pl-8">{errors.understandsProBonoObligations.message}</p>}
                </div>

                <div className="bg-[#F5F7FA] border border-[#E5EAF0] rounded-xl p-5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" {...register("professionalIndemnityInsurance")} className="w-5 h-5 text-[#00A6A6] border-[#E5EAF0] rounded focus:ring-2 focus:ring-[#00A6A6]/20" />
                    <div>
                      <p className="font-semibold text-[#1B2A4A]">I have Professional Indemnity Insurance</p>
                      <p className="text-sm text-[#667085]">I currently hold valid professional indemnity insurance that covers pro bono work (recommended but not mandatory).</p>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Review & Submit</CardTitle>
                <CardDescription>Please review your registration details and confirm the declarations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-[#F5F7FA] border border-[#E5EAF0] rounded-xl p-5">
                  <h4 className="font-semibold text-[#1B2A4A] mb-4">Registration Summary</h4>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between"><dt className="text-[#667085]">Name</dt><dd className="font-medium text-[#1B2A4A]">{watch("firstName")} {watch("lastName")}</dd></div>
                    <div className="flex justify-between"><dt className="text-[#667085]">Email</dt><dd className="font-medium text-[#1B2A4A]">{watch("email")}</dd></div>
                    <div className="flex justify-between"><dt className="text-[#667085]">Phone</dt><dd className="font-medium text-[#1B2A4A]">{watch("phone")}</dd></div>
                    <div className="flex justify-between"><dt className="text-[#667085]">License</dt><dd className="font-medium text-[#1B2A4A]">{licenseTypes.find(l => l.value === watch("licenseType"))?.label}: {watch("licenseNumber")}</dd></div>
                    <div className="flex justify-between"><dt className="text-[#667085]">Year of Call</dt><dd className="font-medium text-[#1B2A4A]">{watch("yearOfCall")}</dd></div>
                    <div className="flex justify-between"><dt className="text-[#667085]">Practice Areas</dt><dd className="font-medium text-[#1B2A4A]">{practiceAreas.length} selected</dd></div>
                    <div className="flex justify-between"><dt className="text-[#667085]">Preferred Categories</dt><dd className="font-medium text-[#1B2A4A]">{preferredCategories.length} selected</dd></div>
                    <div className="flex justify-between"><dt className="text-[#667085]">Max Cases/Month</dt><dd className="font-medium text-[#1B2A4A]">{watch("maxCasesPerMonth")}</dd></div>
                    <div className="flex justify-between"><dt className="text-[#667085]">Hours/Week</dt><dd className="font-medium text-[#1B2A4A]">{watch("availabilityHoursPerWeek")}</dd></div>
                    <div className="flex justify-between"><dt className="text-[#667085]">Commitment</dt><dd className="font-medium text-[#1B2A4A]">{commitmentLevels.find(l => l.value === watch("commitmentLevel"))?.label}</dd></div>
                  </dl>
                </div>

                {/* Important Notes */}
                <div className="bg-[#FFFBEB] border border-[#F59E0B]/20 rounded-xl p-5">
                  <h4 className="font-semibold text-[#92400E] mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    Important Reminders
                  </h4>
                  <ul className="space-y-2 text-sm text-[#92400E]">
                    <li className="flex items-start gap-2">• <span>You retain the right to assess each referral and decide whether to accept it.</span></li>
                    <li className="flex items-start gap-2">• <span>All assignments are subject to your professional obligations, availability, and conflict checks.</span></li>
                    <li className="flex items-start gap-2">• <span>Pro bono work carries the same professional duties as paid work.</span></li>
                    <li className="flex items-start gap-2">• <span>Registration is subject to review and approval by the Advisora Impact team.</span></li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-[#E5EAF0]">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            ← Previous
          </Button>
          {currentStep < 4 ? (
            <Button type="button" variant="primary" onClick={nextStep}>
              Next →
            </Button>
          ) : (
            <Button type="submit" variant="primary" size="lg" disabled={isSubmitting || submitMutation.isPending} className="w-full sm:w-auto">
              {submitMutation.isPending ? "Submitting..." : "Submit Registration"}
            </Button>
          )}
        </div>
      </form>

      {/* Info Footer */}
      <div className="max-w-3xl mx-auto px-4 pb-12 text-center text-sm text-[#667085]">
        <p>By submitting this registration, you agree to our <Link href="/terms-of-use" className="text-[#00A6A6] hover:underline">Terms of Use</Link> and <Link href="/privacy-policy" className="text-[#00A6A6] hover:underline">Privacy Policy</Link>.</p>
        <p className="mt-2">Questions? <a href="mailto:probono@advisora-connect.com" className="text-[#00A6A6] hover:underline">Contact the Advisora Impact team</a></p>
      </div>
    </div>
  );
}