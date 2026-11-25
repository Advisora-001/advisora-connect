import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import ProBonoApplication from '../models/ProBonoApplication';
import VolunteerLawyer from '../models/VolunteerLawyer';
import User from '../models/User';
import { createNotification } from './notificationController';
import { sendProBonoApplicationEmail, sendVolunteerRegistrationEmail } from '../services/email';

// ============================================
// Pro Bono Application (Public)
// ============================================

// @desc    Submit pro bono application
// @route   POST /api/pro-bono/apply
export const submitProBonoApplication = async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      country,
      employmentStatus,
      monthlyIncome,
      dependantsCount,
      financialHardshipDetails,
      legalIssueCategory,
      legalIssueDescription,
      urgencyLevel,
      hasExistingLegalProceedings,
      existingProceedingsDetails,
      supportingDocuments,
      consentToShareInfo,
      consentToContact,
      declarationOfTruth,
    } = req.body;

    // Validate required fields
    const requiredFields = [
      'firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state',
      'employmentStatus', 'financialHardshipDetails', 'legalIssueCategory',
      'legalIssueDescription', 'consentToShareInfo', 'consentToContact', 'declarationOfTruth'
    ];

    for (const field of requiredFields) {
      if (!req.body[field] && field !== 'monthlyIncome' && field !== 'dateOfBirth' && field !== 'gender') {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate declarations
    if (!consentToShareInfo || !consentToContact || !declarationOfTruth) {
      return res.status(400).json({ message: 'All declarations must be accepted' });
    }

    // Validate supporting documents (max 10MB each, max 5 files)
    if (supportingDocuments && supportingDocuments.length > 0) {
      if (supportingDocuments.length > 5) {
        return res.status(400).json({ message: 'Maximum 5 supporting documents allowed' });
      }
      for (const doc of supportingDocuments) {
        if (doc.fileSize > 10 * 1024 * 1024) { // 10MB
          return res.status(400).json({ message: `File ${doc.fileName} exceeds 10MB limit` });
        }
      }
    }

    // Create application
    const application = await ProBonoApplication.create({
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      country: country || 'Nigeria',
      employmentStatus,
      monthlyIncome,
      dependantsCount: dependantsCount || 0,
      financialHardshipDetails,
      legalIssueCategory,
      legalIssueDescription,
      urgencyLevel: urgencyLevel || 'medium',
      hasExistingLegalProceedings: hasExistingLegalProceedings || false,
      existingProceedingsDetails,
      supportingDocuments: supportingDocuments || [],
      consentToShareInfo,
      consentToContact,
      declarationOfTruth,
      status: 'submitted',
      submittedAt: new Date(),
    });

    // Send confirmation email to applicant
    try {
      await sendProBonoApplicationEmail(email, firstName, application._id.toString());
    } catch (emailError) {
      console.error('Failed to send application confirmation email:', emailError);
    }

    // Notify admins
    try {
      const admins = await User.find({ role: 'admin', isActive: true });
      for (const admin of admins) {
        await createNotification(
          admin._id.toString(),
          'pro_bono_application',
          'New Pro Bono Application',
          `${firstName} ${lastName} submitted a pro bono application for ${legalIssueCategory}`,
          `/admin/pro-bono/applications/${application._id}`
        );
      }
    } catch (notifError) {
      console.error('Failed to notify admins:', notifError);
    }

    res.status(201).json({
      message: 'Application submitted successfully. Our team will review and contact you within 5 business days.',
      applicationId: application._id,
    });
  } catch (error: any) {
    console.error('Submit pro bono application error:', error);
    res.status(500).json({ message: 'Failed to submit application', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// @desc    Get pro bono application status (for applicant)
// @route   GET /api/pro-bono/application/:id
export const getProBonoApplication = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const application = await ProBonoApplication.findById(id);

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // If user is authenticated, verify ownership
    if (req.user && application.email !== req.user.email) {
      return res.status(403).json({ message: 'Not authorized to view this application' });
    }

    res.json({ application });
  } catch (error: any) {
    console.error('Get pro bono application error:', error);
    res.status(500).json({ message: 'Failed to fetch application' });
  }
};

// ============================================
// Volunteer Lawyer Registration (Public)
// ============================================

// @desc    Register as volunteer lawyer
// @route   POST /api/pro-bono/volunteer
export const registerVolunteerLawyer = async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      licenseType,
      licenseNumber,
      licensingBody,
      yearOfCall,
      jurisdiction,
      isCurrentlyPracticing,
      practiceAreas,
      preferredCategories,
      maxCasesPerMonth,
      availabilityHoursPerWeek,
      preferredConsultationModes,
      languages,
      commitmentLevel,
      willingToMentor,
      noDisciplinaryActions,
      noConflictsOfInterest,
      understandsProBonoObligations,
      professionalIndemnityInsurance,
    } = req.body;

    // Validate required fields
    const requiredFields = [
      'firstName', 'lastName', 'email', 'phone', 'licenseType', 'licenseNumber',
      'licensingBody', 'yearOfCall', 'jurisdiction', 'practiceAreas',
      'preferredCategories', 'noDisciplinaryActions', 'noConflictsOfInterest',
      'understandsProBonoObligations'
    ];

    for (const field of requiredFields) {
      if (!req.body[field] && field !== 'willingToMentor' && field !== 'professionalIndemnityInsurance') {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate declarations
    if (!noDisciplinaryActions || !noConflictsOfInterest || !understandsProBonoObligations) {
      return res.status(400).json({ message: 'All professional declarations must be accepted' });
    }

    // Check for existing registration
    const existing = await VolunteerLawyer.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'A volunteer registration with this email already exists' });
    }

    // Create volunteer registration
    const volunteer = await VolunteerLawyer.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      licenseType,
      licenseNumber,
      licensingBody,
      yearOfCall,
      jurisdiction: jurisdiction || 'Nigeria',
      isCurrentlyPracticing: isCurrentlyPracticing !== false,
      practiceAreas: practiceAreas || [],
      preferredCategories: preferredCategories || [],
      maxCasesPerMonth: maxCasesPerMonth || 2,
      availabilityHoursPerWeek: availabilityHoursPerWeek || 5,
      preferredConsultationModes: preferredConsultationModes || ['video'],
      languages: languages || [],
      commitmentLevel: commitmentLevel || 'regular',
      willingToMentor: willingToMentor || false,
      noDisciplinaryActions,
      noConflictsOfInterest,
      understandsProBonoObligations,
      professionalIndemnityInsurance: professionalIndemnityInsurance || false,
      status: 'pending',
    });

    // Send confirmation email
    try {
      await sendVolunteerRegistrationEmail(email, firstName, volunteer._id.toString());
    } catch (emailError) {
      console.error('Failed to send volunteer confirmation email:', emailError);
    }

    // Notify admins
    try {
      const admins = await User.find({ role: 'admin', isActive: true });
      for (const admin of admins) {
        await createNotification(
          admin._id.toString(),
          'volunteer_registration',
          'New Volunteer Lawyer Registration',
          `${firstName} ${lastName} registered as a volunteer lawyer`,
          `/admin/pro-bono/volunteers/${volunteer._id}`
        );
      }
    } catch (notifError) {
      console.error('Failed to notify admins:', notifError);
    }

    res.status(201).json({
      message: 'Volunteer registration submitted successfully. Our team will review and contact you within 5 business days.',
      volunteerId: volunteer._id,
    });
  } catch (error: any) {
    console.error('Register volunteer lawyer error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A volunteer registration with this email already exists' });
    }
    res.status(500).json({ message: 'Failed to submit volunteer registration', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ============================================
// Admin Routes
// ============================================

// @desc    Get all pro bono applications (admin)
// @route   GET /api/admin/pro-bono/applications
export const getAdminProBonoApplications = async (req: AuthRequest, res: Response) => {
  try {
    const { status, category, urgency, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = {};
    if (status) filter.status = status;
    if (category) filter.legalIssueCategory = category;
    if (urgency) filter.urgencyLevel = urgency;

    const [applications, total] = await Promise.all([
      ProBonoApplication.find(filter)
        .populate('assignedVolunteerLawyer', 'firstName lastName email')
        .populate('reviewedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ProBonoApplication.countDocuments(filter),
    ]);

    res.json({
      applications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Get admin pro bono applications error:', error);
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
};

// @desc    Get single pro bono application (admin)
// @route   GET /api/admin/pro-bono/applications/:id
export const getAdminProBonoApplication = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const application = await ProBonoApplication.findById(id)
      .populate('assignedVolunteerLawyer')
      .populate('reviewedBy', 'firstName lastName email');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.json({ application });
  } catch (error: any) {
    console.error('Get admin pro bono application error:', error);
    res.status(500).json({ message: 'Failed to fetch application' });
  }
};

// @desc    Update pro bono application status (admin)
// @route   PUT /api/admin/pro-bono/applications/:id
export const updateProBonoApplication = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes, assignedVolunteerLawyer, approvedScope, rejectionReason } = req.body;

    const application = await ProBonoApplication.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const validStatuses = ['under_review', 'more_info_needed', 'approved_consultation', 'approved_limited', 'approved_representation', 'rejected', 'withdrawn'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Update fields
    if (status) application.status = status;
    if (reviewNotes) application.reviewNotes = reviewNotes;
    if (assignedVolunteerLawyer) application.assignedVolunteerLawyer = assignedVolunteerLawyer;
    if (approvedScope) application.approvedScope = approvedScope;
    if (rejectionReason) application.rejectionReason = rejectionReason;
    if (status && status !== 'submitted' && status !== 'under_review') {
      application.reviewedBy = req.user?._id;
      application.reviewedAt = new Date();
    }

    await application.save();

    // Notify applicant of status change
    if (status && ['approved_consultation', 'approved_limited', 'approved_representation', 'rejected', 'more_info_needed'].includes(status)) {
      try {
        const statusMessages: Record<string, string> = {
          approved_consultation: 'approved for a free initial consultation',
          approved_limited: 'approved for limited-scope legal assistance',
          approved_representation: 'approved for legal representation',
          rejected: 'not approved at this time',
          more_info_needed: 'requires additional information',
        };

        await createNotification(
          application._id.toString(), // Using application ID as reference - would need userId field for proper notification
          'pro_bono_status_update',
          'Pro Bono Application Update',
          `Your application has been ${statusMessages[status] || 'updated'}`,
          `/pro-bono/application/${application._id}`
        );
      } catch (notifError) {
        console.error('Failed to notify applicant:', notifError);
      }
    }

    res.json({ message: 'Application updated successfully', application });
  } catch (error: any) {
    console.error('Update pro bono application error:', error);
    res.status(500).json({ message: 'Failed to update application' });
  }
};

// @desc    Get all volunteer lawyers (admin)
// @route   GET /api/admin/pro-bono/volunteers
export const getAdminVolunteerLawyers = async (req: AuthRequest, res: Response) => {
  try {
    const { status, category, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = {};
    if (status) filter.status = status;
    if (category) filter.preferredCategories = category;

    const [volunteers, total] = await Promise.all([
      VolunteerLawyer.find(filter)
        .populate('reviewedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      VolunteerLawyer.countDocuments(filter),
    ]);

    res.json({
      volunteers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Get admin volunteer lawyers error:', error);
    res.status(500).json({ message: 'Failed to fetch volunteers' });
  }
};

// @desc    Get single volunteer lawyer (admin)
// @route   GET /api/admin/pro-bono/volunteers/:id
export const getAdminVolunteerLawyer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const volunteer = await VolunteerLawyer.findById(id)
      .populate('reviewedBy', 'firstName lastName email')
      .populate('userId', 'firstName lastName email role');

    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    res.json({ volunteer });
  } catch (error: any) {
    console.error('Get admin volunteer lawyer error:', error);
    res.status(500).json({ message: 'Failed to fetch volunteer' });
  }
};

// @desc    Update volunteer lawyer status (admin)
// @route   PUT /api/admin/pro-bono/volunteers/:id
export const updateVolunteerLawyer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes } = req.body;

    const volunteer = await VolunteerLawyer.findById(id);
    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    const validStatuses = ['approved', 'rejected', 'suspended', 'withdrawn'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    if (status) volunteer.status = status;
    if (reviewNotes) volunteer.reviewNotes = reviewNotes;
    if (status && status !== 'pending') {
      volunteer.reviewedBy = req.user?._id;
      volunteer.reviewedAt = new Date();
    }

    await volunteer.save();

    // Notify volunteer
    try {
      if (status) {
        const statusMessages: Record<string, string> = {
          approved: 'approved! You can now receive pro bono referrals',
          rejected: 'not approved at this time',
          suspended: 'suspended',
        };

        await createNotification(
          volunteer._id.toString(),
          'volunteer_status_update',
          'Volunteer Registration Update',
          `Your volunteer registration has been ${statusMessages[status] || 'updated'}`,
          '/pro-bono/volunteer'
        );
      }
    } catch (notifError) {
      console.error('Failed to notify volunteer:', notifError);
    }

    res.json({ message: 'Volunteer updated successfully', volunteer });
  } catch (error: any) {
    console.error('Update volunteer lawyer error:', error);
    res.status(500).json({ message: 'Failed to update volunteer' });
  }
};

// @desc    Get pro bono statistics (admin)
// @route   GET /api/admin/pro-bono/stats
export const getProBonoStats = async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      totalVolunteers,
      approvedVolunteers,
      pendingVolunteers,
    ] = await Promise.all([
      ProBonoApplication.countDocuments(),
      ProBonoApplication.countDocuments({ status: { $in: ['submitted', 'under_review', 'more_info_needed'] } }),
      ProBonoApplication.countDocuments({ status: { $in: ['approved_consultation', 'approved_limited', 'approved_representation'] } }),
      ProBonoApplication.countDocuments({ status: 'rejected' }),
      VolunteerLawyer.countDocuments(),
      VolunteerLawyer.countDocuments({ status: 'approved' }),
      VolunteerLawyer.countDocuments({ status: 'pending' }),
    ]);

    // Category breakdown
    const categoryStats = await ProBonoApplication.aggregate([
      { $group: { _id: '$legalIssueCategory', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Urgency breakdown
    const urgencyStats = await ProBonoApplication.aggregate([
      { $group: { _id: '$urgencyLevel', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      applications: {
        total: totalApplications,
        pending: pendingApplications,
        approved: approvedApplications,
        rejected: rejectedApplications,
      },
      volunteers: {
        total: totalVolunteers,
        approved: approvedVolunteers,
        pending: pendingVolunteers,
      },
      categories: categoryStats,
      urgency: urgencyStats,
    });
  } catch (error: any) {
    console.error('Get pro bono stats error:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
};