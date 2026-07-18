import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create Gmail transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log(`Email sent to ${options.to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

export const sendVerificationEmail = async (email: string, token: string, firstName: string): Promise<boolean> => {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

  const subject = 'Verify Your Email - Advisora Connect';
  const text = `Hi ${firstName},\n\nPlease verify your email by clicking this link:\n${verificationUrl}\n\nThis link expires in 24 hours.`;
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
        <p style="color: #999; font-size: 12px; text-align: center;">© 2025 Advisora Connect. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, text, html });
};

export const sendLeadNotificationEmail = async (recipientEmail: string, clientName: string, lawyerName: string, enquiryMessage: string): Promise<boolean> => {
  const subject = 'New enquiry received - Advisora Connect';
  const text = `Hi ${lawyerName},\n\nYou received a new enquiry from ${clientName}.\n\nMessage:\n${enquiryMessage}\n\nPlease log in to your dashboard to review it.`;
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

  return sendEmail({ to: recipientEmail, subject, text, html });
};

export const sendPasswordResetEmail = async (email: string, token: string, firstName: string): Promise<boolean> => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

  const subject = 'Reset Your Password - Advisora Connect';
  const text = `Hi ${firstName},\n\nReset your password:\n${resetUrl}\n\nExpires in 1 hour.`;
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

  return sendEmail({ to: email, subject, text, html });
};

// Test the email connection
export const testEmailConnection = async (): Promise<boolean> => {
  try {
    const verified = await transporter.verify();
    console.log('✅ Gmail SMTP connection verified');
    return verified;
  } catch (error) {
    console.error('❌ Gmail SMTP connection failed:', error);
    return false;
  }
};