"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useSubmitProBonoApplication } from "@/hooks/useProBono";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@/components/ui";
import { showToast } from "@/components/ui/Toaster";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

const legalIssueCategories = [
  { value: 'domestic_violence', label: 'Domestic Violence and Abuse' },
  { value: 'sexual_abuse', label: 'Sexual Abuse, Harassment and Exploitation' },
  { value: 'child_abuse', label: 'Child Abuse, Neglect and Safeguarding' },
  { value: 'child_custody', label: 'Child Custody, Maintenance and Welfare' },
  { value: 'women_rights', label: 'Protection of Rights of Women and Children' },
  { value: 'exceptional_hardship', label: 'Exceptional Hardship / Urgent Rights Violations' },
  { value: 'other', label: 'Other' },
];

const employmentStatuses = [
  { value: 'employed', label: 'Employed' },
  { value: 'unemployed', label: 'Unemployed' },
  { value: 'self_employed', label: 'Self-Employed' },
  { value: 'student', label: 'Student' },
  { value: 'retired', label: 'Retired' },
  { value: 'other', label: 'Other' },
];

const urgencyLevels = [
  { value: 'low', label: 'Low - No immediate deadline' },
  { value: 'medium', label: 'Medium - Weeks to respond' },
  { value: 'high', label: 'High - Days to respond' },
  { value: 'critical', label: 'Critical - Immediate/Urgent' },
];

const genders = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const statesList = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi",
  "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun",
  "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

const schema = z.object({
  // Personal info
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is required"),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),

  // Location
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().default("Nigeria"),

  // Financial circumstances
  employmentStatus: z.string().min(1, "Employment status is required"),
  monthlyIncome: z.number().min(0).optional().nullable(),
  dependantsCount: z.number().min(0).default(0),
  financialHardshipDetails: z.string().min(50, "Please provide at least 50 characters describing your financial hardship"),

  // Legal issue
  legalIssueCategory: z.string().min(1, "Legal issue category is required"),
  legalIssueDescription: z.string().min(100, "Please provide at least 100 characters describing your legal issue"),
  urgencyLevel: z.string().min(1, "Urgency level is required"),
  hasExistingLegalProceedings: z.boolean().default(false),
  existingProceedingsDetails: z.string().optional(),

  // Supporting documents (handled separately)
  supportingDocuments: z.array(z.any()).optional(),

  // Declarations
  consentToShareInfo: z.literal(true, { errorMap: () => ({ message: "You must consent to share information with volunteer lawyers" }) }),
  consentToContact: z.literal(true, { errorMap: () => ({ message: "You must consent to be contacted about your application" }) }),
  declarationOfTruth: z.literal(true, { errorMap: () => ({ message: "You must declare that the information provided is true" }) }),
});

type FormData = z.infer<typeof schema>;

interface SupportingDocument {
  file: File;
  preview: string;
  id: string;
}

export default function ProBonoApplyPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [supportingDocs, setSupportingDocs] = useState<SupportingDocument[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const submitMutation = useSubmitProBonoApplication();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      country: "Nigeria",
      dependantsCount: 0,
      hasExistingLegalProceedings: false,
      urgencyLevel: "medium",
    },
  });

  const hasExistingProceedings = watch("hasExistingLegalProceedings");

  const handleFileUpload = (files: FileList) => {
    const newFiles = Array.from(files);
    const validFiles = newFiles.filter((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        showToast.error(`${file.name}: File type not allowed. Use PDF, JPG, PNG, DOC, or DOCX`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        showToast.error(`${file.name}: File size exceeds 10MB limit`);
        return false;
      }
      return true;
    });

    if (supportingDocs.length + validFiles.length > MAX_FILES) {
      showToast.error(`Maximum ${MAX_FILES} files allowed`);
      return;
    }

    validFiles.forEach((file) => {
      const preview = URL.createObjectURL(file);
      setSupportingDocs((prev) => [...prev, { file, preview, id: `${Date.now()}-${Math.random()}` }]);
    });
  };

  const removeFile = (id: string) => {
    setSupportingDocs((prev) => prev.filter((doc) => doc.id !== id));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const onSubmit = async (data: FormData) => {
    const docs = supportingDocs.map((doc) => ({
      fileName: doc.file.name,
      fileUrl: doc.preview, // In production, upload to Cloudinary first and use that URL
      fileType: doc.file.type,
      fileSize: doc.file.size,
    }));

    await submitMutation.mutateAsync({ ...data, supportingDocuments: docs, monthlyIncome: data.monthlyIncome || undefined });
  };

  const steps = [
    { number: 1, title: "Personal Details", desc: "Your contact information" },
    { number: 2, title: "Financial Situation", desc: "Help us assess eligibility" },
    { number: 3, title: "Legal Issue", desc: "Details about your case" },
    { number: 4, title: "Review & Submit", desc: "Confirm and send" },
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
        {/* Step 1: Personal Details */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Please provide your contact details so we can reach you about your application.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <Input label="First Name *" {...register("firstName")} error={errors.firstName?.message} placeholder="e.g., Jane" />
                  <Input label="Last Name *" {...register("lastName")} error={errors.lastName?.message} placeholder="e.g., Doe" />
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  <Input label="Email Address *" type="email" {...register("email")} error={errors.email?.message} placeholder="jane@example.com" />
                  <Input label="Phone Number *" type="tel" {...register("phone")} error={errors.phone?.message} placeholder="+234 800 000 0000" />
                </div>
                <div className="grid md:grid-cols-3 gap-5">
                  <Input label="Date of Birth" type="date" {...register("dateOfBirth")} />
                  <div>
                    <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Gender</label>
                    <select {...register("gender")} className="w-full px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] bg-white text-sm">
                      <option value="">Select (optional)</option>
                      {genders.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                  </div>
                  <Input label="State *" {...register("state")} error={errors.state?.message}>
                    <select className="w-full px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] bg-white text-sm" {...register("state")}>
                      <option value="">Select State</option>
                      {statesList.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Input>
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  <Input label="City *" {...register("city")} error={errors.city?.message} placeholder="e.g., Lagos" />
                  <Input label="Country" {...register("country")} disabled defaultValue="Nigeria" />
                </div>
                <Input label="Full Address *" {...register("address")} error={errors.address?.message} placeholder="Street address, building, landmark" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Financial Situation */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Circumstances</CardTitle>
                <CardDescription>This information helps us assess financial need. All information is kept confidential.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Employment Status *</label>
                  <select {...register("employmentStatus")} className="w-full px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] bg-white text-sm" error={errors.employmentStatus?.message}>
                    <option value="">Select employment status</option>
                    {employmentStatuses.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                  </select>
                  {errors.employmentStatus && <p className="mt-1 text-sm text-[#EF4444]">{errors.employmentStatus.message}</p>}
                </div>
                <div className="grid md:grid-cols-3 gap-5">
                  <Input label="Monthly Income (₦)" type="number" {...register("monthlyIncome", { valueAsNumber: true })} placeholder="e.g., 50000" min="0" step="1000" />
                  <Input label="Number of Dependants" type="number" {...register("dependantsCount", { valueAsNumber: true })} placeholder="e.g., 2" min="0" max="20" />
                  <div></div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Financial Hardship Details *</label>
                  <textarea
                    {...register("financialHardshipDetails")}
                    rows={5}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm ${errors.financialHardshipDetails ? 'border-[#EF4444]' : 'border-[#E5EAF0]'}`}
                    placeholder="Please describe your financial situation in detail. Explain why you cannot afford legal services, including any exceptional circumstances, debts, medical expenses, or other factors affecting your ability to pay. Minimum 50 characters."
                  />
                  {errors.financialHardshipDetails && <p className="mt-1 text-sm text-[#EF4444]">{errors.financialHardshipDetails.message}</p>}
                  <p className="mt-1 text-xs text-[#94A3B8]">This helps us understand your financial need and prioritize applications.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Legal Issue */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Legal Issue Details</CardTitle>
                <CardDescription>Tell us about the legal assistance you need. Be as specific as possible.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Legal Issue Category *</label>
                  <select {...register("legalIssueCategory")} className="w-full px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] bg-white text-sm" error={errors.legalIssueCategory?.message}>
                    <option value="">Select the category that best matches your issue</option>
                    {legalIssueCategories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  {errors.legalIssueCategory && <p className="mt-1 text-sm text-[#EF4444]">{errors.legalIssueCategory.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Urgency Level *</label>
                  <select {...register("urgencyLevel")} className="w-full px-4 py-2.5 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] bg-white text-sm" error={errors.urgencyLevel?.message}>
                    {urgencyLevels.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                  </select>
                  {errors.urgencyLevel && <p className="mt-1 text-sm text-[#EF4444]">{errors.urgencyLevel.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Legal Issue Description *</label>
                  <textarea
                    {...register("legalIssueDescription")}
                    rows={6}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm ${errors.legalIssueDescription ? 'border-[#EF4444]' : 'border-[#E5EAF0]'}`}
                    placeholder="Please provide a detailed description of your legal issue. Include: what happened, when, who is involved, what outcome you are seeking, and any deadlines or court dates. Minimum 100 characters."
                  />
                  {errors.legalIssueDescription && <p className="mt-1 text-sm text-[#EF4444]">{errors.legalIssueDescription.message}</p>}
                </div>
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" {...register("hasExistingLegalProceedings")} className="w-5 h-5 text-[#00A6A6] border-[#E5EAF0] rounded focus:ring-2 focus:ring-[#00A6A6]/20" />
                    <span className="text-sm font-semibold text-[#1B2A4A]">I have existing legal proceedings related to this matter</span>
                  </label>
                  {hasExistingProceedings && (
                    <textarea
                      {...register("existingProceedingsDetails")}
                      rows={3}
                      className="mt-3 w-full px-4 py-3 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A6A6]/20 focus:border-[#00A6A6] text-sm"
                      placeholder="Please provide details: court, case number, next hearing date, current stage, etc."
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Supporting Documents</label>
                  <p className="text-sm text-[#667085] mb-3">Upload any relevant documents (court papers, ID, evidence, etc.). Max 5 files, 10MB each. PDF, JPG, PNG, DOC, DOCX allowed.</p>
                  <div
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${dragActive ? 'border-[#00A6A6] bg-[#00A6A6]/5' : 'border-[#E5EAF0]'}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      multiple
                      accept={ALLOWED_TYPES.join(",")}
                      onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <div className="w-12 h-12 bg-[#00A6A6]/10 text-[#00A6A6] rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">📎</div>
                      <p className="font-semibold text-[#1B2A4A]">Drag & drop files here, or click to browse</p>
                      <p className="text-sm text-[#667085] mt-1">Maximum 5 files • 10MB each</p>
                    </label>
                    {supportingDocs.length > 0 && (
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {supportingDocs.map((doc) => (
                          <div key={doc.id} className="flex items-center gap-3 p-3 bg-white border border-[#E5EAF0] rounded-lg">
                            <div className="w-10 h-10 bg-[#F5F7FA] rounded-lg flex items-center justify-center text-lg">
                              {doc.file.type.startsWith('image/') ? (
                                <img src={doc.preview} alt={doc.file.name} className="w-full h-full object-cover rounded" />
                              ) : (
                                '📄'
                              )}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-sm font-medium text-[#1B2A4A] truncate">{doc.file.name}</p>
                              <p className="text-xs text-[#94A3B8]">{(doc.file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <button type="button" onClick={() => removeFile(doc.id)} className="text-[#EF4444] hover:text-[#991B1B] p-1">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
                <CardDescription>Please review your application and accept the declarations below before submitting.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Review Summary */}
                <div className="bg-[#F5F7FA] border border-[#E5EAF0] rounded-xl p-5">
                  <h4 className="font-semibold text-[#1B2A4A] mb-4">Application Summary</h4>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between"><dt className="text-[#667085]">Name</dt><dd className="font-medium text-[#1B2A4A]">{watch("firstName")} {watch("lastName")}</dd></div>
                    <div className="flex justify-between"><dt className="text-[#667085]">Email</dt><dd className="font-medium text-[#1B2A4A]">{watch("email")}</dd></div>
                    <div className="flex justify-between"><dt className="text-[#667085]">Phone</dt><dd className="font-medium text-[#1B2A4A]">{watch("phone")}</dd></div>
                    <div className="flex justify-between"><dt className="text-[#667085]">Location</dt><dd className="font-medium text-[#1B2A4A]">{watch("city")}, {watch("state")}</dd></div>
                    <div className="flex justify-between"><dt className="text-[#667085]">Legal Issue</dt><dd className="font-medium text-[#1B2A4A]">{legalIssueCategories.find(c => c.value === watch("legalIssueCategory"))?.label}</dd></div>
                    <div className="flex justify-between"><dt className="text-[#667085]">Urgency</dt><dd className="font-medium text-[#1B2A4A]">{urgencyLevels.find(u => u.value === watch("urgencyLevel"))?.label}</dd></div>
                    <div className="flex justify-between"><dt className="text-[#667085]">Documents</dt><dd className="font-medium text-[#1B2A4A]">{supportingDocs.length} file(s)</dd></div>
                  </dl>
                </div>

                {/* Declarations */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-[#1B2A4A]">Required Declarations</h4>

                  <div className="bg-[#EFF6FF] border border-[#00A6A6]/20 rounded-xl p-5">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" {...register("consentToShareInfo")} className="w-5 h-5 mt-0.5 text-[#00A6A6] border-[#E5EAF0] rounded focus:ring-2 focus:ring-[#00A6A6]/20" />
                      <div>
                        <p className="font-semibold text-[#1B2A4A]">I consent to my information being shared with volunteer lawyers for case assessment</p>
                        <p className="text-sm text-[#667085] mt-1">Your details will only be shared with lawyers who may be assigned to your case, for the purpose of evaluating and providing legal assistance.</p>
                      </div>
                    </label>
                    {errors.consentToShareInfo && <p className="mt-2 text-sm text-[#EF4444] pl-8">{errors.consentToShareInfo.message}</p>}
                  </div>

                  <div className="bg-[#EFF6FF] border border-[#00A6A6]/20 rounded-xl p-5">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" {...register("consentToContact")} className="w-5 h-5 mt-0.5 text-[#00A6A6] border-[#E5EAF0] rounded focus:ring-2 focus:ring-[#00A6A6]/20" />
                      <div>
                        <p className="font-semibold text-[#1B2A4A]">I consent to being contacted by Advisora Impact regarding my application</p>
                        <p className="text-sm text-[#667085] mt-1">We may contact you by email, phone, or SMS for updates, additional information, or to schedule a consultation.</p>
                      </div>
                    </label>
                    {errors.consentToContact && <p className="mt-2 text-sm text-[#EF4444] pl-8">{errors.consentToContact.message}</p>}
                  </div>

                  <div className="bg-[#FEF2F2] border border-[#FECACA]/50 rounded-xl p-5">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" {...register("declarationOfTruth")} className="w-5 h-5 mt-0.5 text-[#EF4444] border-[#E5EAF0] rounded focus:ring-2 focus:ring-[#EF4444]/20" />
                      <div>
                        <p className="font-semibold text-[#991B1B]">I declare that all information provided in this application is true and accurate to the best of my knowledge</p>
                        <p className="text-sm text-[#991B1B] mt-1">Providing false information may result in your application being rejected and could affect future eligibility.</p>
                      </div>
                    </label>
                    {errors.declarationOfTruth && <p className="mt-2 text-sm text-[#EF4444] pl-8">{errors.declarationOfTruth.message}</p>}
                  </div>
                </div>

                {/* Important Notes */}
                <div className="bg-[#FFFBEB] border border-[#F59E0B]/20 rounded-xl p-5">
                  <h4 className="font-semibold text-[#92400E] mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    Important Reminders
                  </h4>
                  <ul className="space-y-2 text-sm text-[#92400E]">
                    <li className="flex items-start gap-2">• <span>Approval for an initial consultation does not guarantee further legal assistance or full representation.</span></li>
                    <li className="flex items-start gap-2">• <span>External expenses, filing fees, and disbursements are not automatically covered.</span></li>
                    <li className="flex items-start gap-2">• <span>Every application is assessed individually based on need, urgency, and volunteer availability.</span></li>
                    <li className="flex items-start gap-2">• <span>Volunteer lawyers retain the right to accept or decline any referral.</span></li>
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
              {submitMutation.isPending ? "Submitting..." : "Submit Application"}
            </Button>
          )}
        </div>
      </form>

      {/* Info Footer */}
      <div className="max-w-3xl mx-auto px-4 pb-12 text-center text-sm text-[#667085]">
        <p>By submitting this application, you agree to our <Link href="/terms-of-use" className="text-[#00A6A6] hover:underline">Terms of Use</Link> and <Link href="/privacy-policy" className="text-[#00A6A6] hover:underline">Privacy Policy</Link>.</p>
        <p className="mt-2">Questions? <a href="mailto:probono@advisora-connect.com" className="text-[#00A6A6] hover:underline">Contact the Advisora Impact team</a></p>
      </div>
    </div>
  );
}