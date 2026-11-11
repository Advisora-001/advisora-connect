"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

const emptyCategory = {
  key: "new-category",
  label: "",
  pluralLabel: "",
  description: "",
  isActive: true,
  registrationFields: [],
  verificationRequirements: [],
  specializations: [],
  serviceTypes: [],
  consultationOptions: [],
};

const emptyPlan = {
  key: "new-plan",
  name: "",
  tier: "premium",
  description: "",
  isActive: false,
  currency: "NGN",
  individualPrices: [],
  firmPrices: [],
  benefits: {
    directoryListing: true,
    receiveEnquiries: true,
    respondToEnquiries: true,
    appointmentManagement: false,
    analytics: false,
    increasedSearchVisibility: false,
    maxServices: 1,
    maxSeats: 1,
    maxProfilesPerSeat: 3,
    enhancedEnquiryManagement: false,
  },
};

function pretty(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export default function MembershipConfiguration() {
  const [categories, setCategories] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [categoryDrafts, setCategoryDrafts] = useState<Record<string, string>>({});
  const [planDrafts, setPlanDrafts] = useState<Record<string, string>>({});
  const [feeDraft, setFeeDraft] = useState("");
  const [newCategory, setNewCategory] = useState(false);
  const [newPlan, setNewPlan] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const config = await api.getMembershipConfig();
      setCategories(config.categories);
      setPlans(config.plans);
      setCategoryDrafts(Object.fromEntries(config.categories.map((item) => [item.key, pretty(item)])));
      setPlanDrafts(Object.fromEntries(config.plans.map((item) => [item.key, pretty(item)])));
      setFeeDraft(pretty(config.platformFeePolicy || {
        isActive: false,
        type: "fixed",
        amount: 0,
        currency: "NGN",
        appliesTo: [],
      }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load membership settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const saveCategory = async (key: string, isNew: boolean) => {
    setSaving(`category:${key}`);
    setError("");
    setNotice("");
    try {
      const draft = JSON.parse(categoryDrafts[key] || "");
      if (isNew) await api.createProfessionalCategory(draft);
      else await api.saveProfessionalCategory(key, draft);
      setNewCategory(false);
      setNotice(`Category "${draft.label}" saved.`);
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not save category.");
    } finally {
      setSaving("");
    }
  };

  const savePlan = async (key: string, isNew: boolean) => {
    setSaving(`plan:${key}`);
    setError("");
    setNotice("");
    try {
      const draft = JSON.parse(planDrafts[key] || "");
      if (isNew) await api.createMembershipPlan(draft);
      else await api.saveMembershipPlan(key, draft);
      setNewPlan(false);
      setNotice(`Plan "${draft.name}" saved.`);
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not save membership plan.");
    } finally {
      setSaving("");
    }
  };

  const saveFees = async () => {
    setSaving("fees");
    setError("");
    setNotice("");
    try {
      await api.savePlatformFeePolicy(JSON.parse(feeDraft));
      setNotice("Transaction fee policy saved.");
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not save transaction fee policy.");
    } finally {
      setSaving("");
    }
  };

  if (loading) return <p className="rounded-xl bg-white p-8 text-[#667085]">Loading membership configuration...</p>;

  return (
    <div className="space-y-6">
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{notice}</p>}

      <section className="rounded-xl border border-[#E5EAF0] bg-white p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[#1B2A4A]">Professional categories</h2>
            <p className="mt-1 text-sm text-[#667085]">Manage registration fields, credentials, specializations, services, and consultation options.</p>
          </div>
          <button type="button" onClick={() => {
            setCategoryDrafts((current) => ({ ...current, [emptyCategory.key]: pretty(emptyCategory) }));
            setNewCategory(true);
          }} className="rounded-lg bg-[#1B2A4A] px-4 py-2 text-sm font-semibold text-white">Add category</button>
        </div>
        <div className="space-y-5">
          {[...categories, ...(newCategory ? [emptyCategory] : [])].map((category: any) => (
            <div key={category.key} className="rounded-lg border border-[#E5EAF0] p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="font-semibold text-[#344054]">{category.label || "New category"} <span className="text-xs text-[#667085]">({category.key})</span></h3>
                <button type="button" disabled={saving === `category:${category.key}`} onClick={() => void saveCategory(category.key, newCategory && category.key === emptyCategory.key)} className="rounded-md bg-[#00A6A6] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50">
                  {saving === `category:${category.key}` ? "Saving..." : "Save category"}
                </button>
              </div>
              <textarea aria-label={`${category.label || "New"} category JSON`} spellCheck={false} rows={11} value={categoryDrafts[category.key] || (newCategory ? pretty(category) : "")} onChange={(event) => setCategoryDrafts((current) => ({ ...current, [category.key]: event.target.value }))} className="w-full rounded-lg border border-[#D0D5DD] p-3 font-mono text-xs text-[#344054]" />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-[#E5EAF0] bg-white p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[#1B2A4A]">Membership plans</h2>
            <p className="mt-1 text-sm text-[#667085]">Configure individual and firm prices, seats, benefits, and service/profile limits. Basic must remain free.</p>
          </div>
          <button type="button" onClick={() => {
            setPlanDrafts((current) => ({ ...current, [emptyPlan.key]: pretty(emptyPlan) }));
            setNewPlan(true);
          }} className="rounded-lg bg-[#1B2A4A] px-4 py-2 text-sm font-semibold text-white">Add plan</button>
        </div>
        <div className="space-y-5">
          {[...plans, ...(newPlan ? [emptyPlan] : [])].map((plan: any) => (
            <div key={plan.key} className="rounded-lg border border-[#E5EAF0] p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="font-semibold text-[#344054]">{plan.name || "New plan"} <span className="text-xs capitalize text-[#667085]">({plan.tier})</span></h3>
                <button type="button" disabled={saving === `plan:${plan.key}`} onClick={() => void savePlan(plan.key, newPlan && plan.key === emptyPlan.key)} className="rounded-md bg-[#00A6A6] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50">
                  {saving === `plan:${plan.key}` ? "Saving..." : "Save plan"}
                </button>
              </div>
              <textarea aria-label={`${plan.name || "New"} plan JSON`} spellCheck={false} rows={13} value={planDrafts[plan.key] || (newPlan ? pretty(plan) : "")} onChange={(event) => setPlanDrafts((current) => ({ ...current, [plan.key]: event.target.value }))} className="w-full rounded-lg border border-[#D0D5DD] p-3 font-mono text-xs text-[#344054]" />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-[#E5EAF0] bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[#1B2A4A]">Transaction fee policy</h2>
            <p className="mt-1 text-sm text-[#667085]">Transaction fees are independent of membership subscriptions.</p>
          </div>
          <button type="button" disabled={saving === "fees"} onClick={() => void saveFees()} className="rounded-md bg-[#00A6A6] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50">
            {saving === "fees" ? "Saving..." : "Save fees"}
          </button>
        </div>
        <textarea aria-label="Transaction fee policy JSON" spellCheck={false} rows={7} value={feeDraft} onChange={(event) => setFeeDraft(event.target.value)} className="w-full rounded-lg border border-[#D0D5DD] p-3 font-mono text-xs text-[#344054]" />
      </section>
    </div>
  );
}
