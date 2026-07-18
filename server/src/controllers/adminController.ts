import { Response } from 'express';
import User from '../models/User';
import LawyerProfile from '../models/LawyerProfile';
import Lead from '../models/Lead';
import Subscription from '../models/Subscription';
import { AuthRequest } from '../middleware/auth';

// @desc    Get pending lawyer verifications
// @route   GET /api/admin/lawyers/pending
const getPendingVerifications = async (_req: AuthRequest, res: Response) => {
  try {
    const lawyers = await LawyerProfile.find({ verificationStatus: 'pending' })
      .populate('userId', 'firstName lastName email phone createdAt')
      .sort({ createdAt: -1 });

    res.json({ count: lawyers.length, lawyers });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve or reject lawyer verification
// @route   PUT /api/admin/lawyers/:id/verify
const verifyLawyer = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body; // 'verified' | 'rejected'

    const profile = await LawyerProfile.findByIdAndUpdate(
      req.params.id,
      {
        verificationStatus: status,
        verificationBadge: status === 'verified',
      },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ message: 'Lawyer profile not found' });
    }

    res.json({ message: `Lawyer ${status} successfully`, profile });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all users (admin)
// @route   GET /api/admin/users
const getUsers = async (_req: AuthRequest, res: Response) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ count: users.length, users });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Suspend/activate user
// @route   PUT /api/admin/users/:id/toggle-status
const toggleUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({ message: `User ${user.isActive ? 'activated' : 'suspended'}`, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get admin dashboard analytics
// @route   GET /api/admin/analytics
const getAnalytics = async (_req: AuthRequest, res: Response) => {
  try {
    const totalLawyers = await LawyerProfile.countDocuments();
    const verifiedLawyers = await LawyerProfile.countDocuments({ verificationStatus: 'verified' });
    const pendingLawyers = await LawyerProfile.countDocuments({ verificationStatus: 'pending' });
    const totalClients = await User.countDocuments({ role: 'client' });
    const totalLeads = await Lead.countDocuments();
    const paidLeads = await Lead.countDocuments({ paymentStatus: 'paid' });
    const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });
    const featuredActive = await LawyerProfile.countDocuments({ 'featuredListing.isActive': true });

    res.json({
      totalLawyers,
      verifiedLawyers,
      pendingLawyers,
      totalClients,
      totalLeads,
      paidLeads,
      activeSubscriptions,
      featuredActive,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get lawyer profile by ID (admin)
// @route   GET /api/admin/lawyers/:id
const getLawyerProfile = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await LawyerProfile.findOne({ userId: req.params.id })
      .populate("userId", "firstName lastName email phone createdAt isActive");

    if (!profile) {
      return res.status(404).json({ message: "Lawyer profile not found" });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export { getPendingVerifications, verifyLawyer, getUsers, toggleUserStatus, getAnalytics, getLawyerProfile };
