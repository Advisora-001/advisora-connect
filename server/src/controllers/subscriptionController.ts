import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import ProfessionalProfile from '../models/ProfessionalProfile';
import Subscription from '../models/Subscription';
import Plan from '../models/Plan';
import Lead from '../models/Lead';
import { getPaystackService } from '../services/paystack';
import { createNotification } from './notificationController';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// @desc    Get available subscription plans
// @route   GET /api/subscriptions/plans
export const getPlans = async (req: Request, res: Response) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ 'price.amount': 1 });

    // Format for frontend
    const formattedPlans = plans.map(plan => ({
      key: plan.key,
      name: plan.name,
      description: plan.description,
      isFree: plan.isFree,
      billingInterval: plan.billingInterval,
      price: plan.price,
      firmPrice: plan.firmPrice,
      entitlements: plan.entitlements,
      limits: plan.limits,
      includedSeats: plan.includedSeats,
      additionalSeatPrice: plan.additionalSeatPrice,
    }));

    res.json({ plans: formattedPlans });
  } catch (error: any) {
    console.error('Get plans error:', error);
    res.status(500).json({ message: 'Failed to fetch plans' });
  }
};

// @desc    Get current user's subscription
// @route   GET /api/subscriptions/current
export const getCurrentSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const subscription = await Subscription.findOne({
      userId,
      status: { $in: ['active', 'trialing', 'past_due'] }
    }).populate('planId').sort({ createdAt: -1 });

    if (!subscription) {
      return res.json({ subscription: null });
    }

    // Check if subscription has expired
    const now = new Date();
    let status = subscription.status;
    if (subscription.endDate < now && status === 'active') {
      status = 'expired';
      // Update in background
      Subscription.findByIdAndUpdate(subscription._id, { status: 'expired' }).exec();
    }

    res.json({ subscription: { ...subscription.toObject(), status } });
  } catch (error: any) {
    console.error('Get current subscription error:', error);
    res.status(500).json({ message: 'Failed to fetch subscription' });
  }
};

// @desc    Initialize subscription checkout
// @route   POST /api/subscriptions/checkout
export const createSubscriptionCheckout = async (req: AuthRequest, res: Response) => {
  try {
    const { planKey, billingInterval = 'monthly' } = req.body;

    // Check authentication first
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const authUser = req.user;

    if (!planKey) {
      return res.status(400).json({ message: 'Plan key is required' });
    }

    // Get plan details
    const plan = await Plan.findOne({ key: planKey, isActive: true });
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    if (plan.isFree) {
      return res.status(400).json({ message: 'Free plan does not require checkout' });
    }

    // Check if user already has active subscription
    const existingSubscription = await Subscription.findOne({
      userId: authUser._id,
      status: { $in: ['active', 'trialing'] }
    });

    if (existingSubscription && existingSubscription.status === 'active') {
      return res.status(400).json({
        message: 'You already have an active subscription. Cancel or wait for expiry to change plans.'
      });
    }

    // Get or create Paystack customer
    const paystack = getPaystackService();

    let customerCode: string;
    const userDoc = await User.findById(authUser._id).select('+paystackCustomerCode');

    // Ensure userDoc exists and has paystackCustomerCode
    if (!userDoc) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Store paystack customer code on user if not exists
    if (!userDoc.paystackCustomerCode) {
      const customer = await paystack.createCustomer(userDoc.email!, {
        userId: userDoc._id.toString(),
        role: userDoc.role,
      });
      customerCode = customer.customer_code;
      await User.findByIdAndUpdate(userDoc._id, { paystackCustomerCode: customerCode });
    } else {
      customerCode = userDoc.paystackCustomerCode;
    }

    // Get Paystack plan code from our plan
    // In production, you'd store paystackPlanCode on the Plan model
    // For now, we'll create a mapping or fetch from Paystack
    const paystackPlans = await paystack.listPlans(true);
    const paystackPlan = paystackPlans.find(p => p.name.toLowerCase() === plan.name.toLowerCase());

    if (!paystackPlan) {
      return res.status(500).json({ message: 'Paystack plan not configured for this plan' });
    }

    // Initialize subscription transaction
    const amount = billingInterval === 'yearly' ? plan.price.amount * 12 * 0.9 : plan.price.amount; // 10% discount for yearly
    const reference = `sub_${authUser._id}_${Date.now()}`;

    const initResponse = await paystack.initializeTransaction({
      email: authUser.email!,
      amount: amount * 100, // Convert to kobo
      currency: 'NGN',
      reference,
      callback_url: `${process.env.FRONTEND_URL}/subscription/success?reference={reference}`,
      metadata: {
        type: 'subscription',
        userId: authUser._id.toString(),
        planKey: plan.key,
        billingInterval,
      },
      plan: paystackPlan.plan_code,
    });

    // Create pending subscription record
    const subscription = await Subscription.create({
      userId: authUser._id,
      planId: plan._id,
      plan: plan.key,
      status: 'pending',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Temporary
      autoRenew: true,
      paystackRef: reference,
      amount: amount,
      currency: 'NGN',
      billingInterval,
      planSnapshot: {
        name: plan.name,
        key: plan.key,
        entitlements: plan.entitlements,
        limits: plan.limits,
      },
    });

    res.json({
      authorizationUrl: initResponse.data.authorization_url,
      accessCode: initResponse.data.access_code,
      reference,
      subscriptionId: subscription._id,
    });
  } catch (error: any) {
    console.error('Subscription checkout error:', error);
    res.status(500).json({
      message: 'Failed to initialize subscription checkout',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Verify subscription payment
// @route   POST /api/subscriptions/verify
export const verifySubscription = async (req: Request, res: Response) => {
  try {
    const { reference } = req.body;
    if (!reference) {
      return res.status(400).json({ message: 'Reference is required' });
    }

    const paystack = getPaystackService();
    const verification = await paystack.verifyTransaction(reference);

    if (!verification.status || verification.data.status !== 'success') {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    const data = verification.data;
    const meta = data.metadata;

    if (meta?.type !== 'subscription') {
      return res.status(400).json({ message: 'Invalid payment type' });
    }

    const userId = meta.userId as string;
    const planKey = meta.planKey;
    const billingInterval = meta.billingInterval;

    // Update subscription record
    const subscription = await Subscription.findOneAndUpdate(
      { paystackRef: reference },
      {
        status: 'active',
        paystackSubscriptionCode: data.subscription?.subscription_code,
        paystackCustomerCode: data.customer?.customer_code,
        startDate: new Date(data.paid_at),
        endDate: new Date(data.subscription?.next_payment_date || Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      { new: true }
    );

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription record not found' });
    }

    // Update user's professional profile with subscription info
    await ProfessionalProfile.findOneAndUpdate(
      { userId },
      {
        $set: {
          'subscription.plan': subscription.plan,
          'subscription.status': 'active',
          'subscription.startDate': subscription.startDate,
          'subscription.endDate': subscription.endDate,
        },
      },
    );

    // Create notification
    try {
      await createNotification(
        userId,
        'subscription_activated',
        'Subscription Activated',
        `Your ${subscription.plan} subscription is now active`,
        '/dashboard/professional'
      );
    } catch {}

    res.json({
      success: true,
      subscription: subscription.toObject(),
      message: 'Subscription activated successfully'
    });
  } catch (error: any) {
    console.error('Subscription verification error:', error);
    res.status(500).json({
      message: 'Verification failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Cancel subscription (at period end)
// @route   POST /api/subscriptions/cancel
export const cancelSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const subscription = await Subscription.findOne({
      userId,
      status: { $in: ['active', 'trialing'] }
    });

    if (!subscription) {
      return res.status(404).json({ message: 'No active subscription found' });
    }

    const paystack = getPaystackService();

    if (subscription.paystackSubscriptionCode) {
      // Cancel at period end in Paystack
      await paystack.cancelSubscription(
        subscription.paystackSubscriptionCode,
        'cancel_at_period_end'
      );
    }

    // Update local record
    subscription.status = 'cancelled';
    subscription.autoRenew = false;
    subscription.cancelAtPeriodEnd = true;
    await subscription.save();

    // Update professional profile
    await ProfessionalProfile.findOneAndUpdate(
      { userId },
      { $set: { 'subscription.status': 'cancelled' } }
    );

    res.json({ message: 'Subscription will be cancelled at the end of the current billing period' });
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ message: 'Failed to cancel subscription' });
  }
};

// @desc    Reactivate cancelled subscription
// @route   POST /api/subscriptions/reactivate
export const reactivateSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const subscription = await Subscription.findOne({
      userId,
      status: 'cancelled',
      cancelAtPeriodEnd: true
    });

    if (!subscription) {
      return res.status(404).json({ message: 'No cancellable subscription found' });
    }

    const paystack = getPaystackService();

    if (subscription.paystackSubscriptionCode) {
      await paystack.enableSubscription(subscription.paystackSubscriptionCode, 'enable');
    }

    subscription.status = 'active';
    subscription.autoRenew = true;
    subscription.cancelAtPeriodEnd = false;
    await subscription.save();

    await ProfessionalProfile.findOneAndUpdate(
      { userId },
      { $set: { 'subscription.status': 'active' } }
    );

    res.json({ message: 'Subscription reactivated successfully' });
  } catch (error: any) {
    console.error('Reactivate subscription error:', error);
    res.status(500).json({ message: 'Failed to reactivate subscription' });
  }
};

// @desc    Upgrade/downgrade subscription
// @route   POST /api/subscriptions/change-plan
export const changePlan = async (req: AuthRequest, res: Response) => {
  try {
    const { newPlanKey } = req.body;
    const userId = req.user?._id;

    if (!userId || !newPlanKey) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    const newPlan = await Plan.findOne({ key: newPlanKey, isActive: true });
    if (!newPlan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const subscription = await Subscription.findOne({
      userId,
      status: { $in: ['active', 'trialing'] }
    });

    if (!subscription) {
      return res.status(404).json({ message: 'No active subscription to change' });
    }

    // For now, cancel current and create new (Paystack handles proration)
    // In production, use Paystack's subscription update with proration
    const paystack = getPaystackService();

    if (subscription.paystackSubscriptionCode) {
      await paystack.cancelSubscription(subscription.paystackSubscriptionCode, 'cancel_immediately');
    }

    // Create new checkout for the new plan
    // Redirect to checkout flow
    res.json({
      message: 'Please complete checkout for the new plan',
      redirectTo: `/subscription/checkout?planKey=${newPlanKey}`
    });
  } catch (error: any) {
    console.error('Change plan error:', error);
    res.status(500).json({ message: 'Failed to change plan' });
  }
};

// @desc    Get subscription usage stats
// @route   GET /api/subscriptions/usage
export const getSubscriptionUsage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const subscription = await Subscription.findOne({
      userId,
      status: { $in: ['active', 'trialing'] }
    }).populate('planId');

    if (!subscription) {
      return res.json({ subscription: null, usage: null });
    }

    const plan = subscription.planId as any;
    const profile = await ProfessionalProfile.findOne({ userId });

    // Calculate current usage
    const enquiriesThisMonth = await Lead.countDocuments({
      lawyerId: profile?._id,
      createdAt: { $gte: new Date(new Date().setDate(1)) } // Start of current month
    });

    const profilesCount = await ProfessionalProfile.countDocuments({ userId });

    res.json({
      subscription: subscription.toObject(),
      usage: {
        profiles: {
          current: profilesCount,
          limit: plan?.limits?.maxProfiles || 1,
        },
        services: {
          current: profile?.services?.length || 0,
          limit: plan?.limits?.maxServices || 3,
        },
        enquiries: {
          current: enquiriesThisMonth,
          limit: plan?.limits?.maxEnquiriesPerMonth || 50,
        },
        teamSeats: {
          current: 1, // TODO: count firm members
          limit: plan?.includedSeats || 1,
        },
      }
    });
  } catch (error: any) {
    console.error('Get subscription usage error:', error);
    res.status(500).json({ message: 'Failed to fetch usage' });
  }
};