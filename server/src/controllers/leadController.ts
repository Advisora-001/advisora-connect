import { Request, Response } from 'express';
import Lead from '../models/Lead';
import LawyerProfile from '../models/LawyerProfile';
import Appointment from '../models/Appointment';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { sendLeadNotificationEmail } from '../services/email';

// @desc    Submit enquiry (create lead) - FREE for first enquiry per matter
// @route   POST /api/leads
const createLead = async (req: AuthRequest, res: Response) => {
  try {
    const { lawyerId, enquiryMessage, clientName, clientEmail, clientPhone } = req.body;

    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Require email verification before sending enquiry
    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Please verify your email before sending an enquiry.',
        code: 'VERIFICATION_REQUIRED',
      });
    }

    // Enquiry length limit (500 chars)
    if (enquiryMessage && enquiryMessage.length > 500) {
      return res.status(400).json({ message: 'Enquiry cannot exceed 500 characters.' });
    }

    // Daily enquiry limit: 5 for unverified users (here all must be verified, so allow 10)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (user.lastEnquiryDate && user.lastEnquiryDate >= today) {
      if (user.enquiryCount >= 10) {
        return res.status(429).json({ message: 'Daily enquiry limit reached. Please try again tomorrow.' });
      }
    } else {
      // Reset count for new day
      user.enquiryCount = 0;
    }

    const lawyer = await LawyerProfile.findById(lawyerId);
    if (!lawyer) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }

    // First enquiry per matter is free; additional enquiries incur platform fee
    const existingEnquiry = await Lead.findOne({
      clientId: user._id,
      lawyerId,
      status: { $in: ['pending', 'accepted', 'booked'] },
    });

    const PLATFORM_FEE = Number(process.env.PLATFORM_FEE_AMOUNT) || 10000;
    const isFirstEnquiry = !existingEnquiry;

    const lead = await Lead.create({
      lawyerId,
      clientId: user._id,
      enquiryMessage,
      leadFee: 0, // Enquiries are free
      platformFee: isFirstEnquiry ? 0 : PLATFORM_FEE, // Platform fee for additional enquiries
      clientName,
      clientEmail,
      clientPhone,
    });

    // Update user enquiry tracking
    user.enquiryCount += 1;
    user.lastEnquiryDate = new Date();
    await user.save();

    const lawyerProfile = await LawyerProfile.findById(lawyerId).populate('userId', 'firstName lastName email');
    if (lawyerProfile?.userId && typeof lawyerProfile.userId === 'object' && 'email' in lawyerProfile.userId) {
      const lawyerUser = lawyerProfile.userId as { firstName?: string; lastName?: string; email?: string };
      const lawyerName = `${lawyerUser.firstName || ''} ${lawyerUser.lastName || ''}`.trim() || 'your lawyer';
      if (lawyerUser.email) {
        await sendLeadNotificationEmail(lawyerUser.email, clientName || 'A client', lawyerName, enquiryMessage || '');
      }
    }

    res.status(201).json({
      message: isFirstEnquiry ? 'Enquiry submitted (free)' : 'Enquiry submitted (platform fee applies)',
      lead,
      platformFeeApplied: !isFirstEnquiry,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Lawyer responds to enquiry (accept/decline)
// @route   PUT /api/leads/:id/respond
const respondToLead = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    const profile = await LawyerProfile.findOne({ userId: req.user?._id });
    if (!profile || profile._id.toString() !== lead.lawyerId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (lead.status !== 'pending') {
      return res.status(400).json({ message: 'Lead already responded to' });
    }

    lead.status = status;
    lead.respondedAt = new Date();
    await lead.save();

    res.json({ message: `Enquiry ${status}`, lead });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get lawyer's leads
// @route   GET /api/leads
const getLeads = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await LawyerProfile.findOne({ userId: req.user?._id });
    if (!profile) {
      return res.status(404).json({ message: 'Lawyer profile not found' });
    }

    const leads = await Lead.find({ lawyerId: profile._id })
      .populate('clientId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({ count: leads.length, leads });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Book consultation after lawyer accepts (charge platform fee + lawyer fee)
// @route   POST /api/leads/:id/book
const bookConsultation = async (req: AuthRequest, res: Response) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    if (lead.status !== 'accepted') {
      return res.status(400).json({ message: 'Lawyer must accept the enquiry before booking' });
    }

    const lawyer = await LawyerProfile.findById(lead.lawyerId);
    if (!lawyer) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }

    const PLATFORM_FEE = Number(process.env.PLATFORM_FEE_AMOUNT) || 10000;
    const consultationFee = lawyer.consultationFee || 0;
    const totalAmount = consultationFee + PLATFORM_FEE;

    // Create appointment record (payment handled separately via payment route)
    const appointment = await Appointment.create({
      lawyerId: lead.lawyerId,
      clientId: lead.clientId,
      leadId: lead._id,
      date: new Date(req.body.date),
      timeSlot: req.body.timeSlot,
      duration: req.body.duration || 30,
      consultationType: req.body.consultationType || 'video',
      consultationFee,
      platformFee: PLATFORM_FEE,
      totalAmount,
      paymentStatus: 'unpaid',
    });

    // Keep lead status as 'accepted' until payment is verified
    // lead.status = 'booked' happens in payment webhook after payment success

    res.status(201).json({
      message: 'Consultation booked. Proceed to payment.',
      appointment,
      paymentBreakdown: {
        consultationFee,
        platformFee: PLATFORM_FEE,
        total: totalAmount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Get client's enquiries
// @route   GET /api/leads/my-enquiries
const getMyEnquiries = async (req: AuthRequest, res: Response) => {
  try {
    const leads = await Lead.find({ clientId: req.user?._id })
      .populate({
        path: 'lawyerId',
        populate: { path: 'userId', select: 'firstName lastName' }
      })
      .sort({ createdAt: -1 });

    res.json({ count: leads.length, leads });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export { createLead, respondToLead, getLeads, bookConsultation, getMyEnquiries };
