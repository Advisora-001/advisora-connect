// ... existing imports ...
import { sendEngagementRenewalConfirmationEmail, sendEngagementRenewalReminderEmail } from '../services/email';

// ... existing code ...

// Add these new functions at the end of the file:

// ============================================
// Renewal Confirmation Flow
// ============================================

// @desc    Request renewal confirmation from client
// @route   POST /api/engagements/:id/request-renewal
export const requestRenewalConfirmation = async (req: AuthRequest, res: Response) => {
  try {
    const engagement = await Engagement.findById(req.params.id);

    if (!engagement) {
      return res.status(404).json({ message: 'Engagement not found' });
    }

    // Only lawyer can request renewal
    const profile = await ProfessionalProfile.findOne({ userId: req.user?._id });
    if (!profile || engagement.lawyerId.toString() !== profile._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (engagement.status !== 'active') {
      return res.status(400).json({ message: 'Can only renew active engagements' });
    }

    if (!engagement.autoRenew) {
      return res.status(400).json({ message: 'Auto-renewal is not enabled for this engagement' });
    }

    // Send renewal confirmation request to client
    try {
      const client = await User.findById(engagement.clientId);
      const lawyerProfile = await ProfessionalProfile.findById(engagement.lawyerId).populate('userId');

      if (client && lawyerProfile && (lawyerProfile as any).userId) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const confirmationUrl = `${frontendUrl}/engagements/${engagement._id}/confirm-renewal`;

        const subject = 'Engagement Renewal Confirmation Required - Advisora Connect';
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #00A6A6; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">Advisora Connect</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Engagement Renewal Confirmation</p>
            </div>
            <div style="background-color: #f8f9fa; padding: 40px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
              <h2 style="color: #1B2A4A; margin-top: 0;">Engagement Renewal Confirmation Required</h2>
              <p>Hi ${client.firstName},</p>
              <p>Your fractional GC engagement with <strong>${(proposal.lawyerId as any)?.userId?.firstName} ${(proposal.lawyerId as any)?.userId?.lastName}</strong> is set to auto-renew in 30 days.</p>
              <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00A6A6;">
                <p style="margin: 0 0 10px 0;"><strong>Current End Date:</strong> ${new Date(engagement.endDate).toLocaleDateString()}</p>
                <p style="margin: 0 0 10px 0;"><strong>Monthly Retainer:</strong> ₦${engagement.monthlyRetainer.toLocaleString()}</p>
                <p style="margin: 0 0 10px 0;"><strong>New End Date (if renewed):</strong> ${new Date(new Date(engagement.endDate).setMonth(new Date(engagement.endDate).getMonth() + engagement.engagementMonths)).toLocaleDateString()}</p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${confirmationUrl}?action=confirm" style="background-color: #5DBB63; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-right: 10px;">Confirm Renewal</a>
                <a href="${confirmationUrl}?action=decline" style="background-color: #EF4444; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-left: 10px;">Decline Renewal</a>
              </div>
              <p style="color: #666; font-size: 14px;">Please respond before the renewal date. If no action is taken, the engagement will auto-renew based on your current settings.</p>
              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
              <p style="color: #999; font-size: 12px; text-align: center;">&copy; 2026 Advisora Connect. All rights reserved.</p>
            </div>
          </div>
        `;

        await sendEmail({ to: client.email, subject, html });
      }
    } catch (emailError) {
      console.error('Failed to send renewal confirmation email:', emailError);
    }

    res.json({ message: 'Renewal confirmation request sent to client' });
  } catch (error: any) {
    console.error('Request renewal confirmation error:', error);
    res.status(500).json({ message: 'Failed to send renewal confirmation' });
  }
};

// @desc    Client confirms or declines renewal
// @route   POST /api/engagements/:id/confirm-renewal
export const confirmRenewal = async (req: AuthRequest, res: Response) => {
  try {
    const { action } = req.body; // 'confirm' or 'decline'
    const engagement = await Engagement.findById(req.params.id);

    if (!engagement) {
      return res.status(404).json({ message: 'Engagement not found' });
    }

    if (engagement.clientId.toString() !== req.user?._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (engagement.status !== 'active') {
      return res.status(400).json({ message: 'Engagement is not active' });
    }

    if (action === 'confirm') {
      // Client confirms renewal - engagement will auto-renew
      // The renewal will happen automatically via the webhook when subscription renews
      // But we can send confirmation
      engagement.statusHistory.push({
        status: 'renewal_confirmed',
        changedAt: new Date(),
        changedBy: req.user?._id,
        reason: 'Client confirmed auto-renewal',
      });
      await engagement.save();

      // Notify lawyer
      try {
        const lawyerProfile = await ProfessionalProfile.findById(engagement.lawyerId).populate('userId');
        if (lawyerProfile && (lawyerProfile as any).userId) {
          await createNotification(
            (lawyerProfile as any).userId.toString(),
            'engagement_renewal_confirmed',
            'Renewal Confirmed',
            `Client confirmed auto-renewal for engagement`,
            `/engagements/${engagement._id}`
          );
        }
      } catch {}

      res.json({ message: 'Renewal confirmed. Engagement will auto-renew on the renewal date.' });
    } else if (action === 'decline') {
      // Client declines - disable auto-renew
      engagement.autoRenew = false;
      engagement.statusHistory.push({
        status: 'renewal_declined',
        changedAt: new Date(),
        changedBy: req.user?._id,
        reason: 'Client declined auto-renewal',
      });
      await engagement.save();

      // Notify lawyer
      try {
        const lawyerProfile = await ProfessionalProfile.findById(engagement.lawyerId).populate('userId');
        if (lawyerProfile && (lawyerProfile as any).userId) {
          await createNotification(
            (lawyerProfile as any).userId.toString(),
            'engagement_renewal_declined',
            'Renewal Declined',
            `Client declined auto-renewal for engagement`,
            `/engagements/${engagement._id}`
          );
        }
      } catch {}

      res.json({ message: 'Auto-renewal disabled. Engagement will end on the current end date.' });
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }
  } catch (error: any) {
    console.error('Confirm renewal error:', error);
    res.status(500).json({ message: 'Failed to process renewal confirmation' });
  }
};

// @desc    Update auto-renewal setting
// @route   PUT /api/engagements/:id/auto-renew
export const updateAutoRenew = async (req: AuthRequest, res: Response) => {
  try {
    const { autoRenew } = req.body;
    const engagement = await Engagement.findById(req.params.id);

    if (!engagement) {
      return res.status(404).json({ message: 'Engagement not found' });
    }

    // Both lawyer and client can update
    const isLawyer = engagement.lawyerId.toString() === req.user?._id.toString();
    const isClient = engagement.clientId.toString() === req.user?._id.toString();

    if (!isLawyer && !isClient) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    engagement.autoRenew = autoRenew;
    engagement.statusHistory.push({
      status: autoRenew ? 'auto_renew_enabled' : 'auto_renew_disabled',
      changedAt: new Date(),
      changedBy: req.user?._id,
      reason: autoRenew ? 'Auto-renewal enabled' : 'Auto-renewal disabled',
    });
    await engagement.save();

    res.json({ message: `Auto-renewal ${autoRenew ? 'enabled' : 'disabled'}`, engagement });
  } catch (error: any) {
    console.error('Update auto-renew error:', error);
    res.status(500).json({ message: 'Failed to update auto-renewal setting' });
  }
};

// @desc    Get renewal status
// @route   GET /api/engagements/:id/renewal-status
export const getRenewalStatus = async (req: AuthRequest, res: Response) => {
  try {
    const engagement = await Engagement.findById(req.params.id);

    if (!engagement) {
      return res.status(404).json({ message: 'Engagement not found' });
    }

    // Check authorization
    if (engagement.lawyerId.toString() !== req.user?._id.toString() &&
        engagement.clientId.toString() !== req.user?._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const now = new Date();
    const daysUntilEnd = Math.ceil((engagement.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    res.json({
      autoRenew: engagement.autoRenew,
      endDate: engagement.endDate,
      daysUntilEnd,
      canRenew: engagement.status === 'active' && engagement.autoRenew,
      lastRenewalStatus: engagement.statusHistory
        .filter(h => h.status.includes('renewal') || h.status.includes('auto_renew'))
        .slice(-1)[0] || null,
    });
  } catch (error: any) {
    console.error('Get renewal status error:', error);
    res.status(500).json({ message: 'Failed to fetch renewal status' });
  }
};

// Add email function for renewal confirmation
export const sendEngagementRenewalConfirmationEmail = async (email: string, clientName: string, data: {
  lawyerName: string;
  endDate: Date;
  monthlyRetainer: number;
  engagementMonths: number;
  confirmationUrl: string;
}): Promise<boolean> => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  const subject = 'Engagement Renewal Confirmation Required - Advisora Connect';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #00A6A6; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Advisora Connect</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Engagement Renewal Confirmation</p>
      </div>
      <div style="background-color: #f8f9fa; padding: 40px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
        <h2 style="color: #1B2A4A; margin-top: 0;">Engagement Renewal Confirmation Required</h2>
        <p>Hi ${clientName},</p>
        <p>Your fractional GC engagement with <strong>${data.lawyerName}</strong> is set to auto-renew in 30 days.</p>
        <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00A6A6;">
          <p style="margin: 0 0 10px 0;"><strong>Current End Date:</strong> ${new Date(data.endDate).toLocaleDateString()}</p>
          <p style="margin: 0 0 10px 0;"><strong>Monthly Retainer:</strong> ₦${data.monthlyRetainer.toLocaleString()}</p>
          <p style="margin: 0 0 10px 0;"><strong>New End Date (if renewed):</strong> ${new Date(new Date(data.endDate).setMonth(new Date(data.endDate).getMonth() + data.engagementMonths)).toLocaleDateString()}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.confirmationUrl}?action=confirm" style="background-color: #5DBB63; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-right: 10px;">Confirm Renewal</a>
          <a href="${data.confirmationUrl}?action=decline" style="background-color: #EF4444; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-left: 10px;">Decline Renewal</a>
        </div>
        <p style="color: #666; font-size: 14px;">Please respond before the renewal date. If no action is taken, the engagement will auto-renew based on your current settings.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">&copy; 2026 Advisora Connect. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject: 'Engagement Renewal Confirmation Required - Advisora Connect', html });
};

export const sendEngagementRenewalReminderEmail = async (email: string, userName: string, data: {
  lawyerName: string;
  endDate: Date;
  monthlyRetainer: number;
  engagementMonths: number;
  engagementId: string;
}): Promise<boolean> => {
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
        <p>Hi ${userName},</p>
        <p>Your fractional GC engagement with <strong>${data.lawyerName}</strong> is set to auto-renew in 30 days.</p>
        <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00A6A6;">
          <p style="margin: 0 0 10px 0;"><strong>Current End Date:</strong> ${new Date(data.endDate).toLocaleDateString()}</p>
          <p style="margin: 0 0 10px 0;"><strong>Monthly Retainer:</strong> ₦${data.monthlyRetainer.toLocaleString()}</p>
          <p style="margin: 0 0 10px 0;"><strong>Commitment:</strong> ${data.engagementMonths} months</p>
        </div>
        <p>If you wish to modify or cancel the renewal, please log in to your dashboard.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/engagements/${data.engagementId}" style="background-color: #00A6A6; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Engagement</a>
        </div>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">&copy; 2026 Advisora Connect. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject: 'Engagement Renewal Approaching - Advisora Connect', html });
};