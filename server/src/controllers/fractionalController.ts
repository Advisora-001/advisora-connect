import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Lead from '../models/Lead';
import ProfessionalProfile from '../models/ProfessionalProfile';
import FractionalProposal from '../models/FractionalProposal';
import User from '../models/User';
import Subscription from '../models/Subscription';
import Plan from '../models/Plan';
import { getPaystackService } from '../services/paystack';
import { createNotification } from './notificationController';
import { sendFractionalRequestEmail, sendProposalEmail, sendProposalViewedEmail, sendProposalAcceptedEmail, sendProposalRejectedEmail, sendProposalExpiredEmail, sendEngagementActivatedEmail } from '../services/email';

// ============================================
// Client: Request Fractional GC
// ============================================

// @desc    Client requests fractional GC services
// @route   POST /api/fractional/request
export const requestFractionalGC = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const {
      lawyerId,
      companyName,
      companyStage,
      industry,
      legalNeeds,
      budgetRange,
      preferredStartDate,
      message,
    } = req.body;

    if (!lawyerId || !companyName || !legalNeeds) {
      return res.status(400).json({ message: 'Lawyer, company name, and legal needs are required' });
    }

    // Check if lawyer exists and offers fractional GC
    const lawyer = await ProfessionalProfile.findById(lawyerId);
    if (!lawyer) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }

    if (!lawyer.fractionalGC?.isAvailable) {
      return res.status(400).json({ message: 'This lawyer does not offer fractional GC services' });
    }

    // Check for existing active request
    const existingLead = await Lead.findOne({
      clientId: user._id,
      lawyerId,
      leadType: 'fractional',
      status: { $in: ['pending', 'accepted', 'proposal_sent', 'active'] },
    });

    if (existingLead) {
      return res.status(409).json({ message: 'You already have an active request with this lawyer' });
    }

    // Create lead with fractional type
    const PLATFORM_FEE = Number(process.env.PLATFORM_FEE_AMOUNT) || 10000;

    const lead = await Lead.create({
      lawyerId,
      clientId: user._id,
      leadType: 'fractional',
      enquiryMessage: message || `Fractional GC request for ${companyName}`,
      leadFee: 0,
      platformFee: PLATFORM_FEE,
      clientName: `${user.firstName} ${user.lastName}`,
      clientEmail: user.email,
      clientPhone: user.phone || '',
      fractionalDetails: {
        companyName,
        companyStage,
        industry,
        legalNeeds,
        budgetRange,
        preferredStartDate: preferredStartDate ? new Date(preferredStartDate) : null,
      },
      status: 'pending',
      paymentStatus: 'unpaid',
    });

    // Notify lawyer
    try {
      const lawyerUser = await User.findById(lawyer.userId);
      if (lawyerUser) {
        await sendFractionalRequestEmail(lawyerUser.email, `${lawyerUser.firstName} ${lawyerUser.lastName}`, {
          clientName: `${user.firstName} ${user.lastName}`,
          companyName,
          companyStage,
          industry,
          legalNeeds,
          budgetRange,
          leadId: lead._id.toString(),
        });

        await createNotification(
          lawyerUser._id.toString(),
          'fractional_request',
          'New Fractional GC Request',
          `${companyName} requested fractional GC services`,
          `/dashboard/professional?section=fractional`
        );
      }
    } catch (emailError) {
      console.error('Failed to send fractional request email:', emailError);
    }

    res.status(201).json({
      message: 'Fractional GC request sent. The lawyer will review and send a proposal.',
      leadId: lead._id,
    });
  } catch (error: any) {
    console.error('Request fractional GC error:', error);
    res.status(500).json({ message: 'Failed to submit request', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ============================================
// Lawyer: Get Fractional Requests
// ============================================

// @desc    Get lawyer's fractional GC requests
// @route   GET /api/fractional/requests
export const getFractionalRequests = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await ProfessionalProfile.findOne({ userId: req.user?._id });
    if (!profile) {
      return res.status(404).json({ message: 'Professional profile not found' });
    }

    const leads = await Lead.find({ lawyerId: profile._id, leadType: 'fractional' })
      .populate('clientId', 'firstName lastName email phone')
      .sort({ createdAt: -1 });

    res.json({ count: leads.length, leads });
  } catch (error: any) {
    console.error('Get fractional requests error:', error);
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
};

// ============================================
// Lawyer: Create/Send Proposal
// ============================================

// @desc    Create and send fractional proposal
// @route   POST /api/fractional/proposals
export const createFractionalProposal = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await ProfessionalProfile.findOne({ userId: req.user?._id });
    if (!profile) {
      return res.status(404).json({ message: 'Professional profile not found' });
    }

    const {
      leadId,
      monthlyRetainer,
      hoursPerMonth,
      engagementMonths,
      startDate,
      autoRenew,
      industries,
      companyStages,
      engagementType,
      scopeOfWork,
      customScope,
      paymentTerms,
      terminationNoticeDays,
      includesOutOfScopeRate,
      outOfScopeHourlyRate,
      notes,
    } = req.body;

    // Verify lead exists and belongs to this lawyer
    const lead = await Lead.findOne({ _id: leadId, lawyerId: profile._id, leadType: 'fractional' });
    if (!lead) {
      return res.status(404).json({ message: 'Fractional request not found' });
    }

    // Check if proposal already exists
    const existingProposal = await FractionalProposal.findOne({ leadId, status: { $in: ['draft', 'sent', 'viewed'] } });
    if (existingProposal) {
      return res.status(409).json({ message: 'A proposal already exists for this request' });
    }

    // Validate retainer within lawyer's range
    if (monthlyRetainer < (profile.fractionalGC?.monthlyRetainerMin || 0) ||
        monthlyRetainer > (profile.fractionalGC?.monthlyRetainerMax || Infinity)) {
      return res.status(400).json({ message: 'Retainer outside your configured range' });
    }

    // Calculate expiry (14 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    const proposal = await FractionalProposal.create({
      lawyerId: profile._id,
      clientId: lead.clientId,
      leadId: lead._id,
      monthlyRetainer,
      hoursPerMonth,
      engagementMonths: engagementMonths || 3,
      startDate: new Date(startDate),
      autoRenew: autoRenew !== false,
      industries: industries || [],
      companyStages: companyStages || [],
      engagementType: engagementType || 'Monthly Retainer',
      scopeOfWork: scopeOfWork || [],
      customScope,
      paymentTerms: paymentTerms || 'monthly_advance',
      terminationNoticeDays: terminationNoticeDays || 30,
      includesOutOfScopeRate: includesOutOfScopeRate || false,
      outOfScopeHourlyRate,
      notes,
      status: 'sent',
      sentAt: new Date(),
      expiresAt,
    });

    // Update lead status
    lead.status = 'proposal_sent';
    await lead.save();

    // Notify client
    try {
      const client = await User.findById(lead.clientId);
      if (client) {
        await sendProposalEmail(client.email, `${client.firstName} ${client.lastName}`, {
          lawyerName: `${req.user?.firstName} ${req.user?.lastName}`,
          monthlyRetainer,
          hoursPerMonth,
          engagementMonths: engagementMonths || 3,
          proposalId: proposal._id.toString(),
        });

        await createNotification(
          client._id.toString(),
          'fractional_proposal',
          'New Fractional GC Proposal',
          `You received a proposal for fractional GC services`,
          `/fractional/proposals/${proposal._id}`
        );
      }
    } catch (emailError) {
      console.error('Failed to send proposal email:', emailError);
    }

    res.status(201).json({ message: 'Proposal sent successfully', proposal });
  } catch (error: any) {
    console.error('Create fractional proposal error:', error);
    res.status(500).json({ message: 'Failed to create proposal', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ============================================
// Client: Get Proposals
// ============================================

// @desc    Get client's fractional proposals
// @route   GET /api/fractional/proposals
export const getClientFractionalProposals = async (req: AuthRequest, res: Response) => {
  try {
    const proposals = await FractionalProposal.find({ clientId: req.user?._id })
      .populate('lawyerId', 'firstName lastName photo city state fractionalGC')
      .populate('leadId')
      .sort({ createdAt: -1 });

    res.json({ count: proposals.length, proposals });
  } catch (error: any) {
    console.error('Get client proposals error:', error);
    res.status(500).json({ message: 'Failed to fetch proposals' });
  }
};

// @desc    Get single proposal
// @route   GET /api/fractional/proposals/:id
export const getFractionalProposal = async (req: AuthRequest, res: Response) => {
  try {
    const proposal = await FractionalProposal.findById(req.params.id)
      .populate('lawyerId', 'firstName lastName photo city state fractionalGC bio yearsOfExperience')
      .populate('clientId', 'firstName lastName email')
      .populate('leadId');

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    // Check authorization
    if (proposal.lawyerId.toString() !== req.user?._id.toString() &&
        proposal.clientId.toString() !== req.user?._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Mark as viewed if client
    if (proposal.clientId.toString() === req.user?._id.toString() && proposal.status === 'sent') {
      proposal.status = 'viewed';
      proposal.viewedAt = new Date();
      await proposal.save();

      // Send viewed email to lawyer
      try {
        const lawyerUser = await User.findById((proposal.lawyerId as any).userId || proposal.lawyerId);
        if (lawyerUser) {
          await sendProposalViewedEmail(lawyerUser.email!, `${lawyerUser.firstName} ${lawyerUser.lastName}`, {
            clientName: `${req.user?.firstName} ${req.user?.lastName}`,
            proposalId: proposal._id.toString(),
          });
        }
      } catch (emailError) {
        console.error('Failed to send proposal viewed email:', emailError);
      }
    }

    res.json({ proposal });
  } catch (error: any) {
    console.error('Get fractional proposal error:', error);
    res.status(500).json({ message: 'Failed to fetch proposal' });
  }
};

// ============================================
// Client: Accept/Reject Proposal
// ============================================

// @desc    Accept fractional proposal
// @route   POST /api/fractional/proposals/:id/accept
export const acceptFractionalProposal = async (req: AuthRequest, res: Response) => {
  try {
    const proposal = await FractionalProposal.findById(req.params.id)
      .populate('leadId');

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    if (proposal.clientId.toString() !== req.user?._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (proposal.status !== 'sent' && proposal.status !== 'viewed') {
      return res.status(400).json({ message: 'Proposal cannot be accepted' });
    }

    if (new Date() > proposal.expiresAt) {
      proposal.status = 'expired';
      await proposal.save();
      return res.status(400).json({ message: 'Proposal has expired' });
    }

    // Create Paystack subscription for the retainer
    const paystack = getPaystackService();
    const client = await User.findById(proposal.clientId);

    // Get or create Paystack customer
    let customerCode: string;
    if (!client?.paystackCustomerCode) {
      const customer = await paystack.createCustomer(client!.email!, {
        userId: client!._id.toString(),
        role: client!.role,
      });
      customerCode = customer.customer_code;
      await User.findByIdAndUpdate(client!._id, { paystackCustomerCode: customerCode });
    } else {
      customerCode = client!.paystackCustomerCode;
    }

    // Create subscription plan in Paystack if not exists
    // For simplicity, we'll use inline subscription with amount
    const reference = `frac_${proposal._id}_${Date.now()}`;
    const initResponse = await paystack.initializeTransaction({
      email: client!.email!,
      amount: proposal.monthlyRetainer * 100, // Convert to kobo
      currency: 'NGN',
      reference,
      callback_url: `${process.env.FRONTEND_URL}/fractional/proposals/${proposal._id}?payment=success`,
      metadata: {
        type: 'fractional_subscription',
        proposalId: proposal._id.toString(),
        clientId: client!._id.toString(),
        monthlyRetainer: proposal.monthlyRetainer,
      },
    });

    // Update proposal with payment reference
    proposal.status = 'accepted';
    proposal.acceptedAt = new Date();
    proposal.respondedAt = new Date();
    proposal.paystackRef = reference;
    await proposal.save();

    // Update lead
    if (proposal.leadId) {
      await Lead.findByIdAndUpdate(proposal.leadId, { status: 'accepted' });
    }

    // Notify lawyer
    try {
      const lawyerUser = await User.findById((proposal.lawyerId as any).userId || proposal.lawyerId);
      if (lawyerUser) {
        await createNotification(
          lawyerUser._id.toString(),
          'fractional_accepted',
          'Fractional Proposal Accepted',
          `Your proposal was accepted. Awaiting payment confirmation.`,
          `/dashboard/professional?section=fractional`
        );
      }
    } catch {}

    res.json({
      message: 'Proposal accepted. Please complete payment to activate the engagement.',
      authorizationUrl: initResponse.data.authorization_url,
      reference,
    });
  } catch (error: any) {
    console.error('Accept fractional proposal error:', error);
    res.status(500).json({ message: 'Failed to accept proposal', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// @desc    Accept fractional proposal and send email
// @route   POST /api/fractional/proposals/:id/accept-with-email
export const acceptFractionalProposalWithEmail = async (req: AuthRequest, res: Response) => {
  try {
    const proposal = await FractionalProposal.findById(req.params.id)
      .populate('leadId');

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    if (proposal.clientId.toString() !== req.user?._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (proposal.status !== 'sent' && proposal.status !== 'viewed') {
      return res.status(400).json({ message: 'Proposal cannot be accepted' });
    }

    if (new Date() > proposal.expiresAt) {
      proposal.status = 'expired';
      await proposal.save();
      return res.status(400).json({ message: 'Proposal has expired' });
    }

    // Create Paystack subscription for the retainer
    const paystack = getPaystackService();
    const client = await User.findById(proposal.clientId);

    // Get or create Paystack customer
    let customerCode: string;
    if (!client?.paystackCustomerCode) {
      const customer = await paystack.createCustomer(client!.email!, {
        userId: client!._id.toString(),
        role: client!.role,
      });
      customerCode = customer.customer_code;
      await User.findByIdAndUpdate(client!._id, { paystackCustomerCode: customerCode });
    } else {
      customerCode = client!.paystackCustomerCode;
    }

    // Create subscription plan in Paystack if not exists
    // For simplicity, we'll use inline subscription with amount
    const reference = `frac_${proposal._id}_${Date.now()}`;
    const initResponse = await paystack.initializeTransaction({
      email: client!.email!,
      amount: proposal.monthlyRetainer * 100, // Convert to kobo
      currency: 'NGN',
      reference,
      callback_url: `${process.env.FRONTEND_URL}/fractional/proposals/${proposal._id}?payment=success`,
      metadata: {
        type: 'fractional_subscription',
        proposalId: proposal._id.toString(),
        clientId: client!._id.toString(),
        monthlyRetainer: proposal.monthlyRetainer,
      },
    });

    // Update proposal with payment reference
    proposal.status = 'accepted';
    proposal.acceptedAt = new Date();
    proposal.respondedAt = new Date();
    proposal.paystackRef = reference;
    await proposal.save();

    // Update lead
    if (proposal.leadId) {
      await Lead.findByIdAndUpdate(proposal.leadId, { status: 'accepted' });
    }

    // Notify lawyer with email
    try {
      const lawyerUser = await User.findById((proposal.lawyerId as any).userId || proposal.lawyerId);
      if (lawyerUser) {
        await sendProposalAcceptedEmail(lawyerUser.email!, `${lawyerUser.firstName} ${lawyerUser.lastName}`, {
          clientName: `${client!.firstName} ${client!.lastName}`,
          monthlyRetainer: proposal.monthlyRetainer,
          engagementMonths: proposal.engagementMonths,
          proposalId: proposal._id.toString(),
        });

        await createNotification(
          lawyerUser._id.toString(),
          'fractional_accepted',
          'Fractional Proposal Accepted',
          `Your proposal was accepted. Awaiting payment confirmation.`,
          `/dashboard/professional?section=fractional`
        );
      }
    } catch (emailError) {
      console.error('Failed to send accepted email:', emailError);
    }

    res.json({
      message: 'Proposal accepted. Please complete payment to activate the engagement.',
      authorizationUrl: initResponse.data.authorization_url,
      reference,
    });
  } catch (error: any) {
    console.error('Accept fractional proposal error:', error);
    res.status(500).json({ message: 'Failed to accept proposal', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// @desc    Reject fractional proposal
// @route   POST /api/fractional/proposals/:id/reject
export const rejectFractionalProposal = async (req: AuthRequest, res: Response) => {
  try {
    const { clientNotes } = req.body;

    const proposal = await FractionalProposal.findById(req.params.id);

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    if (proposal.clientId.toString() !== req.user?._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (proposal.status !== 'sent' && proposal.status !== 'viewed') {
      return res.status(400).json({ message: 'Proposal cannot be rejected' });
    }

    proposal.status = 'rejected';
    proposal.respondedAt = new Date();
    proposal.clientNotes = clientNotes;
    await proposal.save();

    // Update lead
    if (proposal.leadId) {
      await Lead.findByIdAndUpdate(proposal.leadId, { status: 'rejected' });
    }

    // Notify lawyer
    try {
      const lawyerUser = await User.findById((proposal.lawyerId as any).userId || proposal.lawyerId);
      if (lawyerUser) {
        await createNotification(
          lawyerUser._id.toString(),
          'fractional_rejected',
          'Fractional Proposal Rejected',
          `Your proposal was rejected by the client.`,
          `/dashboard/professional?section=fractional`
        );
      }
    } catch {}

    res.json({ message: 'Proposal rejected' });
  } catch (error: any) {
    console.error('Reject fractional proposal error:', error);
    res.status(500).json({ message: 'Failed to reject proposal' });
  }
};

// @desc    Reject fractional proposal and send email
// @route   POST /api/fractional/proposals/:id/reject-with-email
export const rejectFractionalProposalWithEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { clientNotes } = req.body;

    const proposal = await FractionalProposal.findById(req.params.id);

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    if (proposal.clientId.toString() !== req.user?._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (proposal.status !== 'sent' && proposal.status !== 'viewed') {
      return res.status(400).json({ message: 'Proposal cannot be rejected' });
    }

    proposal.status = 'rejected';
    proposal.respondedAt = new Date();
    proposal.clientNotes = clientNotes;
    await proposal.save();

    // Update lead
    if (proposal.leadId) {
      await Lead.findByIdAndUpdate(proposal.leadId, { status: 'rejected' });
    }

    // Notify lawyer with email
    try {
      const lawyerUser = await User.findById((proposal.lawyerId as any).userId || proposal.lawyerId);
      if (lawyerUser) {
        await sendProposalRejectedEmail(lawyerUser.email!, `${lawyerUser.firstName} ${lawyerUser.lastName}`, {
          clientName: `${req.user?.firstName} ${req.user?.lastName}`,
          rejectionReason: clientNotes,
          proposalId: proposal._id.toString(),
        });

        await createNotification(
          lawyerUser._id.toString(),
          'fractional_rejected',
          'Fractional Proposal Rejected',
          `Your proposal was rejected by the client.`,
          `/dashboard/professional?section=fractional`
        );
      }
    } catch (emailError) {
      console.error('Failed to send rejected email:', emailError);
    }

    res.json({ message: 'Proposal rejected' });
  } catch (error: any) {
    console.error('Reject fractional proposal error:', error);
    res.status(500).json({ message: 'Failed to reject proposal' });
  }
};

// ============================================
// Lawyer: Get Sent Proposals
// ============================================

// @desc    Get lawyer's sent proposals
// @route   GET /api/fractional/my-proposals
export const getLawyerFractionalProposals = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await ProfessionalProfile.findOne({ userId: req.user?._id });
    if (!profile) {
      return res.status(404).json({ message: 'Professional profile not found' });
    }

    const proposals = await FractionalProposal.find({ lawyerId: profile._id })
      .populate('clientId', 'firstName lastName email')
      .populate('leadId')
      .sort({ createdAt: -1 });

    res.json({ count: proposals.length, proposals });
  } catch (error: any) {
    console.error('Get lawyer proposals error:', error);
    res.status(500).json({ message: 'Failed to fetch proposals' });
  }
};

// ============================================
// Webhook: Handle Subscription Payment
// ============================================

// @desc    Handle fractional subscription payment webhook
// @route   POST /api/webhooks/paystack (handled in webhookController)
export const handleFractionalSubscriptionPayment = async (reference: string) => {
  try {
    // Find proposal by paystack reference
    const proposal = await FractionalProposal.findOne({ paystackRef: reference });
    if (!proposal) {
      console.log('Fractional proposal not found for reference:', reference);
      return;
    }

    // Verify payment with Paystack
    const paystack = getPaystackService();
    const verification = await paystack.verifyTransaction(reference);

    if (!verification.status || verification.data.status !== 'success') {
      console.log('Payment verification failed:', reference);
      return;
    }

    // Create local subscription record
    const plan = await Plan.findOne({ key: 'fractional' });
    const subscription = await Subscription.create({
      userId: proposal.clientId,
      planId: plan?._id,
      plan: 'fractional',
      status: 'active',
      startDate: proposal.startDate,
      endDate: new Date(proposal.startDate.getTime() + proposal.engagementMonths * 30 * 24 * 60 * 60 * 1000),
      autoRenew: proposal.autoRenew,
      paystackRef: reference,
      paystackSubscriptionCode: verification.data.subscription?.subscription_code,
      paystackCustomerCode: verification.data.customer?.customer_code,
      amount: proposal.monthlyRetainer,
      currency: 'NGN',
      billingInterval: 'monthly',
      planSnapshot: {
        name: 'Fractional GC',
        key: 'fractional',
        entitlements: {},
        limits: {},
      },
    });

    proposal.subscriptionId = subscription._id;
    proposal.status = 'active';
    await proposal.save();

    // Update lead
    if (proposal.leadId) {
      await Lead.findByIdAndUpdate(proposal.leadId, { status: 'active' });
    }

    // Notify both parties
    try {
      const [client, lawyerProfile] = await Promise.all([
        User.findById(proposal.clientId),
        ProfessionalProfile.findById(proposal.lawyerId).populate('userId'),
      ]);

      if (client) {
        await createNotification(
          client._id.toString(),
          'fractional_activated',
          'Fractional GC Engagement Active',
          `Your fractional GC engagement is now active.`,
          `/fractional/engagements/${proposal._id}`
        );

        // Send engagement activated email to client
        await sendEngagementActivatedEmail(client.email!, `${client.firstName} ${client.lastName}`, {
          lawyerName: `${(lawyerProfile as any).userId?.firstName} ${(lawyerProfile as any).userId?.lastName}`,
          clientName: `${client.firstName} ${client.lastName}`,
          monthlyRetainer: proposal.monthlyRetainer,
          engagementMonths: proposal.engagementMonths,
          engagementId: proposal._id.toString(),
        });
      }

      if (lawyerProfile && (lawyerProfile as any).userId) {
        await createNotification(
          (lawyerProfile as any).userId.toString(),
          'fractional_activated',
          'Fractional GC Engagement Active',
          `New fractional GC engagement started.`,
          `/dashboard/professional?section=fractional`
        );

        // Send engagement activated email to lawyer
        const lawyerUser = await User.findById((lawyerProfile as any).userId?._id);
        if (lawyerUser) {
          await sendEngagementActivatedEmail(lawyerUser.email!, `${lawyerUser.firstName} ${lawyerUser.lastName}`, {
            lawyerName: `${(lawyerProfile as any).userId?.firstName} ${(lawyerProfile as any).userId?.lastName}`,
            clientName: `${(proposal.clientId as any).firstName} ${(proposal.clientId as any).lastName}`,
            monthlyRetainer: proposal.monthlyRetainer,
            engagementMonths: proposal.engagementMonths,
            engagementId: proposal._id.toString(),
          });
        }
      }
    } catch (notifError) {
      console.error('Failed to send activation notifications:', notifError);
    }

    console.log('Fractional subscription activated:', proposal._id);
  } catch (error: any) {
    console.error('Handle fractional subscription payment error:', error);
  }
};

// ============================================
// Admin: Get Fractional Proposals
// ============================================

// @desc    Get all fractional proposals (admin)
// @route   GET /api/admin/fractional/proposals
export const getAdminFractionalProposals = async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter: any = {};
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [proposals, total] = await Promise.all([
      FractionalProposal.find(filter)
        .populate('lawyerId', 'firstName lastName email photo city state fractionalGC')
        .populate('clientId', 'firstName lastName email')
        .populate('leadId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      FractionalProposal.countDocuments(filter),
    ]);

    res.json({
      proposals,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Get admin fractional proposals error:', error);
    res.status(500).json({ message: 'Failed to fetch proposals' });
  }
};

// @desc    Get single fractional proposal (admin)
// @route   GET /api/admin/fractional/proposals/:id
export const getAdminFractionalProposal = async (req: AuthRequest, res: Response) => {
  try {
    const proposal = await FractionalProposal.findById(req.params.id)
      .populate('lawyerId', 'firstName lastName email photo city state fractionalGC bio yearsOfExperience')
      .populate('clientId', 'firstName lastName email')
      .populate('leadId');

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    res.json({ proposal });
  } catch (error: any) {
    console.error('Get admin fractional proposal error:', error);
    res.status(500).json({ message: 'Failed to fetch proposal' });
  }
};

// @desc    Update fractional proposal (admin)
// @route   PUT /api/admin/fractional/proposals/:id
export const updateAdminFractionalProposal = async (req: AuthRequest, res: Response) => {
  try {
    const { status, reviewNotes } = req.body;

    const proposal = await FractionalProposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    if (status) proposal.status = status;
    if (reviewNotes) proposal.reviewNotes = reviewNotes;

    if (status) {
      proposal.respondedAt = new Date();
      proposal.reviewedBy = req.user?._id;
    }

    await proposal.save();

    res.json({ message: 'Proposal updated successfully', proposal });
  } catch (error: any) {
    console.error('Update admin fractional proposal error:', error);
    res.status(500).json({ message: 'Failed to update proposal' });
  }
};