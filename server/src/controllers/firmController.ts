import crypto from 'crypto';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Firm from '../models/Firm';
import FirmMember from '../models/FirmMember';
import Plan from '../models/Plan';
import ProfessionalProfile from '../models/ProfessionalProfile';
import User from '../models/User';
import { sendEmail } from '../services/email';

const createFirm = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { name, professionalProfileId } = req.body;
    if (!userId || !name?.trim() || !professionalProfileId) {
      return res.status(400).json({ message: 'Firm name and owner professional profile are required' });
    }
    const profile = await ProfessionalProfile.findOne({ _id: professionalProfileId, userId });
    if (!profile) {
      return res.status(403).json({ message: 'The selected professional profile is not yours' });
    }

    const basicPlan = await Plan.findOne({ key: 'basic', isActive: true });
    const baseSlug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'firm';
    const slug = `${baseSlug}-${crypto.randomBytes(4).toString('hex')}`;
    const firm = await Firm.create({
      name: name.trim(),
      slug,
      adminId: userId,
      plan: basicPlan?._id,
      contactEmail: req.user?.email,
    });
    await FirmMember.create({
      firmId: firm._id,
      userId,
      professionalProfileId: profile._id,
      role: 'owner',
      status: 'active',
      acceptedAt: new Date(),
    });
    res.status(201).json({ firm });
  } catch (error) {
    res.status(400).json({ message: 'Unable to create firm', error: (error as Error).message });
  }
};

const getMyFirms = async (req: AuthRequest, res: Response) => {
  try {
    const memberships = await FirmMember.find({ userId: req.user?._id, status: 'active' }).select('firmId');
    const firmIds = memberships.map((member) => member.firmId);
    const firms = await Firm.find({ $or: [{ adminId: req.user?._id }, { _id: { $in: firmIds } }] })
      .populate('plan')
      .sort({ createdAt: -1 });
    res.json({ firms });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load firms', error: (error as Error).message });
  }
};

const inviteFirmMember = async (req: AuthRequest, res: Response) => {
  try {
    const { firmId } = req.params;
    const { userId, professionalProfileId } = req.body;
    const firm = await Firm.findOne({ _id: firmId, adminId: req.user?._id, status: 'active' }).populate('plan');
    if (!firm) return res.status(404).json({ message: 'Firm not found' });

    const [user, profile, existing] = await Promise.all([
      User.findById(userId),
      ProfessionalProfile.findOne({ _id: professionalProfileId, userId }),
      FirmMember.findOne({ firmId, userId }),
    ]);
    if (!user || !profile) return res.status(404).json({ message: 'User professional profile not found' });
    if (existing && existing.status !== 'removed') {
      return res.status(409).json({ message: 'This user is already a firm member or has a pending invitation' });
    }

    const plan = await Plan.findById(firm.plan).lean();
    const seatLimit = plan?.includedSeats || 1;
    const currentSeats = await FirmMember.countDocuments({ firmId, status: { $in: ['active', 'invited'] } });
    if (currentSeats >= seatLimit) {
      return res.status(409).json({ message: 'The firm has reached its plan seat limit' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const invitation = {
      professionalProfileId: profile._id,
      role: 'member' as const,
      invitedBy: req.user?._id,
      inviteToken: crypto.createHash('sha256').update(token).digest('hex'),
      inviteExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'invited' as const,
    };
    const member = existing
      ? Object.assign(existing, invitation)
      : await FirmMember.create({ firmId, userId, ...invitation });
    if (existing) await member.save();
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/firm-invitation?token=${token}`;
    const sent = await sendEmail({
      to: user.email,
      subject: `Invitation to join ${firm.name} on Advisora Connect`,
      html: `<p>You have been invited to join ${firm.name} on Advisora Connect.</p><p><a href="${inviteUrl}">Accept invitation</a></p><p>This link expires in seven days.</p>`,
    });
    if (!sent) {
      if (existing) {
        member.status = 'removed';
        member.inviteToken = undefined;
        member.inviteExpires = undefined;
        await member.save();
      } else {
        await member.deleteOne();
      }
      return res.status(503).json({ message: 'Invitation email could not be sent; no invitation was created' });
    }
    res.status(201).json({ message: 'Invitation sent', member: { _id: member._id, userId: member.userId, status: member.status } });
  } catch (error) {
    res.status(400).json({ message: 'Unable to invite firm member', error: (error as Error).message });
  }
};

const acceptFirmInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const token = String(req.body.token || '');
    if (!token) return res.status(400).json({ message: 'Invitation token is required' });
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const member = await FirmMember.findOne({
      userId: req.user?._id,
      inviteToken: tokenHash,
      status: 'invited',
      inviteExpires: { $gt: new Date() },
    });
    if (!member) return res.status(404).json({ message: 'Invitation is invalid or expired' });

    member.status = 'active';
    member.acceptedAt = new Date();
    member.inviteToken = undefined;
    member.inviteExpires = undefined;
    await member.save();
    res.json({ message: 'Firm invitation accepted', member });
  } catch (error) {
    res.status(500).json({ message: 'Unable to accept invitation', error: (error as Error).message });
  }
};

const removeFirmMember = async (req: AuthRequest, res: Response) => {
  try {
    const member = await FirmMember.findOne({ _id: req.params.memberId, firmId: req.params.firmId });
    const firm = await Firm.findOne({ _id: req.params.firmId, adminId: req.user?._id });
    if (!firm || !member) return res.status(404).json({ message: 'Firm member not found' });
    if (member.role === 'owner') return res.status(400).json({ message: 'The firm owner cannot be removed' });
    member.status = 'removed';
    member.inviteToken = undefined;
    member.inviteExpires = undefined;
    await member.save();
    res.json({ message: 'Firm member removed' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to remove firm member', error: (error as Error).message });
  }
};

export { createFirm, getMyFirms, inviteFirmMember, acceptFirmInvitation, removeFirmMember };
