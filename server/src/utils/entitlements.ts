import ProfessionalProfile from '../models/ProfessionalProfile';
import Firm from '../models/Firm';
import User from '../models/User';
import Plan from '../models/Plan';
import PlatformFeePolicy from '../models/PlatformFeePolicy';
import Subscription from '../models/Subscription';
import FirmMember from '../models/FirmMember';

export async function getEffectivePlan(userId: string): Promise<{ plan: any; isActive: boolean; isFree: boolean }> {
  const user = await User.findById(userId).lean();
  if (!user || user.role === 'admin') {
    return { plan: null, isActive: false, isFree: false };
  }

  const now = new Date();
  const individualSubscription = await Subscription.findOne({
    userId,
    status: 'active',
    endDate: { $gt: now },
  }).sort({ endDate: -1 }).lean();
  if (individualSubscription) {
    const plan = individualSubscription.planId
      ? await Plan.findById(individualSubscription.planId).lean()
      : await Plan.findOne({ key: individualSubscription.plan, isActive: true }).lean();
    if (plan && plan.isActive) {
      return { plan, isActive: true, isFree: plan.isFree === true };
    }
  }

  const membership = await FirmMember.findOne({ userId, status: 'active' }).lean();
  const firm = await Firm.findOne({
    $or: [{ adminId: userId }, ...(membership ? [{ _id: membership.firmId }] : [])],
    status: 'active',
  }).lean();
  if (firm) {
    const subscription = firm.subscriptionId
      ? await Subscription.findOne({ _id: firm.subscriptionId, status: 'active', endDate: { $gt: now } }).lean()
      : null;
    const planId = subscription?.planId || firm.plan;
    const plan = planId
      ? await Plan.findById(planId).lean()
      : subscription
        ? await Plan.findOne({ key: subscription.plan, isActive: true }).lean()
        : null;
    if (plan && plan.isActive) {
      return { plan, isActive: true, isFree: plan.isFree === true };
    }
  }

  const profile = await ProfessionalProfile.findOne({ userId }).lean();
  const basicPlan = await Plan.findOne({ key: 'basic', isActive: true }).lean();
  return { plan: basicPlan, isActive: Boolean(profile || membership || firm), isFree: true };
}

export function getPlanEntitlements(plan: any): {
  listing: boolean;
  searchVisibility: boolean;
  enhancedPlacement: boolean;
  appointmentManagement: boolean;
  analytics: boolean;
  enquiryManagement: boolean;
  maxProfiles: number;
  maxServices: number;
  maxEnquiriesPerMonth: number;
  includedSeats: number;
  additionalSeatPrice: { amount: number; currency: string };
} {
  const p = plan || { isFree: true };
  return {
    listing: p.entitlements?.listing ?? true,
    searchVisibility: p.entitlements?.searchVisibility ?? true,
    enhancedPlacement: p.entitlements?.enhancedPlacement ?? false,
    appointmentManagement: p.entitlements?.appointmentManagement ?? false,
    analytics: p.entitlements?.analytics ?? false,
    enquiryManagement: p.entitlements?.enquiryManagement ?? true,
    maxProfiles: p.limits?.maxProfiles ?? 1,
    maxServices: p.limits?.maxServices ?? 3,
    maxEnquiriesPerMonth: p.limits?.maxEnquiriesPerMonth ?? 50,
    includedSeats: p.includedSeats ?? 1,
    additionalSeatPrice: p.additionalSeatPrice || { amount: 0, currency: 'NGN' },
  };
}

export async function canCreateProfile(userId: string): Promise<{ canCreate: boolean; currentCount: number; limit: number }> {
  const currentCount = await ProfessionalProfile.countDocuments({ userId });

  const { plan } = await getEffectivePlan(userId);
  const limit = plan ? plan.limits?.maxProfiles ?? 1 : 1;

  return {
    canCreate: currentCount < limit,
    currentCount,
    limit,
  };
}

export async function canAddService(userId: string, profileId?: string): Promise<{ canAdd: boolean; currentCount: number; limit: number }> {
  const profile = await ProfessionalProfile.findOne({
    userId,
    ...(profileId ? { _id: profileId } : {}),
  }).lean();
  const currentCount = profile?.services?.length || 0;

  const { plan } = await getEffectivePlan(userId);
  const limit = plan ? plan.limits?.maxServices ?? 3 : 3;

  return {
    canAdd: currentCount < limit,
    currentCount,
    limit,
  };
}

/* Check if a professional can submit more enquiries given their plan limits. */
export async function canSubmitEnquiries(userId: string, submittedThisMonth: number = 0): Promise<{ canSubmit: boolean; submittedThisMonth: number; limit: number }> {
  const { plan } = await getEffectivePlan(userId);
  const limit = plan ? plan.limits?.maxEnquiriesPerMonth ?? 50 : 50;

  return {
    canSubmit: submittedThisMonth < limit,
    submittedThisMonth,
    limit,
  };
}

/* Get the effective platform fee policy for a transaction type. */
export async function getPlatformFeePolicy(
  transactionType: 'consultation' | 'enquiry' | 'engagement' | 'subscription'
): Promise<{ feeType: 'fixed' | 'percentage'; fixedAmount?: number; percentage?: number; minAmount?: number; maxAmount?: number; isActive: boolean }> {
  const policy = await PlatformFeePolicy.findOne({ transactionType, isActive: true }).lean();
  if (!policy) {
    return { feeType: 'fixed', fixedAmount: Number(process.env.PLATFORM_FEE_AMOUNT) || 10000, isActive: true };
  }
  return {
    feeType: policy.feeType,
    fixedAmount: policy.fixedAmount,
    percentage: policy.percentage,
    minAmount: policy.minAmount,
    maxAmount: policy.maxAmount,
    isActive: policy.isActive,
  };
}

export async function calculatePlatformFee(
  transactionType: 'consultation' | 'enquiry' | 'engagement' | 'subscription',
  amount: number
): Promise<number> {
  const policy = await getPlatformFeePolicy(transactionType);
  if (!policy.isActive) return 0;
  const calculated = policy.feeType === 'percentage'
    ? amount * (policy.percentage || 0) / 100
    : policy.fixedAmount || 0;
  return Math.max(policy.minAmount || 0, Math.min(policy.maxAmount ?? Number.MAX_SAFE_INTEGER, calculated));
}
