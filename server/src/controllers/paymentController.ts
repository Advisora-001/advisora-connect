import { Request, Response } from 'express';
import axios from 'axios';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import LawyerProfile from '../models/LawyerProfile';
import Subscription from '../models/Subscription';
import Lead from '../models/Lead';
import Appointment from '../models/Appointment';
import PaymentRecord from '../models/PaymentRecord';
import { sendEmail } from '../services/email';
import { createNotification } from './notificationController';


const PAYSTACK_BASE = 'https://api.paystack.co';
const PLATFORM_FEE_AMOUNT = Number(process.env.PLATFORM_FEE_AMOUNT) || 10000;

// @desc    Initialize Paystack payment
// @route   POST /api/payments/initialize
const initializePayment = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, metadata } = req.body;
    const user = req.user;

    if (!amount || !metadata) {
      return res.status(400).json({ message: 'Amount and metadata are required' });
    }

    // Validate amount for consultation bookings
    if (metadata?.type === 'consultation' && metadata.appointmentId) {
      const appointment = await Appointment.findById(metadata.appointmentId);
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      if (appointment.paymentStatus === 'paid') {
        return res.status(400).json({ message: 'Appointment already paid' });
      }
      if (amount !== appointment.totalAmount) {
        return res.status(400).json({ message: `Amount mismatch: expected ${appointment.totalAmount}, got ${amount}` });
      }
    }

    const response = await axios.post(
      `${PAYSTACK_BASE}/transaction/initialize`,
      {
        email: user?.email,
        amount: amount * 100, // Paystack uses kobo
        metadata: {
          ...metadata,
          userId: user?._id?.toString(),
          platformFee: PLATFORM_FEE_AMOUNT,
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

    // Consultation payments: mark appointment as paid
    if (payload?.status === true && meta?.type === 'consultation' && meta?.appointmentId) {
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
  try {
    const event = req.body;

    if (event.event === 'charge.success') {
      const { reference, metadata } = event.data;
        const { type, userId, leadId, plan } = metadata || {};

      if (type === 'subscription' && userId && plan) {
        // Create subscription record
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);

        await Subscription.create({
          userId,
          plan,
          status: 'active',
          startDate,
          endDate,
          paystackRef: reference,
          amount: event.data.amount / 100,
        });

        // Update lawyer profile subscription
        const profile = await LawyerProfile.findOne({ userId });
        if (profile) {
          profile.subscription = {
            plan,
            status: 'active',
            startDate,
            endDate,
          };
          await profile.save();
        }
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

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
};

export { initializePayment, verifyPayment, handleWebhook };