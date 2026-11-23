"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

const transactionTypes = ["consultation", "enquiry", "engagement", "subscription"];

export default function MembershipConfiguration() {
  const [plans, setPlans] = useState<any[]>([]);
  const [feePolicies, setFeePolicies] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState({
    key: "",
    label: "",
    description: "",
    specializations: "[]",
    registrationFields: "[]",
    verificationRequirements: "{\"requiredDocs\":[],\"criteria\":[]}",
    serviceTypes: "[]",
    consultationModes: "[\"video\"]",
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    try {
      const [result, categoryResult] = await Promise.all([
        api.getMembershipConfig(),
        api.getAdminProfessionalCategories(),
      ]);
      setPlans(result.plans);
      setFeePolicies(result.feePolicies);
      setCategories(categoryResult.categories);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load configuration");
    }
  };

  useEffect(() => { void load(); }, []);

  const savePlan = async (plan: any) => {
    setSaving(plan.key);
    setError("");
    setNotice("");
    try {
      await api.saveMembershipPlan(plan.key, {
        ...plan,
        entitlements: typeof plan.entitlements === "string" ? JSON.parse(plan.entitlements) : plan.entitlements,
        limits: typeof plan.limits === "string" ? JSON.parse(plan.limits) : plan.limits,
      });
      setNotice(`${plan.name} plan saved.`);
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save plan");
    } finally {
      setSaving(null);
    }
  };

  const saveFee = async (type: string, current: any) => {
    setSaving(type);
    setError("");
    setNotice("");
    try {
      await api.savePlatformFeePolicy(type, current);
      setNotice(`${type} fee policy saved.`);
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save fee policy");
    } finally {
      setSaving(null);
    }
  };

  const parseCategoryData = (category: any) => ({
    ...category,
    specializations: typeof category.specializations === "string" ? JSON.parse(category.specializations) : category.specializations,
    registrationFields: typeof category.registrationFields === "string" ? JSON.parse(category.registrationFields) : category.registrationFields,
    verificationRequirements: typeof category.verificationRequirements === "string" ? JSON.parse(category.verificationRequirements) : category.verificationRequirements,
    serviceTypes: typeof category.serviceTypes === "string" ? JSON.parse(category.serviceTypes) : category.serviceTypes,
    consultationModes: typeof category.consultationModes === "string" ? JSON.parse(category.consultationModes) : category.consultationModes,
  });

  const saveCategory = async (category: any, create = false) => {
    setSaving(`category-${category.key}`);
    setError("");
    setNotice("");
    try {
      const data = parseCategoryData(category);
      if (create) await api.createProfessionalCategory(data);
      else await api.updateProfessionalCategory(category._id, data);
      setNotice(`${category.label} category saved.`);
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save category. Check the JSON fields.");
    } finally {
      setSaving(null);
    }
  };

  const updatePlan = (key: string, field: string, value: any) => {
    setPlans((current) => current.map((plan) => plan.key === key ? { ...plan, [field]: value } : plan));
  };

  const updateFee = (type: string, field: string, value: any) => {
    setFeePolicies((current) => {
      const existing = current.find((policy) => policy.transactionType === type);
      const next = { ...(existing || { transactionType: type, feeType: "fixed", isActive: false }), [field]: value };
      return [...current.filter((policy) => policy.transactionType !== type), next];
    });
  };

  return (
    <div className="space-y-8">
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{notice}</p>}
      <section>
        <h2 className="mb-4 text-lg font-bold text-[#1B2A4A]">Membership plans</h2>
        <div className="space-y-4">
          {plans.map((plan) => (
            <article key={plan.key} className="space-y-3 rounded-xl border border-[#E5EAF0] p-4">
              <div className="grid gap-3 md:grid-cols-4">
                <label className="text-sm">Plan name<input className="mt-1 w-full rounded border p-2" value={plan.name} onChange={(e) => updatePlan(plan.key, "name", e.target.value)} /></label>
                <label className="text-sm">Individual price<input type="number" min="0" className="mt-1 w-full rounded border p-2" value={plan.price?.amount ?? 0} onChange={(e) => updatePlan(plan.key, "price", { ...plan.price, amount: Number(e.target.value) })} /></label>
                <label className="text-sm">Firm price<input type="number" min="0" className="mt-1 w-full rounded border p-2" value={plan.firmPrice?.amount ?? 0} onChange={(e) => updatePlan(plan.key, "firmPrice", { ...plan.firmPrice, amount: Number(e.target.value) })} /></label>
                <label className="text-sm">Billing interval<select className="mt-1 w-full rounded border p-2" value={plan.billingInterval} onChange={(e) => updatePlan(plan.key, "billingInterval", e.target.value)}><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></label>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={plan.isFree} onChange={(e) => updatePlan(plan.key, "isFree", e.target.checked)} /> Free plan</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={plan.isActive} onChange={(e) => updatePlan(plan.key, "isActive", e.target.checked)} /> Active / purchasable</label>
                <label className="text-sm">Included firm seats<input type="number" min="1" className="mt-1 w-full rounded border p-2" value={plan.includedSeats ?? 1} onChange={(e) => updatePlan(plan.key, "includedSeats", Number(e.target.value))} /></label>
              </div>
              <label className="block text-sm">Entitlements JSON<textarea className="mt-1 min-h-24 w-full rounded border p-2 font-mono text-xs" value={typeof plan.entitlements === "string" ? plan.entitlements : JSON.stringify(plan.entitlements, null, 2)} onChange={(e) => updatePlan(plan.key, "entitlements", e.target.value)} /></label>
              <label className="block text-sm">Limits JSON<textarea className="mt-1 min-h-20 w-full rounded border p-2 font-mono text-xs" value={typeof plan.limits === "string" ? plan.limits : JSON.stringify(plan.limits, null, 2)} onChange={(e) => updatePlan(plan.key, "limits", e.target.value)} /></label>
              <button disabled={saving === plan.key} onClick={() => void savePlan(plan)} className="rounded-lg bg-[#1B2A4A] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving === plan.key ? "Saving..." : "Save plan"}</button>
            </article>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-4 text-lg font-bold text-[#1B2A4A]">Platform transaction fees</h2>
        <div className="space-y-3">
          {transactionTypes.map((type) => {
            const policy = feePolicies.find((item) => item.transactionType === type) || { transactionType: type, feeType: "fixed", fixedAmount: 0, percentage: 0, isActive: false };
            const value = policy.feeType === "percentage" ? policy.percentage ?? 0 : policy.fixedAmount ?? 0;
            return <div key={type} className="grid items-end gap-3 rounded-xl border border-[#E5EAF0] p-4 md:grid-cols-5">
              <p className="font-medium capitalize text-[#1B2A4A]">{type}</p>
              <label className="text-sm">Fee type<select className="mt-1 w-full rounded border p-2" value={policy.feeType} onChange={(e) => updateFee(type, "feeType", e.target.value)}><option value="fixed">Fixed</option><option value="percentage">Percentage</option></select></label>
              <label className="text-sm">{policy.feeType === "percentage" ? "Percent" : "Amount"}<input type="number" min="0" max={policy.feeType === "percentage" ? 100 : undefined} className="mt-1 w-full rounded border p-2" value={value} onChange={(e) => updateFee(type, policy.feeType === "percentage" ? "percentage" : "fixedAmount", Number(e.target.value))} /></label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(policy.isActive)} onChange={(e) => updateFee(type, "isActive", e.target.checked)} /> Active</label>
              <button disabled={saving === type} onClick={() => void saveFee(type, policy)} className="rounded-lg bg-[#1B2A4A] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving === type ? "Saving..." : "Save fee"}</button>
            </div>;
          })}
        </div>
      </section>
      <section>
        <h2 className="mb-4 text-lg font-bold text-[#1B2A4A]">Professional categories</h2>
        <p className="mb-4 text-sm text-[#667085]">Manage categories and their specialization, registration, verification, service, and consultation requirements. JSON fields must contain valid JSON arrays or objects.</p>
        <div className="mb-6 space-y-3 rounded-xl border border-[#E5EAF0] p-4">
          <h3 className="font-semibold text-[#1B2A4A]">Add a category</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">Key<input className="mt-1 w-full rounded border p-2" value={newCategory.key} onChange={(e) => setNewCategory({ ...newCategory, key: e.target.value })} /></label>
            <label className="text-sm">Label<input className="mt-1 w-full rounded border p-2" value={newCategory.label} onChange={(e) => setNewCategory({ ...newCategory, label: e.target.value })} /></label>
          </div>
          <label className="block text-sm">Description<input className="mt-1 w-full rounded border p-2" value={newCategory.description} onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })} /></label>
          <div className="grid gap-3 md:grid-cols-2">
            {(["specializations", "registrationFields", "verificationRequirements", "serviceTypes", "consultationModes"] as const).map((field) => (
              <label key={field} className="text-sm capitalize">{field}<textarea className="mt-1 min-h-20 w-full rounded border p-2 font-mono text-xs" value={newCategory[field]} onChange={(e) => setNewCategory({ ...newCategory, [field]: e.target.value })} /></label>
            ))}
          </div>
          <button disabled={!newCategory.key || !newCategory.label || saving === `category-${newCategory.key}`} onClick={() => void saveCategory(newCategory, true)} className="rounded-lg bg-[#1B2A4A] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Create category</button>
        </div>
        <div className="space-y-4">
          {categories.map((category) => (
            <CategoryEditor key={category._id} category={category} saving={saving === `category-${category.key}`} onSave={saveCategory} onChange={(updated) => setCategories((current) => current.map((item) => item._id === category._id ? updated : item))} />
          ))}
        </div>
      </section>
    </div>
  );
}

function CategoryEditor({ category, saving, onSave, onChange }: {
  category: any;
  saving: boolean;
  onSave: (category: any) => void;
  onChange: (category: any) => void;
}) {
  const fields = ["specializations", "registrationFields", "verificationRequirements", "serviceTypes", "consultationModes"] as const;
  const updateJsonField = (field: typeof fields[number], value: string) => onChange({ ...category, [field]: value });
  return (
    <article className="space-y-3 rounded-xl border border-[#E5EAF0] p-4">
      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-sm">Key<input className="mt-1 w-full rounded border bg-gray-50 p-2" value={category.key} readOnly /></label>
        <label className="text-sm">Label<input className="mt-1 w-full rounded border p-2" value={category.label} onChange={(e) => onChange({ ...category, label: e.target.value })} /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={category.isActive} onChange={(e) => onChange({ ...category, isActive: e.target.checked })} /> Active</label>
      </div>
      <label className="block text-sm">Description<input className="mt-1 w-full rounded border p-2" value={category.description || ""} onChange={(e) => onChange({ ...category, description: e.target.value })} /></label>
      <div className="grid gap-3 md:grid-cols-2">
        {fields.map((field) => {
          const value = typeof category[field] === "string" ? category[field] : JSON.stringify(category[field] || (field === "verificationRequirements" ? { requiredDocs: [], criteria: [] } : []), null, 2);
          return <label key={field} className="text-sm capitalize">{field}<textarea className="mt-1 min-h-20 w-full rounded border p-2 font-mono text-xs" value={value} onChange={(e) => updateJsonField(field, e.target.value)} /></label>;
        })}
      </div>
      <button disabled={saving} onClick={() => onSave(category)} className="rounded-lg bg-[#1B2A4A] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save category"}</button>
    </article>
  );
}
