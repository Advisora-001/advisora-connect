import { Request, Response } from 'express';
import axios from 'axios';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import LawyerProfile from '../models/LawyerProfile';
import Subscription from '../models/Subscription';
import SubscriptionPayment from '../models/SubscriptionPayment';
import PaymentWebhookEvent from '../models/PaymentWebhookEvent';
import Lead from '../models/Lead';
import Appointment from '../models/Appointment';
import PaymentRecord from '../models/PaymentRecord';
import { sendEmail } from '../services/email';
import { createNotification } from './notificationController';
import { createGoogleMeetEvent } from '../services/googleCalendar';
import Wallet from '../models/Wallet';


const PAYSTACK_BASE = 'https://api.paystack.co';

const activateMembershipPayment = async (reference: string, data: any) => {
  const payment = await SubscriptionPayment.findOne({ paystackRef: reference });
  if (!payment) throw new Error('Pending membership payment record not found.');
  if (Math.round(payment.amount * 100) !== data.amount ||
    (typeof data.currency === 'string' && data.currency.toUpperCase() !== payment.currency.toUpperCase())) {
    throw new Error('Payment amount or currency does not match the pending membership payment.');
  }
  if (payment.status === 'completed') return;
  if (payment.status !== 'pending') throw new Error('Membership payment is not pending.');

  const subscription = await Subscription.findById(payment.subscriptionId);
  if (!subscription) throw new Error('Membership subscription record not found.');
  if (subscription.status !== 'active') {
    await Subscription.updateMany(
      subscription.firmId
        ? { firmId: subscription.firmId, status: 'active', _id: { $ne: subscription._id } }
        : { userId: subscription.userId, status: 'active', _id: { $ne: subscription._id } },
      { status: 'cancelled' },
    );
    const startDate = new Date();
    const endDate = new Date(startDate);
    if (subscription.billingInterval === 'year') endDate.setFullYear(endDate.getFullYear() + 1);
    else endDate.setMonth(endDate.getMonth() + 1);
    subscription.status = 'active';
    subscription.startDate = startDate;
    subscription.endDate = endDate;
    await subscription.save();

    if (subscription.userId) {
      const profile = await LawyerProfile.findOne({ userId: subscription.userId });
      if (profile) {
        profile.subscription = {
          plan: subscription.plan,
          status: 'active',
          startDate,
          endDate,
        };
        await profile.save();
      }
    }
  }

  payment.status = 'completed';
  payment.paidAt = new Date();
  await payment.save();
};

// @desc    Initialize Paystack payment
// @route   POST /api/payments/initialize
const initializePayment = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, metadata } = req.body;
    const user = req.user;

    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0 || !metadata || typeof metadata !== 'object') {
      return res.status(400).json({ message: 'Amount and metadata are required' });
    }

    let platformFee = 0;
    // Validate amount for consultation bookings
    if (metadata?.type === 'consultation' && metadata.appointmentId) {
      const appointment = await Appointment.findById(metadata.appointmentId);
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      if (appointment.paymentStatus === 'paid') {
        return res.status(400).json({ message: 'Appointment already paid' });
      }
      if (appointment.clientId.toString() !== user?._id.toString()) {
        return res.status(403).json({ message: "You cannot pay for another client's appointment." });
      }
      if (amount !== appointment.totalAmount) {
        return res.status(400).json({ message: `Amount mismatch: expected ${appointment.totalAmount}, got ${amount}` });
      }
      platformFee = appointment.platformFee;
    }

    const response = await axios.post(
      `${PAYSTACK_BASE}/transaction/initialize`,
      {
        email: user?.email,
        amount: amount * 100, // Paystack uses kobo
        metadata: {
          ...metadata,
          userId: user?._id?.toString(),
          platformFee,
        },
        callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.data.status) {
      return res.status(400).json({ message: 'Paystack initialization failed', data: response.data });
    }

    res.json(response.data.data);
  } catch (error: any) {
    console.error('Payment initialization error:', error.response?.data || error.message);
    res.status(500).json({ 
      message: 'Payment initialization failed', 
      error: process.env.NODE_ENV === 'development' ? error.response?.data || (error as Error).message : undefined 
    });
  }
};

// @desc    Verify Paystack payment
// @route   POST /api/payments/verify
const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { reference } = req.body;
    if (!reference) {
      return res.status(400).json({ message: 'Reference is required' });
    }

    const response = await axios.get(
      `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const payload = response.data;
    const data = payload?.data;
    const meta = data?.metadata;

    if (payload?.status === true && data?.status === 'success' && meta?.type === 'membership_subscription') {
      try {
        await activateMembershipPayment(reference, data);
      } catch (activationError) {
        return res.status(400).json({ message: (activationError as Error).message });
      }
    }

    // Consultation payments: mark appointment as paid
    if (payload?.status === true && data?.status === 'success' && meta?.type === 'consultation' && meta?.appointmentId) {
      const appointmentRecord = await Appointment.findById(meta.appointmentId);
      if (!appointmentRecord) {
        return res.status(404).json({ message: 'Appointment not found.' });
      }
      if (data.amount !== Math.round(appointmentRecord.totalAmount * 100) ||
        appointmentRecord.clientId.toString() !== String(meta.userId)) {
        return res.status(400).json({ message: 'Payment does not match the appointment.' });
      }
      const appointment = await Appointment.findByIdAndUpdate(
        meta.appointmentId,
        {
          paymentStatus: 'paid',
          paymentRef: reference,
          status: 'confirmed',
        },
        { new: true }
      );

      if (appointment) {
        await PaymentRecord.create({
          userId: meta.userId,
          appointmentId: meta.appointmentId,
          lawyerId: appointment.lawyerId,
          clientId: appointment.clientId,
          amount: appointment.totalAmount,
          platformFee: appointment.platformFee,
          lawyerAmount: appointment.consultationFee,
          paystackRef: reference,
          status: 'completed',
        });

        // Update lead status to booked after successful payment
        if (appointment.leadId) {
          await Lead.findByIdAndUpdate(appointment.leadId, { status: 'booked', paymentStatus: 'paid', paymentRef: reference });
        }

        // Send payment confirmation email to lawyer
        try {
          const lawyer: any = await LawyerProfile.findById(appointment.lawyerId).populate('userId', 'firstName lastName email');
          const client: any = await User.findById(appointment.clientId).select('firstName lastName email');
          if ((lawyer as any)?.userId?.email) {
            await sendEmail({
              to: (lawyer as any).userId.email,
              subject: 'New Consultation Payment Received - Advisora Connect',
              html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #1B2A4A;">Payment Confirmed!</h2>
                <p>A consultation payment has been received:</p>
                <p><strong>Client:</strong> ${client?.firstName} ${client?.lastName}</p>
                <p><strong>Amount:</strong> ₦${(appointment.consultationFee || 0).toLocaleString()}</p>
                <p><strong>Reference:</strong> ${reference}</p>
                <p>The consultation has been confirmed. Please check your dashboard for details.</p>
              </div>`
            });
          }
        } catch (notifyErr) {
          console.error('Failed to send payment notification:', notifyErr);
        }

        // Send in-app notification to lawyer
        try {
          await createNotification(
            appointment.lawyerId.toString(),
            'payment_received',
            'Payment Received',
            `Payment of ₦${(appointment.consultationFee || 0).toLocaleString()} received for a consultation`,
            `/dashboard/lawyer`
          );
        } catch {}

        // Credit lawyer wallet
        try {
          const lawyerAmount = appointment.consultationFee || 0;
          if (lawyerAmount > 0) {
            let wallet = await Wallet.findOne({ lawyerId: appointment.lawyerId });
            if (!wallet) {
              wallet = new Wallet({ lawyerId: appointment.lawyerId, balance: 0, totalEarned: 0, pendingBalance: 0 });
            }
            wallet.balance += lawyerAmount;
            wallet.totalEarned += lawyerAmount;
            wallet.transactions.push({
              type: 'credit',
              amount: lawyerAmount,
              description: `Consultation payment - ${appointment.consultationType}`,
              appointmentId: appointment._id,
            });
            await wallet.save();
            console.log(`Wallet credited for lawyer ${appointment.lawyerId}: ₦${lawyerAmount}`);
          }
        } catch (walletErr) {
          console.error('Failed to credit lawyer wallet:', walletErr);
        }

        // Auto-generate Google Meet link after payment
        try {
          const lawyer: any = await LawyerProfile.findById(appointment.lawyerId).populate('userId', 'firstName lastName email');
          const client: any = await User.findById(appointment.clientId).select('firstName lastName email');
          const lawyerUser = (lawyer as any)?.userId;
          const summary = `Consultation: ${lawyerUser?.firstName || 'Lawyer'} & ${client?.firstName || 'Client'}`;
          const description = `Advisora Connect Consultation\nService: ${appointment.consultationType}\nDuration: ${appointment.duration} minutes`;
          const attendees = [lawyerUser?.email, client?.email].filter(Boolean) as string[];

          const meetLink = await createGoogleMeetEvent(
            summary,
            description,
            appointment.date,
            appointment.duration,
            attendees,
          );

          if (meetLink) {
            await Appointment.findByIdAndUpdate(appointment._id, {
              meetingLink: meetLink,
              completionSource: 'auto',
            });
            console.log(`Google Meet link auto-generated for appointment ${appointment._id}`);
          }
        } catch (meetErr) {
          console.error('Failed to auto-generate Meet link:', meetErr);
        }
      }
    }

    res.json(payload);
  } catch (error: any) {
    console.error('Payment verification error:', error.response?.data || error.message);
    res.status(500).json({ 
      message: 'Verification failed', 
      error: process.env.NODE_ENV === 'development' ? error.response?.data || (error as Error).message : undefined 
    });
  }
};

// @desc    Paystack webhook
// @route   POST /api/payments/webhook
const handleWebhook = async (req: Request, res: Response) => {
  let eventId = '';
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const signature = req.headers['x-paystack-signature'];
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!secret || typeof signature !== 'string' || !rawBody) {
      return res.status(401).json({ message: 'A valid payment provider signature is required.' });
    }
    const expectedSignature = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
    const provided = Buffer.from(signature, 'hex');
    const expected = Buffer.from(expectedSignature, 'hex');
    if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
      return res.status(401).json({ message: 'Invalid payment provider signature.' });
    }

    const event = req.body;
    const reference = typeof event?.data?.reference === 'string' ? event.data.reference : '';
    const providerEventId = event?.data?.id || reference;
    if (!providerEventId || typeof event?.event !== 'string') {
      return res.status(400).json({ message: 'Payment provider event is missing its identifier.' });
    }
    eventId = `${String(providerEventId)}:${event.event}`;
    try {
      await PaymentWebhookEvent.create({
        eventId,
        eventType: event.event,
        reference: reference || eventId,
        status: 'processing',
      });
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
      const previousEvent = await PaymentWebhookEvent.findOne({ eventId });
      return res.sendStatus(previousEvent?.status === 'processed' ? 200 : 503);
    }

    if (event.event === 'charge.success') {
      const { metadata } = event.data;
      const { type, userId, leadId } = metadata || {};

      if (type === 'membership_subscription' && reference) {
        await activateMembershipPayment(reference, event.data);
      }

      // Older client-created subscription checkouts are intentionally ignored. New
      // memberships must have a server-created, amount-checked payment record.
      if (type === 'subscription') {
        console.warn('Ignoring legacy subscription payment event without a pending membership payment record.');
      }

      if (type === 'lead' && leadId) {
        await Lead.findByIdAndUpdate(leadId, {
          paymentStatus: 'paid',
          status: 'paid',
          paymentRef: reference,
        });
      }

      if (type === 'featured' && userId) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);

        await LawyerProfile.findOneAndUpdate(
          { userId },
          {
            'featuredListing.isActive': true,
            'featuredListing.startDate': startDate,
            'featuredListing.endDate': endDate,
          }
        );
      }

      if (type === 'consultation' && metadata?.appointmentId) {
        const appointment = await Appointment.findByIdAndUpdate(
          metadata.appointmentId,
          {
            paymentStatus: 'paid',
            paymentRef: reference,
            status: 'confirmed',
          },
          { new: true }
        );

        if (appointment) {
          await PaymentRecord.create({
            userId,
            appointmentId: metadata.appointmentId,
            lawyerId: appointment.lawyerId,
            clientId: appointment.clientId,
            amount: appointment.totalAmount,
            platformFee: appointment.platformFee,
            lawyerAmount: appointment.consultationFee,
            paystackRef: reference,
            status: 'completed',
          });

          // Send payment confirmation email to lawyer
          try {
            const lawyer: any = await LawyerProfile.findById(appointment.lawyerId).populate('userId', 'firstName lastName email');
            const clientUser: any = await User.findById(appointment.clientId).select('firstName lastName email');
            if ((lawyer as any)?.userId?.email) {
              await sendEmail({
                to: (lawyer as any).userId.email,
                subject: 'New Consultation Payment Received - Advisora Connect',
                html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #1B2A4A;">Payment Confirmed!</h2>
                  <p>A consultation payment has been received:</p>
                  <p><strong>Client:</strong> ${clientUser?.firstName} ${clientUser?.lastName}</p>
                  <p><strong>Amount:</strong> ₦${(appointment.consultationFee || 0).toLocaleString()}</p>
                  <p><strong>Reference:</strong> ${reference}</p>
                  <p>The consultation has been confirmed. Please check your dashboard for details.</p>
                </div>`
              });
            }
          } catch (notifyErr) {
            console.error('Failed to send payment notification:', notifyErr);
          }
        }
      }
    }

    await PaymentWebhookEvent.updateOne({ eventId }, { $set: { status: 'processed', processedAt: new Date() } });
    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    if (eventId) {
      try {
        await PaymentWebhookEvent.deleteOne({ eventId });
      } catch (cleanupError) {
        console.error('Failed to release payment webhook event for retry:', cleanupError);
      }
    }
    res.sendStatus(500);
  }
};

export { initializePayment, verifyPayment, handleWebhook };