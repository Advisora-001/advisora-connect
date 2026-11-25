import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Resend with API key from environment
const resendApiKey = process.env.RESEND_API_KEY;
const resendDomain = process.env.RESEND_DOMAIN || 'advisora-connect.vercel.app';

let resend: Resend | null = null;
let resendReady = false;

if (resendApiKey) {
  try {
    resend = new Resend(resendApiKey);
    resendReady = true;
    console.log('Resend initialized successfully');
  } catch (error: any) {
    console.error('Failed to initialize Resend:', error.message);
  }
} else {
  console.warn('RESEND_API_KEY not set. Email sending disabled.');
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  if (!resendReady || !resend) {
    console.error('Resend not initialized. Check RESEND_API_KEY environment variable.');
    return false;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `Advisora Connect <noreply@${resendDomain}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error('Resend API error:', error);
      return false;
    }

    console.log(`Email sent to ${options.to}: ${data?.id}`);
    return true;
  } catch (error: any) {
    console.error('Email sending error:', error.message);
    return false;
  }
};

export const sendVerificationEmail = async (email: string, token: string, firstName: string): Promise<boolean> => {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

  const subject = 'Verify Your Email - Advisora Connect';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #1e3a5f; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Advisora Connect</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Legal Services Marketplace</p>
      </div>
      <div style="background-color: #f8f9fa; padding: 40px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
        <h2 style="color: #1e3a5f; margin-top: 0;">Verify Your Email Address</h2>
        <p>Hi ${firstName},</p>
        <p>Thank you for registering with Advisora Connect. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #d4a853; color: #1e3a5f; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verify Email</a>
        </div>
        <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="color: #1e3a5f; word-break: break-all; font-size: 14px;">${verificationUrl}</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">This link will expire in <strong>24 hours</strong>.</p>
        <p style="color: #666; font-size: 14px;">If you didn't create an account, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">&copy; 2026 Advisora Connect. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
};

export const sendLeadNotificationEmail = async (recipientEmail: string, clientName: string, lawyerName: string, enquiryMessage: string): Promise<boolean> => {
  const subject = 'New enquiry received - Advisora Connect';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1e3a5f;">New enquiry received</h2>
      <p>Hi ${lawyerName},</p>
      <p>You received a new enquiry from <strong>${clientName}</strong>.</p>
      <div style="background-color: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0;"><strong>Message:</strong></p>
        <p style="margin: 8px 0 0 0; white-space: pre-wrap;">${enquiryMessage}</p>
      </div>
      <p>Please log in to your dashboard to review the enquiry.</p>
    </div>
  `;

  return sendEmail({ to: recipientEmail, subject, html });
};

export const sendPasswordResetEmail = async (email: string, token: string, firstName: string): Promise<boolean> => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

  const subject = 'Reset Your Password - Advisora Connect';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #1e3a5f; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Advisora Connect</h1>
      </div>
      <div style="background-color: #f8f9fa; padding: 40px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #1e3a5f;">Reset Your Password</h2>
        <p>Hi ${firstName},</p>
        <p>Click below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #d4a853; color: #1e3a5f; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </div>
        <p style="color: #666; font-size: 14px;">Expires in <strong>1 hour</strong>.</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
};

export const sendProBonoApplicationEmail = async (email: string, firstName: string, applicationId: string): Promise<boolean> => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  const subject = 'Pro Bono Application Received - Advisora Impact';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #1B2A4A; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Advisora Impact</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Pro Bono & Access to Justice Initiative</p>
      </div>
      <div style="background-color: #f8f9fa; padding: 40px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
        <h2 style="color: #1B2A4A; margin-top: 0;">Application Received</h2>
        <p>Hi ${firstName},</p>
        <p>Thank you for submitting your application for pro bono legal assistance through Advisora Impact.</p>
        <div style="background-color: #fff; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #00A6A6;">
          <p style="margin: 0;"><strong>Application Reference:</strong> ${applicationId}</p>
          <p style="margin: 8px 0 0 0;"><strong>Status:</strong> Submitted - Under Review</p>
        </div>
        <p>Our team will review your application and contact you within <strong>5 business days</strong>. We assess each application individually based on financial circumstances, urgency, vulnerability, and the availability of a suitable volunteer lawyer.</p>
        <p style="color: #666; font-size: 14px;">Please note: Approval for an initial consultation does not automatically guarantee further legal assistance or full representation.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">&copy; 2026 Advisora Connect. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
};

export const sendVolunteerRegistrationEmail = async (email: string, firstName: string, volunteerId: string): Promise<boolean> => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  const subject = 'Volunteer Lawyer Registration Received - Advisora Impact';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #1B2A4A; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Advisora Impact</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Pro Bono & Access to Justice Initiative</p>
      </div>
      <div style="background-color: #f8f9fa; padding: 40px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
        <h2 style="color: #1B2A4A; margin-top: 0;">Volunteer Registration Received</h2>
        <p>Hi ${firstName},</p>
        <p>Thank you for registering as a volunteer lawyer with Advisora Impact. Your commitment to providing access to justice is deeply appreciated.</p>
        <div style="background-color: #fff; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #00A6A6;">
          <p style="margin: 0;"><strong>Registration Reference:</strong> ${volunteerId}</p>
          <p style="margin: 8px 0 0 0;"><strong>Status:</strong> Submitted - Under Review</p>
        </div>
        <p>Our team will review your registration and contact you within <strong>5 business days</strong>. Once approved, you'll be added to our volunteer network and may receive referrals for pro bono cases matching your practice areas and availability.</p>
        <p style="color: #666; font-size: 14px;">You retain the right to assess each referral and decide whether to accept it. All assignments are subject to your professional obligations, availability, and conflict checks.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">&copy; 2026 Advisora Connect. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
};

export const sendFractionalRequestEmail = async (email: string, lawyerName: string, data: {
  clientName: string;
  companyName: string;
  companyStage?: string;
  industry?: string;
  legalNeeds: string;
  budgetRange?: string;
  leadId: string;
}): Promise<boolean> => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const leadUrl = `${frontendUrl}/dashboard/professional?section=fractional&lead=${data.leadId}`;

  const subject = 'New Fractional GC Request - Advisora Connect';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #1B2A4A; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Advisora Connect</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Fractional GC Request</p>
      </div>
      <div style="background-color: #f8f9fa; padding: 40px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
        <h2 style="color: #1B2A4A; margin-top: 0;">New Fractional GC Request</h2>
        <p>Hi ${lawyerName},</p>
        <p>You received a new fractional General Counsel request.</p>
        <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00A6A6;">
          <p style="margin: 0 0 10px 0;"><strong>Client:</strong> ${data.clientName}</p>
          <p style="margin: 0 0 10px 0;"><strong>Company:</strong> ${data.companyName}</p>
          ${data.companyStage ? `<p style="margin: 0 0 10px 0;"><strong>Stage:</strong> ${data.companyStage}</p>` : ''}
          ${data.industry ? `<p style="margin: 0 0 10px 0;"><strong>Industry:</strong> ${data.industry}</p>` : ''}
          ${data.budgetRange ? `<p style="margin: 0 0 10px 0;"><strong>Budget Range:</strong> ${data.budgetRange}</p>` : ''}
          <p style="margin: 0;"><strong>Legal Needs:</strong></p>
          <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${data.legalNeeds}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${leadUrl}" style="background-color: #00A6A6; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Request & Send Proposal</a>
        </div>
        <p style="color: #666; font-size: 14px;">Please review and send a proposal within 5 business days.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">&copy; 2026 Advisora Connect. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
};

export const sendProposalEmail = async (email: string, clientName: string, data: {
  lawyerName: string;
  monthlyRetainer: number;
  hoursPerMonth: number;
  engagementMonths: number;
  proposalId: string;
}): Promise<boolean> => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const proposalUrl = `${frontendUrl}/fractional/proposals/${data.proposalId}`;

  const subject = 'Fractional GC Proposal Received - Advisora Connect';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #1B2A4A; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Advisora Connect</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Fractional GC Proposal</p>
      </div>
      <div style="background-color: #f8f9fa; padding: 40px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
        <h2 style="color: #1B2A4A; margin-top: 0;">New Proposal Received</h2>
        <p>Hi ${clientName},</p>
        <p>${data.lawyerName} has sent you a proposal for fractional General Counsel services.</p>
        <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00A6A6;">
          <p style="margin: 0 0 10px 0;"><strong>Monthly Retainer:</strong> ₦${data.monthlyRetainer.toLocaleString()}</p>
          <p style="margin: 0 0 10px 0;"><strong>Hours/Month:</strong> ${data.hoursPerMonth}</p>
          <p style="margin: 0 0 10px 0;"><strong>Commitment:</strong> ${data.engagementMonths} months</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${proposalUrl}" style="background-color: #00A6A6; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Proposal</a>
        </div>
        <p style="color: #666; font-size: 14px;">This proposal is valid for 14 days. Please review and accept or decline.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">&copy; 2026 Advisora Connect. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
};

export const sendProposalViewedEmail = async (email: string, lawyerName: string, data: {
  clientName: string;
  proposalId: string;
}): Promise<boolean> => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const proposalUrl = `${frontendUrl}/fractional/proposals/${data.proposalId}`;

  const subject = 'Your Proposal Was Viewed - Advisora Connect';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #1B2A4A; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Advisora Connect</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Fractional GC Proposal</p>
      </div>
      <div style="background-color: #f8f9fa; padding: 40px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
        <h2 style="color: #1B2A4A; margin-top: 0;">Proposal Viewed</h2>
        <p>Hi ${lawyerName},</p>
        <p>Your proposal for fractional General Counsel services has been viewed by the client.</p>
        <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
          <p style="margin: 0 0 10px 0;"><strong>Client:</strong> ${data.clientName}</p>
          <p style="margin: 0;"><strong>Status:</strong> Viewed - awaiting response</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${proposalUrl}" style="background-color: #00A6A6; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Proposal</a>
        </div>
        <p style="color: #666; font-size: 14px;">The client has 14 days to respond. You can withdraw the proposal at any time before acceptance.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">&copy; 2026 Advisora Connect. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
};

export const sendProposalAcceptedEmail = async (email: string, lawyerName: string, data: {
  clientName: string;
  monthlyRetainer: number;
  engagementMonths: number;
  proposalId: string;
}): Promise<boolean> => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  const subject = 'Proposal Accepted - Advisora Connect';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #5DBB63; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Advisora Connect</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Proposal Accepted ✓</p>
      </div>
      <div style="background-color: #f8f9fa; padding: 40px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
        <h2 style="color: #1B2A4A; margin-top: 0;">Proposal Accepted!</h2>
        <p>Hi ${lawyerName},</p>
        <p>Great news! <strong>${data.clientName}</strong> has accepted your fractional GC proposal.</p>
        <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #5DBB63;">
          <p style="margin: 0 0 10px 0;"><strong>Monthly Retainer:</strong> ₦${data.monthlyRetainer.toLocaleString()}</p>
          <p style="margin: 0 0 10px 0;"><strong>Commitment:</strong> ${data.engagementMonths} months</p>
          <p style="margin: 0;"><strong>Platform Fee:</strong> ₦10,000 (one-time, deducted from first payment)</p>
        </div>
        <p>The client will now complete payment via Paystack to activate the subscription. You'll be notified once the engagement is active.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard/professional?section=fractional" style="background-color: #5DBB63; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Engagement</a>
        </div>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">&copy; 2026 Advisora Connect. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
};

export const sendProposalRejectedEmail = async (email: string, lawyerName: string, data: {
  clientName: string;
  rejectionReason?: string;
  proposalId: string;
}): Promise<boolean> => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  const subject = 'Proposal Not Accepted - Advisora Connect';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #EF4444; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Advisora Connect</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Proposal Update</p>
      </div>
      <div style="background-color: #f8f9fa; padding: 40px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
        <h2 style="color: #1B2A4A; margin-top: 0;">Proposal Not Accepted</h2>
        <p>Hi ${lawyerName},</p>
        <p><strong>${data.clientName}</strong> has decided not to proceed with your fractional GC proposal.</p>
        ${data.rejectionReason ? `
        <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EF4444;">
          <p style="margin: 0 0 10px 0;"><strong>Client's Reason:</strong></p>
          <p style="margin: 0; white-space: pre-wrap;">${data.rejectionReason}</p>
        </div>
        ` : ''}
        <p>You can continue to send proposals to other clients on the platform.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${frontendUrl}/dashboard/professional?section=fractional" style="background-color: #00A6A6; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Other Requests</a>
        </div>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">&copy; 2026 Advisora Connect. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
};

export const sendProposalExpiredEmail = async (email: string, lawyerName: string, data: {
  clientName: string;
  proposalId: string;
}): Promise<boolean> => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  const subject = 'Proposal Expired - Advisora Connect';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #F59E0B; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Advisora Connect</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Proposal Expired</p>
      </div>
      <div style="background-color: #f8f9fa; padding: 40px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
        <h2 style="color: #1B2A4A; margin-top: 0;">Proposal Expired</h2>
        <p>Hi ${lawyerName},</p>
        <p>Your proposal for <strong>${data.clientName}</strong> has expired without a response.</p>
        <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
          <p style="margin: 0;"><strong>Status:</strong> Expired after 14 days</p>
        </div>
        <p>You can send a new proposal if the client is still interested, or explore other fractional GC requests on the platform.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard/professional?section=fractional" style="background-color: #00A6A6; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Other Requests</a>
        </div>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">&copy; 2026 Advisora Connect. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
};

export const sendEngagementActivatedEmail = async (email: string, userName: string, data: {
  lawyerName: string;
  clientName: string;
  monthlyRetainer: number;
  engagementMonths: number;
  engagementId: string;
}): Promise<boolean> => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  const subject = 'Fractional GC Engagement Active - Advisora Connect';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #5DBB63; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Advisora Connect</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Engagement Activated</p>
      </div>
      <div style="background-color: #f8f9fa; padding: 40px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
        <h2 style="color: #1B2A4A; margin-top: 0;">Engagement Now Active</h2>
        <p>Hi ${userName},</p>
        <p>Your fractional General Counsel engagement with <strong>${data.lawyerName}</strong> is now active.</p>
        <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #5DBB63;">
          <p style="margin: 0 0 10px 0;"><strong>Lawyer:</strong> ${data.lawyerName}</p>
          <p style="margin: 0 0 10px 0;"><strong>Monthly Retainer:</strong> ₦${data.monthlyRetainer.toLocaleString()}</p>
          <p style="margin: 0 0 10px 0;"><strong>Commitment:</strong> ${data.engagementMonths} months</p>
          <p style="margin: 0;"><strong>Platform Fee:</strong> ₦10,000 (one-time, already paid)</p>
        </div>
        <p>The engagement has started. You can now schedule meetings and collaborate through the platform.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/fractional/engagements/${data.engagementId}" style="background-color: #5DBB63; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Engagement</a>
        </div>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">&copy; 2026 Advisora Connect. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
};

export const sendEngagementExpiredEmail = async (email: string, userName: string, data: {
  lawyerName: string;
  clientName?: string;
  engagementId: string;
}): Promise<boolean> => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  const subject = 'Fractional GC Engagement Expired - Advisora Connect';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #EF4444; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Advisora Connect</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Engagement Expired</p>
      </div>
      <div style="background-color: #f8f9fa; padding: 40px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
        <h2 style="color: #1B2A4A; margin-top: 0;">Engagement Expired</h2>
        <p>Hi ${userName},</p>
        <p>Your fractional General Counsel engagement has expired.</p>
        <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EF4444;">
          <p style="margin: 0 0 10px 0;"><strong>Engagement ID:</strong> ${data.engagementId}</p>
          <p style="margin: 0 0 10px 0;"><strong>Lawyer:</strong> ${data.lawyerName}</p>
          ${data.clientName ? `<p style="margin: 0;"><strong>Client:</strong> ${data.clientName}</p>` : ''}
        </div>
        <p>The engagement has reached its end date. If you wish to continue the engagement, you can renew it through the platform.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/engagements/${data.engagementId}" style="background-color: #EF4444; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Engagement</a>
        </div>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">&copy; 2026 Advisora Connect. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
};

export const testEmailConnection = async (testEmail: string): Promise<{ success: boolean; message: string }> => {
  if (!resendReady || !resend) {
    return {
      success: false,
      message: 'Resend is not configured. Set RESEND_API_KEY in environment variables.',
    };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `Advisora Connect <noreply@${resendDomain}>`,
      to: testEmail,
      subject: 'Test Email - Advisora Connect',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #1e3a5f; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Advisora Connect</h1>
          </div>
          <div style="background-color: #f8f9fa; padding: 40px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1e3a5f;">Email Test Successful! 🎉</h2>
            <p>Your Resend configuration is working correctly.</p>
            <p>You can now send verification emails, password resets, and notifications to your users.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend test email error:', error);
      return { success: false, message: `Resend error: ${error.message}` };
    }

    console.log(`Test email sent successfully to ${testEmail}: ${data?.id}`);
    return { success: true, message: `Test email sent successfully to ${testEmail}` };
  } catch (error: any) {
    console.error('Email test failed:', error.message);
    return { success: false, message: `Email test failed: ${error.message}` };
  }
};