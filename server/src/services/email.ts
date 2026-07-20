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