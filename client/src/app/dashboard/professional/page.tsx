"use client";

import { useEffect, useState, type FormEvent } from "react";
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
  const [categories, setCategories] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [membership, setMembership] = useState<any>(null);
  const [firms, setFirms] = useState<any[]>([]);
  const [firmName, setFirmName] = useState("");
  const [firmEmail, setFirmEmail] = useState("");
  const [firmCategories, setFirmCategories] = useState<string[]>([]);
  const [inviteEmails, setInviteEmails] = useState<Record<string, string>>({});
  const [inviteCategories, setInviteCategories] = useState<Record<string, string>>({});
  const [inviteUrls, setInviteUrls] = useState<Record<string, string>>({});
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [engagements, setEngagements] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user || !["professional", "lawyer"].includes(user.role)) {
      router.push("/login");
      return;
    }

    Promise.all([
      api.getMyProfessionalProfiles(),
      api.getProfessionalEnquiries(),
      api.getMyServiceEngagements(),
      api.getProfessionalCategories(),
      api.getMembershipPlans(),
      api.getMyMembership(),
      api.getMyFirms(),
    ])
      .then(([{ profiles: loadedProfiles }, { enquiries: receivedEnquiries }, { engagements: loadedEngagements }, { categories: loadedCategories }, { plans: loadedPlans }, loadedMembership, { firms: loadedFirms }]) => {
        setProfiles(loadedProfiles);
        setCategories(loadedCategories);
        setFirmCategories(loadedProfiles.map((profile) => profile.category));
        setEnquiries(receivedEnquiries);
        setEngagements(loadedEngagements);
        setPlans(loadedPlans);
        setMembership(loadedMembership);
        setFirms(loadedFirms);
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

  const uploadDocuments = async (requirementKey: string, files: FileList | null) => {
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
    data.append("requirementKey", requirementKey);
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

  const refreshFirmData = async () => {
    const [{ firms: loadedFirms }, loadedMembership] = await Promise.all([api.getMyFirms(), api.getMyMembership()]);
    setFirms(loadedFirms);
    setMembership(loadedMembership);
  };

  const createFirm = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api.createFirm({ name: firmName, email: firmEmail, categories: firmCategories });
      setFirmName("");
      setFirmEmail("");
      await refreshFirmData();
      setNotice("Firm workspace created with a free Basic membership.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not create firm workspace.");
    } finally {
      setSaving(false);
    }
  };

  const inviteFirmMember = async (firmId: string) => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await api.inviteFirmMember(firmId, inviteEmails[firmId] || "", inviteCategories[firmId] || categories[0]?.key);
      setInviteUrls((current) => ({ ...current, [firmId]: result.inviteUrl }));
      setInviteEmails((current) => ({ ...current, [firmId]: "" }));
      setNotice(result.message);
      await refreshFirmData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not invite professional.");
    } finally {
      setSaving(false);
    }
  };

  const proposeEngagement = async (enquiry: any) => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api.createServiceEngagement(enquiry._id, {
        title: `${categoryLabels[enquiry.professionalProfileId?.category] || "Professional"} engagement`,
        scope: enquiry.message,
      });
      const [{ enquiries: updatedEnquiries }, { engagements: updatedEngagements }] = await Promise.all([
        api.getProfessionalEnquiries(),
        api.getMyServiceEngagements(),
      ]);
      setEnquiries(updatedEnquiries);
      setEngagements(updatedEngagements);
      setNotice("Engagement proposal created. The client can review and accept it from their dashboard.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not propose engagement.");
    } finally {
      setSaving(false);
    }
  };

  const completeEngagement = async (engagementId: string) => {
    setSaving(true);
    setError("");
    try {
      await api.updateServiceEngagementStatus(engagementId, "completed");
      const { engagements: updatedEngagements } = await api.getMyServiceEngagements();
      setEngagements(updatedEngagements);
      setNotice("Engagement marked completed.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not update engagement.");
    } finally {
      setSaving(false);
    }
  };

  const changeMembership = async (planKey: string, firmId?: string) => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await api.startMembership({ planKey, interval: billingInterval, firmId });
      if (result.authorization_url) {
        window.location.assign(result.authorization_url);
        return;
      }
      setNotice(result.message || "Membership updated.");
      await refreshFirmData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not update membership.");
    } finally {
      setSaving(false);
    }
  };

  const categoryConfig = categories.find((category) => category.key === form?.category);
  const updateCustomField = (key: string, value: string) => {
    setForm((current: any) => ({
      ...current,
      customFields: { ...(current.customFields || {}), [key]: value },
    }));
  };
  const updateServiceListing = (index: number, patch: Record<string, unknown>) => {
    setForm((current: any) => ({
      ...current,
      serviceListings: (current.serviceListings || []).map((listing: any, listingIndex: number) =>
        listingIndex === index ? { ...listing, ...patch } : listing,
      ),
    }));
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
        <div className="flex flex-wrap gap-4 items-center">
          <Link href="/pro-bono-initiative" className="rounded-lg bg-[#00A6A6]/10 px-4 py-2 text-sm font-semibold text-[#00A6A6] hover:bg-[#00A6A6]/20 transition-colors">
            🤝 Pro Bono Volunteer
          </Link>
          <Link href="/professionals" className="font-semibold text-[#00A6A6] hover:underline">Browse professionals</Link>
        </div>
      </div>

      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{notice}</p>}

      <section className="mb-8 rounded-xl border border-[#E5EAF0] bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#1B2A4A]">Membership</h2>
            <p className="mt-1 text-sm text-[#667085]">
              Current plan: <span className="font-semibold capitalize text-[#344054]">{membership?.subscription?.planKey || "Basic"}</span>
            </p>
          </div>
          <label className="text-sm text-[#475569]">
            Billing interval
            <select value={billingInterval} onChange={(event) => setBillingInterval(event.target.value as "month" | "year")} className="ml-2 rounded-lg border border-[#D0D5DD] px-3 py-2">
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {plans.map((plan) => {
            const price = plan.individualPrices?.find((item: any) => item.interval === billingInterval);
            return (
              <div key={plan.key} className="min-w-[220px] rounded-lg border border-[#E5EAF0] p-4">
                <p className="font-semibold capitalize text-[#1B2A4A]">{plan.name}</p>
                <p className="mt-1 text-sm text-[#667085]">{price ? (price.amount === 0 ? "Free" : `${plan.currency} ${price.amount.toLocaleString()} / ${billingInterval}`) : "Not configured"}</p>
                <button type="button" disabled={saving || !price} onClick={() => void changeMembership(plan.key)} className="mt-3 rounded-lg bg-[#00A6A6] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                  {plan.key === membership?.subscription?.planKey ? "Current plan" : plan.tier === "basic" ? "Select Basic" : "Choose plan"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-8 rounded-xl border border-[#E5EAF0] bg-white p-5 sm:p-6">
        <div>
          <h2 className="text-xl font-bold text-[#1B2A4A]">Firm workspaces</h2>
          <p className="mt-1 text-sm text-[#667085]">Create a firm account, manage its membership, and invite individual professionals into available seats.</p>
        </div>
        <form onSubmit={(event) => void createFirm(event)} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input required value={firmName} onChange={(event) => setFirmName(event.target.value)} placeholder="Firm or practice name" className="rounded-lg border border-[#D0D5DD] px-3 py-2.5" />
          <input required type="email" value={firmEmail} onChange={(event) => setFirmEmail(event.target.value)} placeholder="Firm contact email" className="rounded-lg border border-[#D0D5DD] px-3 py-2.5" />
          <button type="submit" disabled={saving} className="rounded-lg bg-[#1B2A4A] px-4 py-2.5 font-semibold text-white disabled:opacity-50">Create firm</button>
          <fieldset className="sm:col-span-3">
            <legend className="text-sm font-medium text-[#344054]">Associate your existing profiles with this firm</legend>
            <div className="mt-2 flex flex-wrap gap-4">
              {profiles.map((profile) => (
                <label key={profile._id} className="flex items-center gap-2 text-sm text-[#475569]">
                  <input type="checkbox" checked={firmCategories.includes(profile.category)} onChange={(event) => setFirmCategories((current) => event.target.checked
                    ? [...current, profile.category]
                    : current.filter((category) => category !== profile.category))} />
                  {categoryLabels[profile.category] || profile.category}
                </label>
              ))}
              {profiles.length === 0 && <p className="text-xs text-[#667085]">Complete at least one professional profile to associate it with the firm.</p>}
            </div>
          </fieldset>
        </form>
        <div className="mt-5 space-y-4">
          {firms.map((firm) => {
            const firmSubscription = membership?.firmSubscriptions?.find((subscription: any) => subscription.firmId === firm._id || subscription.firmId?._id === firm._id);
            const firmPricePlans = plans.filter((plan) => plan.firmPrices?.some((item: any) => item.interval === billingInterval));
            const selectedCategory = inviteCategories[firm._id] || categories[0]?.key || "";
            const isFirmAdmin = firm.members?.some((member: any) => member.email === user?.email && ["owner", "admin"].includes(member.role));
            return (
              <article key={firm._id} className="rounded-lg border border-[#E5EAF0] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-[#1B2A4A]">{firm.name}</h3>
                    <p className="mt-1 text-xs text-[#667085]">Plan: <span className="capitalize">{firmSubscription?.planKey || "basic"}</span> · {firm.members?.filter((member: any) => member.status === "active").length || 0} active seat(s)</p>
                  </div>
                  {isFirmAdmin && <label className="text-sm text-[#475569]">
                      Firm plan
                      <select disabled={saving || firmPricePlans.length === 0} value="" onChange={(event) => event.target.value && void changeMembership(event.target.value, firm._id)} className="ml-2 rounded-lg border border-[#D0D5DD] px-3 py-2">
                        <option value="">Change plan...</option>
                        {firmPricePlans.map((plan) => <option key={plan.key} value={plan.key}>{plan.name}</option>)}
                      </select>
                    </label>}
                </div>
                <ul className="mt-3 space-y-1 text-sm text-[#475569]">
                  {(firm.members || []).map((member: any) => <li key={member._id || member.email}>{member.email} · {member.role} · {member.status}</li>)}
                </ul>
                {isFirmAdmin && <>
                  <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <input type="email" value={inviteEmails[firm._id] || ""} onChange={(event) => setInviteEmails((current) => ({ ...current, [firm._id]: event.target.value }))} placeholder="Professional's account email" className="rounded-lg border border-[#D0D5DD] px-3 py-2" />
                    <select value={selectedCategory} onChange={(event) => setInviteCategories((current) => ({ ...current, [firm._id]: event.target.value }))} className="rounded-lg border border-[#D0D5DD] px-3 py-2">
                      {categories.map((category) => <option key={category.key} value={category.key}>{category.label}</option>)}
                    </select>
                    <button type="button" disabled={saving || !inviteEmails[firm._id]} onClick={() => void inviteFirmMember(firm._id)} className="rounded-lg bg-[#00A6A6] px-4 py-2 font-semibold text-white disabled:opacity-50">Invite professional</button>
                  </div>
                  {inviteUrls[firm._id] && <p className="mt-3 break-all text-xs text-[#667085]">Share this one-time invitation link with the professional: <a href={inviteUrls[firm._id]} className="font-medium text-[#00A6A6] underline">{inviteUrls[firm._id]}</a></p>}
                </>}
              </article>
            );
          })}
          {firms.length === 0 && <p className="text-sm text-[#667085]">No firm workspaces yet. Create one to manage professionals as a firm.</p>}
        </div>
      </section>

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
                {enquiry.status === "pending" && (
                  <button type="button" disabled={saving} onClick={() => void proposeEngagement(enquiry)} className="mt-3 rounded-lg bg-[#00A6A6] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
                    Propose service engagement
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mb-8 rounded-xl border border-[#E5EAF0] bg-white p-5 sm:p-6">
        <h2 className="text-xl font-bold text-[#1B2A4A]">Service engagements</h2>
        {engagements.length === 0 ? (
          <p className="mt-2 text-sm text-[#667085]">Engagements created from accepted professional enquiries will appear here.</p>
        ) : (
          <div className="mt-3 divide-y divide-[#E5EAF0]">
            {engagements.map((engagement) => (
              <article key={engagement._id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-[#1B2A4A]">{engagement.title}</p>
                  <span className="rounded-full bg-[#F1F5F9] px-3 py-1 text-xs capitalize text-[#475569]">{engagement.status}</span>
                </div>
                <p className="mt-1 text-xs text-[#667085]">Client: {engagement.clientId?.firstName} {engagement.clientId?.lastName}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-[#475569]">{engagement.scope}</p>
                {engagement.status === "active" && (
                  <button type="button" disabled={saving} onClick={() => void completeEngagement(engagement._id)} className="mt-2 rounded-lg border border-[#D0D5DD] px-3 py-1.5 text-sm font-semibold text-[#344054] disabled:opacity-50">Mark completed</button>
                )}
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
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium text-[#344054]">Areas of expertise</legend>
                  {categoryConfig?.specializations?.length ? categoryConfig.specializations.map((item: string) => (
                    <label key={item} className="flex items-center gap-2 text-sm text-[#475569]">
                      <input type="checkbox" checked={form.specializations.includes(item)} onChange={(event) => updateField("specializations", event.target.checked ? [...form.specializations, item].join(",") : form.specializations.filter((value: string) => value !== item).join(","))} />
                      {item}
                    </label>
                  )) : <input value={form.specializations.join(", ")} onChange={(event) => updateField("specializations", event.target.value)} placeholder="Comma-separated expertise" className="w-full rounded-lg border border-[#D0D5DD] px-3 py-2.5" />}
                </fieldset>
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium text-[#344054]">Services</legend>
                  {categoryConfig?.serviceTypes?.length ? categoryConfig.serviceTypes.map((item: string) => (
                    <label key={item} className="flex items-center gap-2 text-sm text-[#475569]">
                      <input type="checkbox" checked={form.services.includes(item)} onChange={(event) => updateField("services", event.target.checked ? [...form.services, item].join(",") : form.services.filter((value: string) => value !== item).join(","))} />
                      {item}
                    </label>
                  )) : <input value={form.services.join(", ")} onChange={(event) => updateField("services", event.target.value)} placeholder="Comma-separated services" className="w-full rounded-lg border border-[#D0D5DD] px-3 py-2.5" />}
                </fieldset>
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

              {categoryConfig?.registrationFields?.length > 0 && (
                <fieldset className="space-y-4 rounded-lg border border-[#E5EAF0] p-4">
                  <legend className="px-1 text-sm font-semibold text-[#344054]">Category-specific details</legend>
                  {categoryConfig.registrationFields.map((field: any) => (
                    <label key={field.key} className="block text-sm font-medium text-[#344054]">
                      {field.label}{field.required && <span className="text-red-600"> *</span>}
                      {field.type === "select" ? (
                        <select required={field.required} value={form.customFields?.[field.key] || ""} onChange={(event) => {
                          updateCustomField(field.key, event.target.value);
                          if (field.key === "professionalBody" || field.key === "membershipNumber") updateField(field.key, event.target.value);
                        }} className="mt-1 w-full rounded-lg border border-[#D0D5DD] px-3 py-2.5">
                          <option value="">Select...</option>
                          {(field.options || []).map((option: string) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      ) : (
                        <input required={field.required} type={field.type === "number" || field.type === "date" ? field.type : "text"} value={form.customFields?.[field.key] || ""} onChange={(event) => {
                          updateCustomField(field.key, event.target.value);
                          if (field.key === "professionalBody" || field.key === "membershipNumber") updateField(field.key, event.target.value);
                        }} className="mt-1 w-full rounded-lg border border-[#D0D5DD] px-3 py-2.5" />
                      )}
                    </label>
                  ))}
                </fieldset>
              )}

              <section className="space-y-4 rounded-lg border border-[#E5EAF0] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[#344054]">Service listings</h3>
                    <p className="mt-1 text-xs text-[#667085]">Your membership limits how many service listings you can publish.</p>
                  </div>
                  <button type="button" onClick={() => setForm((current: any) => ({
                    ...current,
                    serviceListings: [...(current.serviceListings || []), {
                      name: categoryConfig?.serviceTypes?.[0] || "",
                      description: "",
                      consultationOptions: [],
                      isActive: true,
                    }],
                  }))} className="rounded-lg border border-[#D0D5DD] px-3 py-2 text-sm font-semibold text-[#344054]">Add service</button>
                </div>
                {(form.serviceListings || []).map((listing: any, index: number) => (
                  <div key={`${listing.name}-${index}`} className="grid gap-3 rounded-lg bg-[#F8FAFC] p-3 sm:grid-cols-2">
                    <label className="text-sm font-medium text-[#344054]">
                      Service
                      <select value={listing.name} onChange={(event) => updateServiceListing(index, { name: event.target.value })} className="mt-1 w-full rounded-lg border border-[#D0D5DD] px-3 py-2">
                        <option value="">Select a service</option>
                        {(categoryConfig?.serviceTypes || []).map((service: string) => <option key={service} value={service}>{service}</option>)}
                      </select>
                    </label>
                    <label className="text-sm font-medium text-[#344054]">
                      Description
                      <input value={listing.description || ""} onChange={(event) => updateServiceListing(index, { description: event.target.value })} className="mt-1 w-full rounded-lg border border-[#D0D5DD] px-3 py-2" />
                    </label>
                    <fieldset className="space-y-1">
                      <legend className="text-sm font-medium text-[#344054]">Consultation options</legend>
                      {(categoryConfig?.consultationOptions || []).map((option: string) => (
                        <label key={option} className="mr-3 inline-flex items-center gap-1 text-sm capitalize text-[#475569]">
                          <input type="checkbox" checked={(listing.consultationOptions || []).includes(option)} onChange={(event) => updateServiceListing(index, {
                            consultationOptions: event.target.checked
                              ? [...(listing.consultationOptions || []), option]
                              : (listing.consultationOptions || []).filter((value: string) => value !== option),
                          })} />
                          {option.replace("-", " ")}
                        </label>
                      ))}
                    </fieldset>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm text-[#475569]">
                        <input type="checkbox" checked={listing.isActive !== false} onChange={(event) => updateServiceListing(index, { isActive: event.target.checked })} />
                        Active listing
                      </label>
                      <button type="button" onClick={() => setForm((current: any) => ({
                        ...current,
                        serviceListings: current.serviceListings.filter((_: any, listingIndex: number) => listingIndex !== index),
                      }))} className="text-sm font-semibold text-red-600 hover:underline">Remove</button>
                    </div>
                  </div>
                ))}
                {(!categoryConfig?.serviceTypes?.length || !categoryConfig?.consultationOptions?.length) && <p className="text-xs text-amber-700">An administrator must configure service types and consultation options before you can add listings.</p>}
              </section>

              <label className="flex items-center gap-2 text-sm text-[#344054]">
                <input type="checkbox" checked={form.isAvailable} onChange={(event) => updateField("isAvailable", event.target.checked)} />
                Available for new enquiries
              </label>

              <div>
                <label className="block text-sm font-medium text-[#344054]">
                  Supporting credentials
                </label>
                <p className="mt-1 text-xs text-[#667085]">Upload the credential documents required for this professional category. Files must be smaller than 10 MB; up to five documents per profile.</p>
                {(categoryConfig?.verificationRequirements || []).map((requirement: any) => (
                  <label key={requirement.key} className="mt-3 block text-sm text-[#344054]">
                    {requirement.label}{requirement.required && <span className="text-red-600"> *</span>}
                    <input type="file" multiple accept={(requirement.acceptedDocumentTypes || []).map((type: string) => `.${type}`).join(",")} disabled={saving || form.verificationDocs.length >= 5} onChange={(event) => {
                      void uploadDocuments(requirement.key, event.target.files);
                      event.currentTarget.value = "";
                    }} className="mt-1 block w-full text-sm text-[#667085]" />
                    {form.verificationUploads?.filter((upload: any) => upload.requirementKey === requirement.key).map((upload: any, index: number) => (
                      <a key={`${upload.url}-${index}`} href={upload.url} target="_blank" rel="noreferrer" className="mr-3 inline-block text-xs text-[#00A6A6] hover:underline">View uploaded credential {index + 1}</a>
                    ))}
                  </label>
                ))}
                {(!categoryConfig?.verificationRequirements || categoryConfig.verificationRequirements.length === 0) && (
                  <p className="mt-2 text-sm text-[#667085]">No verification requirements are currently configured for this category.</p>
                )}
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
