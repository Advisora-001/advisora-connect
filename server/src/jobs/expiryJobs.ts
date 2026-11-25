import { CronJob } from 'cron';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Proposal from '../models/Proposal';
import FractionalProposal from '../models/FractionalProposal';
import Engagement from '../models/Engagement';
import Lead from '../models/Lead';
import User from '../models/User';
import ProfessionalProfile from '../models/ProfessionalProfile';
import { createNotification } from '../controllers/notificationController';
import { sendProposalExpiredEmail, sendEngagementExpiredEmail } from '../services/email';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('MongoDB connected for cron jobs');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// ============================================
// Proposal Expiry (14 days)
// ============================================

const checkProposalExpiry = async () => {
  try {
    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Find proposals that are pending/sent/viewed for more than 14 days
    const expiredProposals = await FractionalProposal.find({
      status: { $in: ['sent', 'viewed', 'draft'] },
      createdAt: { $lt: fourteenDaysAgo },
      expiresAt: { $lt: now },
    }).populate('lawyerId', 'firstName lastName email').populate('clientId', 'firstName lastName email');

    console.log(`Found ${expiredProposals.length} expired proposals`);

    for (const proposal of expiredProposals) {
      proposal.status = 'expired';
      proposal.expiredAt = new Date();
      await proposal.save();

      // Update lead
      if (proposal.leadId) {
        await Lead.findByIdAndUpdate(proposal.leadId, { status: 'expired' });
      }

      // Notify client
      try {
        const client = await User.findById(proposal.clientId);
        if (client) {
          await createNotification(
            client._id.toString(),
            'fractional_proposal_expired',
            'Proposal Expired',
            `Your proposal from ${proposal.lawyerId?.firstName} ${proposal.lawyerId?.lastName} has expired.`,
            `/fractional/proposals/${proposal._id}`
          );
        }
      } catch {}

      // Notify lawyer
      try {
        const lawyerProfile = await ProfessionalProfile.findById(proposal.lawyerId).populate('userId');
        if (lawyerProfile && (lawyerProfile as any).userId) {
          await createNotification(
            (lawyerProfile as any).userId.toString(),
            'fractional_proposal_expired',
            'Proposal Expired',
            `Your proposal to ${proposal.clientId?.firstName} ${proposal.clientId?.lastName} has expired.`,
            `/dashboard/professional?section=fractional`
          );
        }
      } catch {}

      // Send emails
      try {
        if (proposal.clientId?.email) {
          await sendProposalExpiredEmail(proposal.clientId.email, `${proposal.clientId?.firstName} ${proposal.clientId?.lastName}`, {
            lawyerName: `${proposal.lawyerId?.firstName} ${proposal.lawyerId?.lastName}`,
            proposalId: proposal._id.toString(),
          });
        }
        if (proposal.lawyerId?.email) {
          await sendProposalExpiredEmail(proposal.lawyerId.email, `${proposal.lawyerId?.firstName} ${proposal.lawyerId?.lastName}`, {
            lawyerName: `${proposal.lawyerId?.firstName} ${proposal.lawyerId?.lastName}`,
            clientName: `${proposal.clientId?.firstName} ${proposal.clientId?.lastName}`,
            proposalId: proposal._id.toString(),
          });
        }
      } catch (emailError) {
        console.error('Failed to send expired proposal emails:', emailError);
      }

      console.log(`Expired proposal: ${proposal._id}`);
    }

    console.log(`Proposal expiry check completed. Expired ${expiredProposals.length} proposals.`);
  } catch (error: any) {
    console.error('Proposal expiry check error:', error);
  }
};

// ============================================
// Engagement Expiry (Past End Date)
// ============================================

const checkEngagementExpiry = async () => {
  try {
    const now = new Date();

    // Find active engagements past their end date
    const expiredEngagements = await Engagement.find({
      status: 'active',
      endDate: { $lt: new Date() },
    }).populate('lawyerId', 'firstName lastName email').populate('clientId', 'firstName lastName email');

    console.log(`Found ${expiredEngagements.length} expired engagements`);

    for (const engagement of expiredEngagements) {
      engagement.status = 'expired';
      engagement.statusHistory.push({
        status: 'expired',
        changedAt: new Date(),
        changedBy: engagement.lawyerId,
        reason: 'Engagement end date passed',
      });
      await engagement.save();

      // Notify both parties
      try {
        const [client, lawyerProfile] = await Promise.all([
          User.findById(engagement.clientId),
          ProfessionalProfile.findById(engagement.lawyerId).populate('userId'),
        ]);

        if (client) {
          await createNotification(
            client._id.toString(),
            'engagement_expired',
            'Engagement Expired',
            `Your fractional GC engagement with ${engagement.lawyerId?.firstName} ${engagement.lawyerId?.lastName} has expired.`,
            `/engagements/${engagement._id}`
          );
        }

        if (lawyerProfile && (lawyerProfile as any).userId) {
          await createNotification(
            (lawyerProfile as any).userId.toString(),
            'engagement_expired',
            'Engagement Expired',
            `Fractional GC engagement with ${engagement.clientId?.firstName} ${engagement.clientId?.lastName} has expired.`,
            `/engagements/${engagement._id}`
          );
        }
      } catch {}

      // Send emails
      try {
        const client = await User.findById(expiredEngagements[0].clientId);
        const lawyerProfile = await ProfessionalProfile.findById(expiredEngagements[0].lawyerId).populate('userId');

        if (client) {
          await sendEngagementExpiredEmail(client.email!, `${client.firstName} ${client.lastName}`, {
            lawyerName: `${expiredEngagements[0].lawyerId?.firstName} ${expiredEngagements[0].lawyerId?.lastName}`,
            engagementId: expiredEngagements[0]._id.toString(),
          });
        }

        const lawyerProfile = await ProfessionalProfile.findById(expiredEngagements[0].lawyerId).populate('userId');
        const lawyerUser = await User.findById((expiredEngagements[0].lawyerId as any).userId?._id);
        if (lawyerUser) {
          await sendEngagementExpiredEmail(lawyerUser.email!, `${lawyerUser.firstName} ${lawyerUser.lastName}`, {
            lawyerName: `${expiredEngagements[0].lawyerId?.firstName} ${expiredEngagements[0].lawyerId?.lastName}`,
            clientName: `${expiredEngagements[0].clientId?.firstName} ${expiredEngagements[0].clientId?.lastName}`,
            engagementId: expiredEngagements[0]._id.toString(),
          });
        }
      } catch (emailError) {
        console.error('Failed to send expired engagement emails:', emailError);
      }

      console.log(`Expired engagement: ${engagement._id}`);
    }

    console.log(`Engagement expiry check completed. Expired ${expiredEngagements.length} engagements.`);
  } catch (error: any) {
    console.error('Engagement expiry check error:', error);
  }
};

// ============================================
// Proposal Reminder (7 days before expiry)
// ============================================

const sendProposalExpiryReminders = async () => {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Find proposals expiring in 7 days
    const expiringProposals = await FractionalProposal.find({
      status: { $in: ['sent', 'viewed'] },
      expiresAt: { $gte: now, $lte: sevenDaysFromNow },
    }).populate('lawyerId', 'firstName lastName email').populate('clientId', 'firstName lastName email');

    console.log(`Found ${expiringProposals.length} proposals expiring in 7 days`);

    for (const proposal of expiringProposals) {
      // Send reminder to client
      try {
        const client = await User.findById(proposal.clientId);
        if (client) {
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          const proposalUrl = `${frontendUrl}/fractional/proposals/${proposal._id}`;

          const subject = 'Proposal Expiring Soon - Advisora Connect';
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #F59E0B; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 28px;">Advisora Connect</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Proposal Expiring Soon</p>
              </div>
              <div style="background-color: #f8f9fa; padding: 40px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
                <h2 style="color: #1B2A4A; margin-top: 0;">Proposal Expiring in 7 Days</h2>
                <p>Hi ${proposal.clientId?.firstName},</p>
                <p>The proposal from <strong>${proposal.lawyerId?.firstName} ${proposal.lawyerId?.lastName}</strong> will expire in 7 days.</p>
                <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
                  <p style="margin: 0 0 10px 0;"><strong>Monthly Retainer:</strong> ₦${proposal.monthlyRetainer?.toLocaleString()}</p>
                  <p style="margin: 0 0 10px 0;"><strong>Hours/Month:</strong> ${proposal.hoursPerMonth}</p>
                  <p style="margin: 0 0 10px 0;"><strong>Commitment:</strong> ${proposal.engagementMonths} months</p>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URL}/fractional/proposals/${proposal._id}" style="background-color: #00A6A6; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Review Proposal</a>
                </div>
                <p style="color: #666; font-size: 14px;">Please review and accept or decline before the proposal expires.</p>
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">&copy; 2026 Advisora Connect. All rights reserved.</p>
              </div>
            </div>
          `;

          await sendEmail({ to: proposal.clientId.email, subject, html });
        }
      } catch {}

      // Send reminder to lawyer
      try {
        const lawyerProfile = await ProfessionalProfile.findById(proposal.lawyerId).populate('userId');
        if (lawyerProfile && (lawyerProfile as any).userId) {
          const lawyerUser = (lawyerProfile as any).userId;
          const subject = 'Your Proposal Expiring Soon - Advisora Connect';
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #F59E0B; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 28px;">Advisora Connect</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Proposal Expiring Soon</p>
              </div>
              <div style="background-color: #f8f9fa; padding: 40px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
                <h2 style="color: #1B2A4A; margin-top: 0;">Proposal Expiring in 7 Days</h2>
                <p>Hi ${proposal.lawyerId?.firstName},</p>
                <p>Your proposal to <strong>${proposal.clientId?.firstName} ${proposal.clientId?.lastName}</strong> will expire in 7 days.</p>
                <p>The client has not yet responded. You may want to follow up with them.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URL}/dashboard/professional?section=fractional" style="background-color: #F59E0B; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Proposal</a>
                </div>
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">&copy; 2026 Advisora Connect. All rights reserved.</p>
              </div>
            </div>
          `;

          await sendEmail({ to: proposal.lawyerId.email, subject, html });
        }
      } catch {}
    }

    console.log(`Proposal expiry reminders sent: ${expiringProposals.length}`);
  } catch (error: any) {
    console.error('Proposal expiry reminders error:', error);
  }
};

// ============================================
// Engagement Renewal Reminder (30 days before end)
// ============================================

const sendEngagementRenewalReminders = async () => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const expiringEngagements = await Engagement.find({
      status: 'active',
      endDate: { $gte: new Date(), $lte: thirtyDaysFromNow },
      autoRenew: true,
    }).populate('lawyerId', 'firstName lastName email').populate('clientId', 'firstName lastName email');

    console.log(`Found ${expiringEngagements.length} engagements expiring in 30 days`);

    for (const engagement of expiringEngagements) {
      // Send reminder to both parties
      try {
        const [client, lawyerProfile] = await Promise.all([
          User.findById(engagement.clientId),
          ProfessionalProfile.findById(engagement.lawyerId).populate('userId'),
        ]);

        if (client && client.email) {
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          const subject = 'Engagement Renewal Approaching - Advisora Connect';
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #00A6A6; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 28px;">Advisora Connect</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Engagement Renewal</p>
              </div>
              <div style="background-color: #f8f9fa; padding: 40px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
                <h2 style="color: #1B2A4A; margin-top: 0;">Engagement Renewal Approaching</h2>
                <p>Hi ${client.firstName},</p>
                <p>Your fractional GC engagement with <strong>${engagement.lawyerId?.firstName} ${engagement.lawyerId?.lastName}</strong> is set to auto-renew in 30 days.</p>
                <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00A6A6;">
                  <p style="margin: 0 0 10px 0;"><strong>Current End Date:</strong> ${new Date(engagement.endDate).toLocaleDateString()}</p>
                  <p style="margin: 0 0 10px 0;"><strong>Monthly Retainer:</strong> ₦${engagement.monthlyRetainer.toLocaleString()}</p>
                  <p style="margin: 0;"><strong>Engagement Type:</strong> ${engagement.engagementType}</p>
                </div>
                <p>If you wish to modify or cancel the renewal, please log in to your dashboard.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URL}/engagements/${engagement._id}" style="background-color: #00A6A6; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Engagement</a>
                </div>
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">&copy; 2026 Advisora Connect. All rights reserved.</p>
              </div>
            </div>
          `;
          await sendEmail({ to: client.email, subject, html });
        }
      } catch {}

      try {
        const lawyerProfile = await ProfessionalProfile.findById(engagement.lawyerId).populate('userId');
        if (lawyerProfile && (lawyerProfile as any).userId) {
          const lawyerUser = (lawyerProfile as any).userId;
          const subject = 'Engagement Renewal Approaching - Advisora Connect';
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #1B2A4A; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 28px;">Advisora Connect</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Engagement Renewal</p>
              </div>
              <div style="background-color: #f8f9fa; padding: 40px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
                <h2 style="color: #1B2A4A; margin-top: 0;">Engagement Renewal Approaching</h2>
                <p>Hi ${engagement.lawyerId?.firstName},</p>
                <p>Your engagement with <strong>${engagement.clientId?.firstName} ${engagement.clientId?.lastName}</strong> is set to auto-renew in 30 days.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URL}/engagements/${engagement._id}" style="background-color: #00A6A6; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Engagement</a>
                </div>
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">&copy; 2026 Advisora Connect. All rights reserved.</p>
              </div>
            </div>
          `;
          await sendEmail({ to: engagement.lawyerId.email, subject: 'Engagement Renewal Approaching - Advisora Connect', html });
        }
      } catch {}
    }
  } catch (error: any) {
    console.error('Engagement renewal reminders error:', error);
  }
};

// ============================================
// Cron Job Setup
// ============================================

let jobsStarted = false;

export const startCronJobs = async () => {
  if (jobsStarted) {
    console.log('Cron jobs already started');
    return;
  }

  await connectDB();

  // Run proposal expiry check every 6 hours
  new CronJob('0 */6 * * *', async () => {
    console.log('Running proposal expiry check...');
    await checkProposalExpiry();
  }, null, true, 'Africa/Lagos');

  // Run engagement expiry check daily at midnight
  new CronJob('0 0 * * *', async () => {
    console.log('Running engagement expiry check...');
    await checkEngagementExpiry();
  }, null, true, 'Africa/Lagos');

  // Send proposal expiry reminders daily at 9 AM
  new CronJob('0 9 * * *', async () => {
    console.log('Sending proposal expiry reminders...');
    await sendProposalExpiryReminders();
  }, null, true, 'Africa/Lagos');

  // Send engagement renewal reminders daily at 10 AM
  new CronJob('0 10 * * *', async () => {
    console.log('Sending engagement renewal reminders...');
    await sendEngagementRenewalReminders();
  }, null, true, 'Africa/Lagos');

  console.log('Cron jobs started successfully');
  jobsStarted = true;
};

// Run once on startup (for testing)
export const runExpiryChecksOnce = async () => {
  await connectDB();
  await checkProposalExpiry();
  await checkEngagementExpiry();
  await sendProposalExpiryReminders();
  await sendEngagementRenewalReminders();
};

export { checkProposalExpiry, checkEngagementExpiry, sendProposalExpiryReminders, sendEngagementRenewalReminders };