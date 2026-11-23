import { Request, Response } from 'express';
import Plan from '../models/Plan';
import PlatformFeePolicy from '../models/PlatformFeePolicy';
import { AuthRequest } from '../middleware/auth';

const getPlans = async (_req: Request, res: Response) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ price: 1, name: 1 }).lean();
    res.json({ plans });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load plans', error: (error as Error).message });
  }
};

const getAdminMembershipConfig = async (_req: AuthRequest, res: Response) => {
  try {
    const [plans, feePolicies] = await Promise.all([
      Plan.find().sort({ createdAt: 1 }).lean(),
      PlatformFeePolicy.find().sort({ transactionType: 1 }).lean(),
    ]);
    res.json({ plans, feePolicies });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load membership configuration', error: (error as Error).message });
  }
};

const savePlan = async (req: AuthRequest, res: Response) => {
  try {
    const { key, name, description, isActive, isFree, billingInterval, price, entitlements, limits, firmPrice, includedSeats, additionalSeatPrice } = req.body;
    if (!key || !/^[a-z0-9][a-z0-9_-]*$/i.test(key) || !name || !['monthly', 'yearly'].includes(billingInterval)) {
      return res.status(400).json({ message: 'Valid plan key, name, and billing interval are required' });
    }
    if (!price || !Number.isFinite(Number(price.amount)) || Number(price.amount) < 0) {
      return res.status(400).json({ message: 'Plan price must be a non-negative number' });
    }
    if (isActive && !isFree && Number(price.amount) <= 0) {
      return res.status(400).json({ message: 'Configure a positive price before activating a paid plan' });
    }
    if (firmPrice && (!Number.isFinite(Number(firmPrice.amount)) || Number(firmPrice.amount) < 0)) {
      return res.status(400).json({ message: 'Firm price must be a non-negative number' });
    }
    const plan = await Plan.findOneAndUpdate(
      { key: String(key).trim().toLowerCase() },
      {
        $set: {
          name,
          description: description || '',
          isActive: Boolean(isActive),
          isFree: Boolean(isFree),
          billingInterval,
          price: { amount: Number(price.amount), currency: price.currency || 'NGN' },
          entitlements: entitlements || {},
          limits: limits || {},
          firmPrice: firmPrice || { amount: Number(price.amount), currency: price.currency || 'NGN' },
          includedSeats: Number(includedSeats ?? 1),
          additionalSeatPrice: additionalSeatPrice || { amount: 0, currency: price.currency || 'NGN' },
        },
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json({ message: 'Plan saved', plan });
  } catch (error) {
    res.status(400).json({ message: 'Unable to save plan', error: (error as Error).message });
  }
};

const saveFeePolicy = async (req: AuthRequest, res: Response) => {
  try {
    const { transactionType, feeType, fixedAmount, percentage, minAmount, maxAmount, isActive } = req.body;
    if (!['consultation', 'enquiry', 'engagement', 'subscription'].includes(transactionType) ||
        !['fixed', 'percentage'].includes(feeType)) {
      return res.status(400).json({ message: 'Valid transaction type and fee type are required' });
    }
    const amount = feeType === 'fixed' ? Number(fixedAmount) : Number(percentage);
    if (!Number.isFinite(amount) || amount < 0 || (feeType === 'percentage' && amount > 100)) {
      return res.status(400).json({ message: 'Fee amount must be non-negative; percentage cannot exceed 100' });
    }
    const policy = await PlatformFeePolicy.findOneAndUpdate(
      { transactionType },
      {
        $set: {
          transactionType,
          feeType,
          fixedAmount: feeType === 'fixed' ? amount : undefined,
          percentage: feeType === 'percentage' ? amount : undefined,
          minAmount: minAmount === undefined ? undefined : Number(minAmount),
          maxAmount: maxAmount === undefined ? undefined : Number(maxAmount),
          isActive: Boolean(isActive),
        },
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json({ message: 'Fee policy saved', policy });
  } catch (error) {
    res.status(400).json({ message: 'Unable to save fee policy', error: (error as Error).message });
  }
};

export { getPlans, getAdminMembershipConfig, savePlan, saveFeePolicy };
