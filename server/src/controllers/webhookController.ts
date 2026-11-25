import { Request, Response } from 'express';
import Subscription from '../models/Subscription';
import ProfessionalProfile from '../models/ProfessionalProfile';
import Lead from '../models/Lead';
import Plan from '../models/Plan';
import FractionalProposal from '../models/FractionalProposal';
import { getPaystackService } from '../services/paystack';
import { createNotification } from './notificationController';
import { handleFractionalSubscriptionPayment } from './fractionalController';

interface PaystackWebhookEvent {
  event: string;
  data: {
    reference: string;
    amount: number;
    currency: string;
    status: string;
    paid_at: string;
    channel: string;
    metadata: Record<string, unknown>;
    customer: {
      customer_code: string;
      email: string;
    };
    subscription?: {
      subscription_code: string;
      plan: {
        plan_code: string;
      };
      next_payment_date?: string;
    };
  };
}

// @desc    Paystack webhook handler
// @route   POST /api/webhooks/paystack
export const handlePaystackWebhook = async (req: Request, res: Response) => {
  try {
    // Verify webhook signature
    const paystack = getPaystackService();
    const signature = req.headers['x-paystack-signature'] as string;
    const payload = JSON.stringify(req.body);

    if (!signature || !paystack.verifyWebhookSignature(payload, signature)) {
      console.warn('Invalid Paystack webhook signature');
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const event = req.body as PaystackWebhookEvent;
    console.log(`Paystack webhook: ${event.event}`, { reference: event.data.reference });

    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        await handleChargeSuccess(event);
        break;

      case 'subscription.create':
        await handleSubscriptionCreate(event);
        break;

      case 'subscription.activate':
        await handleSubscriptionActivate(event);
        break;

      case 'subscription.charge.success':
        await handleSubscriptionChargeSuccess(event);
        break;

      case 'subscription.charge.failed':
        await handleSubscriptionChargeFailed(event);
        break;

      case 'subscription.cancel':
        await handleSubscriptionCancel(event);
        break;

      case 'subscription.expiring_cards':
        await handleExpiringCards(event);
        break;

      case 'subscription.expire':
        await handleSubscriptionExpire(event);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event);
        break;

      case 'invoice.payment_success':
        await handleInvoicePaymentSuccess(event);
        break;

      default:
        console.log(`Unhandled Paystack event: ${event.event}`);
    }

    res.sendStatus(200);
  } catch (error: any) {
    console.error('Paystack webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
};

// Handle successful charge (one-time payments)
async function handleChargeSuccess(event: PaystackWebhookEvent) {
  const { reference, metadata, amount, currency, paid_at, channel } = event.data;
  const { type, userId, leadId, appointmentId, planKey, billingInterval } = metadata || {};

  console.log(`Charge success: ${type}`, { reference, amount: amount / 100 });

  // Consultation payment
  if (type === 'consultation' && appointmentId) {
    // This is handled in paymentController.verifyPayment
    // Webhook is backup - could add duplicate check here
    return;
  }

  // Lead unlock payment
  if (type === 'lead' && leadId) {
    await Lead.findByIdAndUpdate(leadId, {
      paymentStatus: 'paid',
      status: 'paid',
      paymentRef: reference,
      unlockedAt: new Date(),
    });

    // Notify lawyer
    try {
      const lead = await Lead.findById(leadId).populate('lawyerId');
      if (lead && (lead as any).lawyerId) {
        await createNotification(
          (lead as any).lawyerId.toString(),
          'lead_unlocked',
          'Lead Unlocked',
          `A lead has been unlocked and paid for`,
          `/dashboard/professional?section=enquiries`
        );
      }
    } catch {}
    return;
  }

  // Featured listing payment
  if (type === 'featured' && metadata?.userId) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    await ProfessionalProfile.findOneAndUpdate(
      { userId: metadata.userId },
      {
        $set: {
          'featuredListing.isActive': true,
          'featuredListing.startDate': startDate,
          'featuredListing.endDate': endDate,
          'featuredListing.paystackReference': metadata.reference,
        },
      }
    );

    await createNotification(
      metadata.userId as string,
      'featured_activated',
      'Featured Listing Activated',
      'Your profile is now featured for 30 days',
      '/dashboard/professional'
    );
    return;
  }

  // Subscription payment (fallback - subscription.create should handle)
  if (type === 'subscription' && metadata?.userId) {
    console.log('Charge success for subscription (handled by subscription.create)');
    return;
  }

  // Fractional GC subscription payment
  if (type === 'fractional_subscription' && metadata?.proposalId) {
    await handleFractionalSubscriptionPayment(reference);
    return;
  }
}

// Subscription lifecycle events
async function handleSubscriptionCreate(event: PaystackWebhookEvent) {
  const { data } = event;
  const { reference, metadata, paid_at, amount, currency, customer, subscription: subscriptionData } = data;
  const userId = metadata?.userId;
  const planKey = metadata?.planKey;

  console.log('Subscription created', { reference, userId, planKey });

  if (typeof userId !== 'string' || typeof planKey !== 'string') {
    console.warn('Subscription.create missing metadata');
    return;
  }

  const plan = await Plan.findOne({ key: planKey });
  if (!plan) {
    console.warn('Subscription.create references an unknown plan', { planKey });
    return;
  }

  const startDate = new Date(paid_at);
  const endDate = subscriptionData?.next_payment_date
    ? new Date(subscriptionData.next_payment_date)
    : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Create/update subscription record
  const subscription = await Subscription.findOneAndUpdate(
    { paystackRef: reference },
    {
      userId,
      plan: planKey,
      planId: plan._id,
      status: 'active',
      paystackRef: reference,
      paystackSubscriptionCode: subscriptionData?.subscription_code,
      paystackCustomerCode: customer.customer_code,
      startDate,
      endDate,
      amount: amount / 100,
      currency,
      billingInterval: plan.billingInterval,
      autoRenew: true,
      planSnapshot: {
        name: plan.name,
        key: planKey,
        entitlements: plan.entitlements,
        limits: plan.limits,
      },
    },
    { upsert: true, new: true }
  );

  // Update professional profile
  await ProfessionalProfile.findOneAndUpdate(
    { userId },
    {
      $set: {
        'subscription.plan': subscription.plan,
        'subscription.status': 'active',
        'subscription.startDate': subscription.startDate,
        'subscription.endDate': subscription.endDate,
        'subscription.paystackSubscriptionCode': subscriptionData?.subscription_code,
      },
    },
  );

  // Notify user
  await createNotification(
    userId ?? '',
    'subscription_activated',
    'Subscription Activated',
    `Your subscription is now active`,
    '/dashboard/professional'
  );
}

async function handleSubscriptionActivate(event: PaystackWebhookEvent) {
  const { data } = event;
  const subscriptionCode = data.subscription?.subscription_code;

  await Subscription.findOneAndUpdate(
    { paystackSubscriptionCode: subscriptionCode },
    { status: 'active' }
  );

  // Update professional profile
  const subscription = await Subscription.findOne({ paystackSubscriptionCode: subscriptionCode });
  if (subscription) {
    await ProfessionalProfile.findOneAndUpdate(
      { userId: subscription.userId },
      { $set: { 'subscription.status': 'active' } }
    );
  }
}

async function handleSubscriptionChargeSuccess(event: PaystackWebhookEvent) {
  const { data } = event;
  const subscriptionCode = data.subscription?.subscription_code;
  const nextPaymentDate = data.subscription?.next_payment_date;

  if (!subscriptionCode || !nextPaymentDate) {
    console.warn('Subscription charge success missing subscription code or next payment date');
    return;
  }

  // Update subscription period
  await Subscription.findOneAndUpdate(
    { paystackSubscriptionCode: subscriptionCode },
    {
      status: 'active',
      startDate: new Date(data.paid_at),
      endDate: new Date(nextPaymentDate),
      $inc: { amount: (data.amount ?? 0) / 100 }, // Track total paid
    }
  );

  // Update professional profile end date
  const subscription = await Subscription.findOne({ paystackSubscriptionCode: subscriptionCode });
  if (subscription) {
    await ProfessionalProfile.findOneAndUpdate(
      { userId: subscription.userId },
      { $set: { 'subscription.endDate': new Date(nextPaymentDate) } }
    );
  }

  // Notify user
  await createNotification(
    subscription?.userId?.toString() || '',
    'subscription_renewed',
    'Subscription Renewed',
    'Your subscription has been renewed successfully',
    '/dashboard/professional'
  );
}

async function handleSubscriptionChargeFailed(event: PaystackWebhookEvent) {
  const { data } = event;
  const subscriptionCode = data.subscription?.subscription_code;

  await Subscription.findOneAndUpdate(
    { paystackSubscriptionCode: subscriptionCode },
    { status: 'past_due' }
  );

  // Update professional profile
  const subscription = await Subscription.findOne({ paystackSubscriptionCode: subscriptionCode });
  if (subscription) {
    await ProfessionalProfile.findOneAndUpdate(
      { userId: subscription.userId },
      { $set: { 'subscription.status': 'past_due' } }
    );

    // Notify user
    await createNotification(
      subscription.userId?.toString() || '',
      'subscription_payment_failed',
      'Payment Failed',
      'Your subscription payment failed. Please update your payment method.',
      '/dashboard/professional'
    );
  }
}

async function handleSubscriptionCancel(event: PaystackWebhookEvent) {
  const { data } = event;
  const subscriptionCode = data.subscription?.subscription_code;

  await Subscription.findOneAndUpdate(
    { paystackSubscriptionCode: subscriptionCode },
    {
      status: 'cancelled',
      autoRenew: false,
      cancelAtPeriodEnd: true,
    }
  );

  const subscription = await Subscription.findOne({ paystackSubscriptionCode: subscriptionCode });
  if (subscription) {
    await ProfessionalProfile.findOneAndUpdate(
      { userId: subscription.userId },
      { $set: { 'subscription.status': 'cancelled' } }
    );
  }
}

async function handleSubscriptionExpire(event: PaystackWebhookEvent) {
  const { data } = event;
  const subscriptionCode = data.subscription?.subscription_code;

  await Subscription.findOneAndUpdate(
    { paystackSubscriptionCode: subscriptionCode },
    { status: 'expired' }
  );

  const subscription = await Subscription.findOne({ paystackSubscriptionCode: subscriptionCode });
  if (subscription) {
    await ProfessionalProfile.findOneAndUpdate(
      { userId: subscription.userId },
      { $set: { 'subscription.status': 'expired' } }
    );
  }
}

async function handleExpiringCards(event: PaystackWebhookEvent) {
  const { data } = event;
  const subscriptionCode = data.subscription?.subscription_code;

  const subscription = await Subscription.findOne({ paystackSubscriptionCode: subscriptionCode });
  if (subscription) {
    await createNotification(
      subscription.userId?.toString() || '',
      'card_expiring',
      'Card Expiring Soon',
      'Your payment card is expiring soon. Please update your payment method.',
      '/dashboard/professional'
    );
  }
}

async function handleInvoicePaymentFailed(event: PaystackWebhookEvent) {
  const { data } = event;
  const subscriptionCode = data.subscription?.subscription_code;

  await Subscription.findOneAndUpdate(
    { paystackSubscriptionCode: subscriptionCode },
    { status: 'past_due' }
  );
}

async function handleInvoicePaymentSuccess(event: PaystackWebhookEvent) {
  const { data } = event;
  const subscriptionCode = data.subscription?.subscription_code;

  await Subscription.findOneAndUpdate(
    { paystackSubscriptionCode: subscriptionCode },
    { status: 'active' }
  );
}