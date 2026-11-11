import { Request, Response } from 'express';
import crypto from 'crypto';
import axios from 'axios';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import ProfessionalCategory from '../models/ProfessionalCategory';
import MembershipPlan from '../models/MembershipPlan';
import PlatformFeePolicy from '../models/PlatformFeePolicy';
import Subscription from '../models/Subscription';
import SubscriptionPayment from '../models/SubscriptionPayment';
import Firm from '../models/Firm';
import ProfessionalProfile from '../models/ProfessionalProfile';
import User from '../models/User';

const PAYSTACK_BASE = 'https://api.paystack.co';

const getPublicCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await ProfessionalCategory.find({ isActive: true }).sort({ label: 1 });
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load professional categories', error: (error as Error).message });
  }
};

const getPublicCategory = async (req: Request, res: Response) => {
  try {
    const category = await ProfessionalCategory.findOne({ key: req.params.key, isActive: true });
    if (!category) return res.status(404).json({ message: 'Professional category not found.' });
    res.json({ category });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load professional category', error: (error as Error).message });
  }
};

const getPublicPlans = async (_req: Request, res: Response) => {
  try {
    const plans = await MembershipPlan.find({ isActive: true }).sort({ tier: 1, name: 1 });
    res.json({ plans });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load membership plans', error: (error as Error).message });
  }
};

const getMembershipConfig = async (_req: AuthRequest, res: Response) => {
  try {
    const [categories, plans, platformFeePolicy] = await Promise.all([
      ProfessionalCategory.find().sort({ label: 1 }),
      MembershipPlan.find().sort({ tier: 1, name: 1 }),
      PlatformFeePolicy.findOne({ key: 'default' }),
    ]);
    res.json({ categories, plans, platformFeePolicy });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load membership configuration', error: (error as Error).message });
  }
};

const saveCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { key, label, pluralLabel, description, isActive, registrationFields, verificationRequirements, specializations, serviceTypes, consultationOptions } = req.body;
    if (typeof key !== 'string' || !/^[a-z0-9-]{2,50}$/.test(key.trim().toLowerCase())) {
      return res.status(400).json({ message: 'Category key must contain 2–50 lowercase letters, numbers, or hyphens.' });
    }
    if (typeof label !== 'string' || !label.trim() || typeof pluralLabel !== 'string' || !pluralLabel.trim()) {
      return res.status(400).json({ message: 'Category singular and plural labels are required.' });
    }
    const category = await ProfessionalCategory.findOneAndUpdate(
      { key: key.trim().toLowerCase() },
      { key: key.trim().toLowerCase(), label: label.trim(), pluralLabel: pluralLabel.trim(), description, isActive, registrationFields, verificationRequirements, specializations, serviceTypes, consultationOptions },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json({ category });
  } catch (error) {
    res.status(400).json({ message: 'Failed to save professional category', error: (error as Error).message });
  }
};

const savePlan = async (req: AuthRequest, res: Response) => {
  try {
    const { key, name, tier, description, isActive, currency, individualPrices, firmPrices, benefits } = req.body;
    if (typeof key !== 'string' || !/^[a-z0-9-]{2,50}$/.test(key.trim().toLowerCase())) {
      return res.status(400).json({ message: 'Plan key must contain 2–50 lowercase letters, numbers, or hyphens.' });
    }
    if (!['basic', 'premium'].includes(tier)) {
      return res.status(400).json({ message: 'Plan tier must be basic or premium.' });
    }
    if (tier === 'basic') {
      if (isActive === false) {
        return res.status(400).json({ message: 'Basic membership must remain active.' });
      }
      if (!Array.isArray(individualPrices) || !individualPrices.some((price: { interval?: string }) => price.interval === 'month') ||
        !Array.isArray(firmPrices) || !firmPrices.some((price: { interval?: string }) => price.interval === 'month')) {
        return res.status(400).json({ message: 'Basic membership requires free monthly individual and firm pricing.' });
      }
      const amounts = [...(individualPrices || []).map((price: { amount: number }) => price.amount), ...(firmPrices || []).map((price: { amount: number }) => price.amount)];
      if (amounts.some((amount: number) => amount !== 0)) {
        return res.status(400).json({ message: 'Basic membership must remain free.' });
      }
      if (benefits?.directoryListing === false || benefits?.receiveEnquiries === false || benefits?.respondToEnquiries === false) {
        return res.status(400).json({ message: 'Basic membership must include directory listing and ordinary enquiry receipt and responses.' });
      }
    }
    const plan = await MembershipPlan.findOneAndUpdate(
      { key: key.trim().toLowerCase() },
      { key: key.trim().toLowerCase(), name, tier, description, isActive, currency, individualPrices, firmPrices, benefits },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json({ plan });
  } catch (error) {
    res.status(400).json({ message: 'Failed to save membership plan', error: (error as Error).message });
  }
};

const savePlatformFeePolicy = async (req: AuthRequest, res: Response) => {
  try {
    const { isActive, type, amount, currency, appliesTo } = req.body;
    if (!['fixed', 'percentage'].includes(type) || typeof amount !== 'number' || amount < 0 || (type === 'percentage' && amount > 100)) {
      return res.status(400).json({ message: 'Provide a valid fixed or percentage transaction fee.' });
    }
    const policy = await PlatformFeePolicy.findOneAndUpdate(
      { key: 'default' },
      { key: 'default', isActive, type, amount, currency, appliesTo },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json({ platformFeePolicy: policy });
  } catch (error) {
    res.status(400).json({ message: 'Failed to save transaction fee policy', error: (error as Error).message });
  }
};

const startMembership = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !['professional', 'lawyer'].includes(req.user.role)) {
      return res.status(403).json({ message: 'A professional account is required to manage membership.' });
    }
    const { planKey, interval = 'month', firmId } = req.body;
    if (typeof planKey !== 'string' || !['month', 'year'].includes(interval)) {
      return res.status(400).json({ message: 'Select a valid plan and billing interval.' });
    }
    if (firmId !== undefined && (typeof firmId !== 'string' || !mongoose.isValidObjectId(firmId))) {
      return res.status(400).json({ message: 'Select a valid firm workspace.' });
    }

    const plan = await MembershipPlan.findOne({ key: planKey, isActive: true });
    if (!plan) return res.status(404).json({ message: 'Membership plan not found.' });

    const firm = firmId ? await Firm.findOne({ _id: firmId, 'members.userId': req.user?._id, 'members.status': 'active' }) : null;
    if (firmId && (!firm || !firm.members.some((member) => member.userId?.toString() === req.user?._id.toString() && ['owner', 'admin'].includes(member.role)))) {
      return res.status(403).json({ message: 'Only an active firm administrator can manage its membership.' });
    }

    const pricing = firm
      ? plan.firmPrices.find((item) => item.interval === interval)
      : plan.individualPrices.find((item) => item.interval === interval);
    if (!pricing) return res.status(400).json({ message: 'This plan is not configured for the selected membership type and billing interval.' });

    const memberCount = firm ? firm.members.filter((member) => member.status !== 'suspended').length : 1;
    const planSeatLimit = Number(plan.benefits.maxSeats);
    if (firm && Number.isFinite(planSeatLimit) && planSeatLimit >= 0 && memberCount > planSeatLimit) {
      return res.status(400).json({ message: `This plan supports up to ${planSeatLimit} firm seat(s); reduce current firm members before downgrading.` });
    }
    const firmPricing = pricing as {
      amount: number;
      includedSeats?: number;
      additionalSeatAmount?: number;
    };
    const includedSeats = firmPricing.includedSeats ?? 1;
    const amount = firm
      ? pricing.amount + Math.max(0, memberCount - includedSeats) * (firmPricing.additionalSeatAmount ?? 0)
      : pricing.amount;
    if (plan.tier === 'basic' || amount === 0) {
      const startDate = new Date();
      await Subscription.updateMany(
        firm ? { firmId: firm._id, status: 'active' } : { userId: req.user?._id, status: 'active' },
        { status: 'cancelled' },
      );
      const subscription = await Subscription.create({
        ownerType: firm ? 'firm' : 'individual',
        userId: firm ? undefined : req.user?._id,
        firmId: firm?._id,
        plan: plan.tier,
        planKey: plan.key,
        tier: plan.tier,
        planSnapshot: plan.toObject(),
        billingInterval: interval,
        status: 'active',
        startDate,
        endDate: undefined,
        amount: 0,
        autoRenew: false,
      });
      return res.status(201).json({ message: 'Basic membership activated.', subscription });
    }

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return res.status(503).json({ message: 'Membership payments are not configured.' });

    const startDate = new Date();
    const endDate = new Date(startDate);
    if (interval === 'month') endDate.setMonth(endDate.getMonth() + 1);
    else endDate.setFullYear(endDate.getFullYear() + 1);
    const reference = `membership_${crypto.randomUUID()}`;

    const subscription = await Subscription.create({
      ownerType: firm ? 'firm' : 'individual',
      userId: firm ? undefined : req.user?._id,
      firmId: firm?._id,
      plan: plan.tier,
      planKey: plan.key,
      tier: plan.tier,
      planSnapshot: plan.toObject(),
      billingInterval: interval,
      status: 'expired',
      startDate,
      endDate,
      amount,
      autoRenew: false,
      paystackRef: reference,
    });
    await SubscriptionPayment.create({
      subscriptionId: subscription._id,
      userId: firm ? undefined : req.user?._id,
      firmId: firm?._id,
      amount,
      currency: plan.currency,
      paystackRef: reference,
      status: 'pending',
    });

    const response = await axios.post(
      `${PAYSTACK_BASE}/transaction/initialize`,
      {
        email: firm?.email || req.user?.email,
        amount: Math.round(amount * 100),
        currency: plan.currency,
        reference,
        metadata: { type: 'membership_subscription', subscriptionId: subscription._id.toString(), firmId: firm?._id.toString() },
        callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
      },
      { headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' } }
    );
    if (!response.data?.status) {
      await SubscriptionPayment.findOneAndUpdate({ paystackRef: reference }, { status: 'failed' });
      return res.status(502).json({ message: 'Membership payment initialization failed.' });
    }

    res.status(201).json({ subscriptionId: subscription._id, reference, ...response.data.data });
  } catch (error) {
    res.status(500).json({ message: 'Failed to start membership', error: (error as Error).message });
  }
};

const getMyMembership = async (req: AuthRequest, res: Response) => {
  try {
    const firmIds = await Firm.distinct('_id', { 'members.userId': req.user?._id, 'members.status': 'active' });
    const activeSubscriptionFilter = {
      status: 'active',
      $or: [{ endDate: { $exists: false } }, { endDate: { $gt: new Date() } }],
    };
    const [subscription, firmMemberships, firmSubscriptions] = await Promise.all([
      Subscription.findOne({ ...activeSubscriptionFilter, userId: req.user?._id }).sort({ createdAt: -1 }),
      Firm.find({ 'members.userId': req.user?._id, 'members.status': 'active' }).select('name type ownerUserId members'),
      Subscription.find({ ...activeSubscriptionFilter, firmId: { $in: firmIds } }).sort({ createdAt: -1 }),
    ]);
    res.json({ subscription, firmMemberships, firmSubscriptions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load membership', error: (error as Error).message });
  }
};

const createFirm = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !['professional', 'lawyer'].includes(req.user.role)) {
      return res.status(403).json({ message: 'A professional account is required to create a firm workspace.' });
    }
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const submittedCategories = req.body.categories ?? [];
    if (!Array.isArray(submittedCategories) || submittedCategories.some((category: unknown) => typeof category !== 'string')) {
      return res.status(400).json({ message: 'Firm categories must be a list of professional category keys.' });
    }
    const categories = [...new Set(submittedCategories as string[])];
    if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'A firm name and valid contact email are required.' });
    }
    const existingProfiles = await ProfessionalProfile.find({ userId: req.user?._id });
    if (categories.some((category) => !existingProfiles.some((profile) => profile.category === category))) {
      return res.status(400).json({ message: 'A firm can only associate professional categories already in your account.' });
    }
    if (categories.length > 0 && await ProfessionalProfile.exists({
      userId: req.user?._id,
      category: { $in: categories },
      firmId: { $exists: true, $ne: null },
    })) {
      return res.status(409).json({ message: 'One or more selected profiles already belong to a firm workspace.' });
    }
    const firm = await Firm.create({
      name,
      email,
      type: 'firm',
      ownerUserId: req.user?._id,
      members: [{ userId: req.user?._id, email: req.user?.email, role: 'owner', status: 'active', categories, joinedAt: new Date() }],
    });
    if (categories.length > 0) {
      await ProfessionalProfile.updateMany(
        { userId: req.user?._id, category: { $in: categories } },
        { $set: { firmId: firm._id } },
      );
    }
    const basicPlan = await MembershipPlan.findOne({ tier: 'basic', isActive: true });
    if (basicPlan) {
      await Subscription.create({
        ownerType: 'firm',
        firmId: firm._id,
        plan: 'basic',
        planKey: basicPlan.key,
        tier: 'basic',
        planSnapshot: basicPlan.toObject(),
        status: 'active',
        startDate: new Date(),
        amount: 0,
        autoRenew: false,
      });
    }
    res.status(201).json({ firm });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create firm workspace', error: (error as Error).message });
  }
};

const getMyFirms = async (req: AuthRequest, res: Response) => {
  try {
    const firms = await Firm.find({ 'members.userId': req.user?._id, 'members.status': 'active' }).select('-members.inviteTokenHash');
    res.json({ firms });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load firm workspaces', error: (error as Error).message });
  }
};

const inviteFirmMember = async (req: AuthRequest, res: Response) => {
  try {
    const { email, category } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || typeof category !== 'string') {
      return res.status(400).json({ message: 'A valid email and professional category are required.' });
    }
    const [firm, professionalCategory] = await Promise.all([
      Firm.findOne({ _id: req.params.id, 'members.userId': req.user?._id, 'members.status': 'active' }),
      ProfessionalCategory.findOne({ key: category, isActive: true }),
    ]);
    if (!firm) return res.status(404).json({ message: 'Firm workspace not found.' });
    const inviter = firm.members.find((member) => member.userId?.toString() === req.user?._id.toString());
    if (!inviter || !['owner', 'admin'].includes(inviter.role)) {
      return res.status(403).json({ message: 'Only firm administrators can invite members.' });
    }
    if (!professionalCategory) return res.status(400).json({ message: 'Select an active professional category.' });

    const activeSubscription = await Subscription.findOne({
      firmId: firm._id,
      status: 'active',
      $or: [{ endDate: { $exists: false } }, { endDate: { $gt: new Date() } }],
    }).sort({ createdAt: -1 });
    const maxSeats = Number((activeSubscription?.planSnapshot as { benefits?: { maxSeats?: number } })?.benefits?.maxSeats || 1);
    const activeMembers = firm.members.filter((member) => member.status !== 'suspended').length;
    const existing = firm.members.find((member) => member.email === normalizedEmail);
    if (!existing && activeMembers >= maxSeats) {
      return res.status(403).json({ message: 'This firm plan has reached its seat limit.' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (user && !['professional', 'lawyer'].includes(user.role)) {
      return res.status(409).json({ message: 'This email belongs to a non-professional account. Invite an email registered as a professional instead.' });
    }
    const token = crypto.randomBytes(32).toString('hex');
    if (existing) {
      existing.userId = user?._id;
      existing.role = 'professional';
      existing.status = 'invited';
      existing.categories = [professionalCategory.key];
      existing.inviteTokenHash = crypto.createHash('sha256').update(token).digest('hex');
      existing.inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      existing.invitedAt = new Date();
    } else {
      firm.members.push({
        userId: user?._id,
        email: normalizedEmail,
        role: 'professional',
        status: 'invited',
        categories: [professionalCategory.key],
        invitedAt: new Date(),
        inviteTokenHash: crypto.createHash('sha256').update(token).digest('hex'),
        inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    }
    await firm.save();
    res.status(201).json({
      message: 'Firm invitation created. Share this one-time link with the professional.',
      inviteUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/firm-invitation?token=${token}`,
      category: professionalCategory.key,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to invite firm member', error: (error as Error).message });
  }
};

const acceptFirmInvitation = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !['professional', 'lawyer'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Sign in with a professional account to accept this firm invitation.' });
    }
    const token = typeof req.body.token === 'string' ? req.body.token : '';
    if (!token) return res.status(400).json({ message: 'Invitation token is required.' });
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const firm = await Firm.findOne({
      members: {
        $elemMatch: {
          email: req.user?.email,
          status: 'invited',
          inviteTokenHash: tokenHash,
          inviteExpiresAt: { $gt: new Date() },
        },
      },
    });
    if (!firm) return res.status(404).json({ message: 'Invitation not found or expired.' });
    const member = firm.members.find((item) => item.email === req.user?.email && item.status === 'invited');
    if (!member) return res.status(404).json({ message: 'Invitation not found.' });
    const activeSubscription = await Subscription.findOne({
      firmId: firm._id,
      status: 'active',
      $or: [{ endDate: { $exists: false } }, { endDate: { $gt: new Date() } }],
    }).sort({ createdAt: -1 });
    const maxProfilesPerSeat = Number(
      (activeSubscription?.planSnapshot as { benefits?: { maxProfilesPerSeat?: number } })?.benefits?.maxProfilesPerSeat ?? 3,
    );
    const userProfiles = await ProfessionalProfile.find({ userId: req.user?._id });
    if (userProfiles.some((profile) =>
      member.categories.includes(profile.category) && profile.firmId && profile.firmId.toString() !== firm._id.toString()
    )) {
      return res.status(409).json({ message: 'One or more invited professional profiles already belong to another firm workspace.' });
    }
    const assignedCategories = new Set(userProfiles.map((profile) => profile.category));
    const additionalCategories = member.categories.filter((categoryKey) => !assignedCategories.has(categoryKey));
    if (maxProfilesPerSeat >= 0 && assignedCategories.size + additionalCategories.length > maxProfilesPerSeat) {
      return res.status(403).json({ message: 'This membership has reached its professional profile limit per seat.' });
    }

    member.userId = req.user?._id;
    member.status = 'active';
    member.joinedAt = new Date();
    member.inviteTokenHash = undefined;
    member.inviteExpiresAt = undefined;
    await firm.save();

    for (const categoryKey of member.categories) {
      if (assignedCategories.has(categoryKey)) {
        await ProfessionalProfile.updateOne({ userId: req.user?._id, category: categoryKey }, { firmId: firm._id });
      } else {
        await ProfessionalProfile.create({ userId: req.user?._id, firmId: firm._id, category: categoryKey });
      }
    }
    res.json({ message: 'Firm invitation accepted.', firmId: firm._id });
  } catch (error) {
    res.status(500).json({ message: 'Failed to accept firm invitation', error: (error as Error).message });
  }
};

export {
  getPublicCategories,
  getPublicCategory,
  getPublicPlans,
  getMembershipConfig,
  saveCategory,
  savePlan,
  savePlatformFeePolicy,
  startMembership,
  getMyMembership,
  createFirm,
  getMyFirms,
  inviteFirmMember,
  acceptFirmInvitation,
};
