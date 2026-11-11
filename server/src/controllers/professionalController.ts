import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import ProfessionalProfile, {
  ProfessionalCategory,
} from '../models/ProfessionalProfile';
import ProfessionalEnquiry from '../models/ProfessionalEnquiry';
import ServiceEngagement from '../models/ServiceEngagement';
import User from '../models/User';
import ProfessionalCategoryConfig from '../models/ProfessionalCategory';
import getMembershipBenefits from '../services/membershipEntitlements';

const getMyProfiles = async (req: AuthRequest, res: Response) => {
  try {
    const profiles = await ProfessionalProfile.find({ userId: req.user?._id }).sort({ category: 1 });
    res.json({ profiles });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load professional profiles', error: (error as Error).message });
  }
};

const updateMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await ProfessionalProfile.findOne({
      _id: req.params.id,
      userId: req.user?._id,
    });
    if (!profile) {
      return res.status(404).json({ message: 'Professional profile not found' });
    }

    const categoryConfig = await ProfessionalCategoryConfig.findOne({ key: profile.category, isActive: true });
    if (!categoryConfig) {
      return res.status(400).json({ message: 'This professional category is not currently active.' });
    }

    const allowedFields = [
      'professionalTitle',
      'bio',
      'qualifications',
      'professionalBody',
      'membershipNumber',
      'specializations',
      'services',
      'yearsOfExperience',
      'city',
      'state',
      'country',
      'isAvailable',
      'customFields',
      'serviceListings',
    ] as const;

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        profile.set(field, req.body[field]);
      }
    }

    if (req.body.customFields !== undefined) {
      if (!req.body.customFields || typeof req.body.customFields !== 'object' || Array.isArray(req.body.customFields)) {
        return res.status(400).json({ message: 'Category-specific fields must be provided as an object.' });
      }
      const fieldKeys = new Set(categoryConfig.registrationFields.map((field) => field.key));
      const suppliedKeys = Object.keys(req.body.customFields);
      if (suppliedKeys.some((key) => !fieldKeys.has(key))) {
        return res.status(400).json({ message: 'One or more category-specific fields are not configured.' });
      }
    }

    if (req.body.specializations !== undefined && categoryConfig.specializations.length > 0) {
      if (!Array.isArray(req.body.specializations) || req.body.specializations.some((item: unknown) =>
        typeof item !== 'string' || !categoryConfig.specializations.includes(item)
      )) {
        return res.status(400).json({ message: 'Select specializations configured for this professional category.' });
      }
    }

    if (req.body.services !== undefined && categoryConfig.serviceTypes.length > 0) {
      if (!Array.isArray(req.body.services) || req.body.services.some((item: unknown) =>
        typeof item !== 'string' || !categoryConfig.serviceTypes.includes(item)
      )) {
        return res.status(400).json({ message: 'Select services configured for this professional category.' });
      }
    }

    if (req.body.serviceListings !== undefined) {
      if (!Array.isArray(req.body.serviceListings)) {
        return res.status(400).json({ message: 'Service listings must be provided as a list.' });
      }
      const benefits = await getMembershipBenefits(profile.userId, profile.firmId);
      if (benefits.maxServices >= 0 && req.body.serviceListings.length > benefits.maxServices) {
        return res.status(403).json({ message: `Your membership allows up to ${benefits.maxServices} service listing(s).` });
      }
      const invalidService = req.body.serviceListings.some((listing: { name?: unknown; consultationOptions?: unknown }) =>
        !listing || typeof listing.name !== 'string' ||
        (categoryConfig.serviceTypes.length > 0 && !categoryConfig.serviceTypes.includes(listing.name)) ||
        !Array.isArray(listing.consultationOptions) ||
        listing.consultationOptions.some((option: unknown) =>
          typeof option !== 'string' || (categoryConfig.consultationOptions.length > 0 && !categoryConfig.consultationOptions.includes(option))
        )
      );
      if (invalidService) {
        return res.status(400).json({ message: 'Service listing contains a service type or consultation option not configured for this category.' });
      }
    }

    if (profile.isModified()) {
      profile.verificationStatus = 'draft';
      profile.reviewNote = '';
    }

    await profile.save();
    res.json({ message: 'Profile saved as draft', profile });
  } catch (error) {
    res.status(400).json({ message: 'Failed to update professional profile', error: (error as Error).message });
  }
};

const submitMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await ProfessionalProfile.findOne({
      _id: req.params.id,
      userId: req.user?._id,
    });
    if (!profile) {
      return res.status(404).json({ message: 'Professional profile not found' });
    }
    const categoryConfig = await ProfessionalCategoryConfig.findOne({ key: profile.category, isActive: true });
    if (!categoryConfig) {
      return res.status(400).json({ message: 'This professional category is not currently active.' });
    }

    const missing: string[] = [];
    if (!profile.professionalTitle.trim()) missing.push('professional title');
    if (!profile.bio.trim()) missing.push('professional bio');
    if (profile.qualifications.length === 0) missing.push('at least one qualification');
    for (const field of categoryConfig.registrationFields) {
      if (field.required && !String(profile.customFields.get(field.key) || '').trim()) {
        missing.push(field.label);
      }
    }
    if (categoryConfig.verificationRequirements.some((requirement) =>
      requirement.required && !profile.verificationUploads.some((upload) => upload.requirementKey === requirement.key)
    )) {
      missing.push('all required category-specific verification documents');
    }
    if (profile.services.length === 0) missing.push('at least one service');
    if (!profile.city.trim() || !profile.state.trim()) missing.push('city and state');

    if (missing.length > 0) {
      return res.status(400).json({
        message: `Complete the following before submitting: ${missing.join(', ')}`,
      });
    }

    profile.verificationStatus = 'pending';
    profile.reviewNote = '';
    await profile.save();
    res.json({ message: 'Profile submitted for review', profile });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit profile for review', error: (error as Error).message });
  }
};

const uploadMyVerificationDocs = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await ProfessionalProfile.findOne({
      _id: req.params.id,
      userId: req.user?._id,
    });
    if (!profile) {
      return res.status(404).json({ message: 'Professional profile not found' });
    }

    const files = req.files as unknown as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'Select at least one verification document' });
    }
    const categoryConfig = await ProfessionalCategoryConfig.findOne({ key: profile.category, isActive: true });
    const requirementKey = typeof req.body.requirementKey === 'string' ? req.body.requirementKey : '';
    const requirement = categoryConfig?.verificationRequirements.find((item) => item.key === requirementKey);
    if (!requirement) {
      return res.status(400).json({ message: 'Select a verification requirement configured for this category.' });
    }
    if (profile.verificationDocs.length + files.length > 5) {
      return res.status(400).json({ message: 'A maximum of five verification documents is allowed' });
    }

    profile.verificationDocs = [
      ...profile.verificationDocs,
      ...files.map((file) => (file as Express.Multer.File & { path: string }).path),
    ];
    profile.verificationUploads = [
      ...profile.verificationUploads.filter((upload) => upload.requirementKey !== requirementKey),
      ...files.map((file) => ({
        requirementKey,
        url: (file as Express.Multer.File & { path: string }).path,
      })),
    ];
    profile.verificationStatus = 'draft';
    profile.reviewNote = '';
    await profile.save();
    res.status(201).json({ message: 'Verification documents uploaded', profile });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload verification documents', error: (error as Error).message });
  }
};

const getPublicProfiles = async (req: Request, res: Response) => {
  try {
    const category = req.query.category;
    if (typeof category !== 'string' || !(await ProfessionalCategoryConfig.exists({ key: category, isActive: true }))) {
      return res.status(400).json({ message: 'A valid professional category is required' });
    }

    const filter: Record<string, unknown> = {
      category,
      verificationStatus: 'verified',
    };
    const searchTerm = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    if (searchTerm) {
      const escapedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedSearch, 'i');
      const matchingUsers = await User.find({
        $or: [{ firstName: searchRegex }, { lastName: searchRegex }],
      }).select('_id').limit(200);
      filter.$or = [
        { professionalTitle: searchRegex },
        { bio: searchRegex },
        { specializations: searchRegex },
        { services: searchRegex },
        { userId: { $in: matchingUsers.map((user) => user._id) } },
      ];
    }
    if (typeof req.query.state === 'string' && req.query.state.trim()) {
      filter.state = new RegExp(`^${req.query.state.trim()}$`, 'i');
    }
    if (typeof req.query.city === 'string' && req.query.city.trim()) {
      const escapedCity = req.query.city.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.city = new RegExp(escapedCity, 'i');
    }
    if (typeof req.query.specialization === 'string' && req.query.specialization.trim()) {
      const escapedSpecialization = req.query.specialization.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.specializations = new RegExp(escapedSpecialization, 'i');
    }

    const profiles = await ProfessionalProfile.find(filter)
      .populate('userId', 'firstName lastName avatar')
      .select('-verificationDocs -verificationUploads -membershipNumber -customFields -reviewNote')
      .sort({ createdAt: -1 })
      .limit(100);
    const visibleProfiles = await Promise.all(profiles.map(async (profile) => ({
      profile,
      benefits: await getMembershipBenefits(profile.userId, profile.firmId),
    })));
    const eligibleProfiles = visibleProfiles
      .filter(({ benefits }) => benefits.directoryListing !== false)
      .sort((left, right) => Number(right.benefits.increasedSearchVisibility) - Number(left.benefits.increasedSearchVisibility))
      .map(({ profile }) => profile);
    res.json({ count: eligibleProfiles.length, profiles: eligibleProfiles });
  } catch (error) {
    res.status(500).json({ message: 'Failed to search professional profiles', error: (error as Error).message });
  }
};

const getPublicProfile = async (req: Request, res: Response) => {
  try {
    const profile = await ProfessionalProfile.findOne({
      _id: req.params.id,
      verificationStatus: 'verified',
    }).populate('userId', 'firstName lastName avatar')
      .select('-verificationDocs -verificationUploads -membershipNumber -customFields -reviewNote');
    if (!profile) {
      return res.status(404).json({ message: 'Professional profile not found' });
    }
    const benefits = await getMembershipBenefits(profile.userId, profile.firmId);
    if (benefits.directoryListing === false) {
      return res.status(404).json({ message: 'Professional profile not found' });
    }
    res.json({ profile });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load professional profile', error: (error as Error).message });
  }
};

const createEnquiry = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'client') {
      return res.status(403).json({ message: 'A client account is required to contact a professional' });
    }
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Verify your email before sending an enquiry' });
    }

    const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
    if (!message || message.length > 2000) {
      return res.status(400).json({ message: 'Enquiry message is required and must be 2000 characters or fewer' });
    }

    const profile = await ProfessionalProfile.findOne({
      _id: req.params.id,
      verificationStatus: 'verified',
      isAvailable: true,
    });
    if (!profile) {
      return res.status(404).json({ message: 'Available professional profile not found' });
    }
    if (profile.userId.toString() === user._id.toString()) {
      return res.status(400).json({ message: 'You cannot enquire about your own profile' });
    }
    const benefits = await getMembershipBenefits(profile.userId, profile.firmId);
    if (benefits.receiveEnquiries === false) {
      return res.status(403).json({ message: 'This professional is not accepting enquiries.' });
    }

    const enquiry = await ProfessionalEnquiry.create({
      professionalProfileId: profile._id,
      professionalUserId: profile.userId,
      clientId: user._id,
      message,
    });
    res.status(201).json({ message: 'Enquiry sent to the professional', enquiry });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send professional enquiry', error: (error as Error).message });
  }
};

const getMyEnquiries = async (req: AuthRequest, res: Response) => {
  try {
    const enquiries = await ProfessionalEnquiry.find({ professionalUserId: req.user?._id })
      .populate('professionalProfileId', 'category professionalTitle')
      .populate('clientId', 'firstName lastName email')
      .sort({ createdAt: -1 });
    res.json({ enquiries });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load professional enquiries', error: (error as Error).message });
  }
};

const getMySentEnquiries = async (req: AuthRequest, res: Response) => {
  try {
    const enquiries = await ProfessionalEnquiry.find({ clientId: req.user?._id })
      .populate('professionalProfileId', 'category professionalTitle')
      .populate('professionalUserId', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json({ enquiries });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load sent professional enquiries', error: (error as Error).message });
  }
};

const createServiceEngagement = async (req: AuthRequest, res: Response) => {
  try {
    const enquiry = await ProfessionalEnquiry.findOne({
      _id: req.params.id,
      professionalUserId: req.user?._id,
      status: 'pending',
    });
    if (!enquiry) return res.status(404).json({ message: 'Open professional enquiry not found.' });

    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    const scope = typeof req.body.scope === 'string' ? req.body.scope.trim() : '';
    const proposedFee = req.body.proposedFee === undefined ? undefined : Number(req.body.proposedFee);
    if (!title || title.length > 200 || !scope || scope.length > 5000 ||
      (proposedFee !== undefined && (!Number.isFinite(proposedFee) || proposedFee < 0))) {
      return res.status(400).json({ message: 'Provide a valid engagement title, scope, and optional non-negative fee.' });
    }

    const engagement = await ServiceEngagement.create({
      professionalProfileId: enquiry.professionalProfileId,
      clientId: enquiry.clientId,
      enquiryId: enquiry._id,
      title,
      scope,
      proposedFee,
      status: 'proposed',
    });
    enquiry.status = 'closed';
    await enquiry.save();
    res.status(201).json({ engagement });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return res.status(409).json({ message: 'An engagement has already been proposed for this enquiry.' });
    }
    res.status(500).json({ message: 'Failed to create service engagement', error: (error as Error).message });
  }
};

const getMyServiceEngagements = async (req: AuthRequest, res: Response) => {
  try {
    const profileIds = req.user && ['professional', 'lawyer'].includes(req.user.role)
      ? await ProfessionalProfile.find({ userId: req.user?._id }).distinct('_id')
      : [];
    const engagements = await ServiceEngagement.find({
      $or: [{ clientId: req.user?._id }, { professionalProfileId: { $in: profileIds } }],
    })
      .populate({ path: 'professionalProfileId', select: 'category professionalTitle userId', populate: { path: 'userId', select: 'firstName lastName' } })
      .populate('clientId', 'firstName lastName')
      .sort({ updatedAt: -1 });
    res.json({ engagements });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load service engagements', error: (error as Error).message });
  }
};

const updateServiceEngagementStatus = async (req: AuthRequest, res: Response) => {
  try {
    const status = req.body.status;
    if (!['active', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Select a valid engagement status.' });
    }
    const engagement = await ServiceEngagement.findById(req.params.id);
    if (!engagement) return res.status(404).json({ message: 'Service engagement not found.' });

    const profile = await ProfessionalProfile.findById(engagement.professionalProfileId);
    if (!profile) return res.status(404).json({ message: 'Engagement professional profile not found.' });
    const isProfessional = profile.userId.toString() === req.user?._id.toString();
    const isClient = engagement.clientId.toString() === req.user?._id.toString();
    const canAccept = isClient && status === 'active' && engagement.status === 'proposed';
    const canCancel = (isClient || isProfessional) && status === 'cancelled' && ['proposed', 'active'].includes(engagement.status);
    const canComplete = isProfessional && status === 'completed' && engagement.status === 'active';
    if (!canAccept && !canCancel && !canComplete) {
      return res.status(403).json({ message: 'You are not allowed to make this engagement status change.' });
    }

    engagement.status = status;
    if (status === 'active') engagement.startDate = new Date();
    if (status === 'completed' || status === 'cancelled') engagement.endDate = new Date();
    await engagement.save();
    res.json({ engagement });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update service engagement', error: (error as Error).message });
  }
};

const getProfilesForReview = async (_req: AuthRequest, res: Response) => {
  try {
    const profiles = await ProfessionalProfile.find()
      .populate('userId', 'firstName lastName email phone')
      .sort({ updatedAt: -1 });
    res.json({ profiles });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load professional profiles', error: (error as Error).message });
  }
};

const reviewProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { status, reviewNote } = req.body;
    if (status !== 'verified' && status !== 'rejected') {
      return res.status(400).json({ message: 'Status must be verified or rejected' });
    }

    const profile = await ProfessionalProfile.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: status, reviewNote: typeof reviewNote === 'string' ? reviewNote : '' },
      { new: true, runValidators: true }
    );
    if (!profile) {
      return res.status(404).json({ message: 'Professional profile not found' });
    }
    res.json({ message: `Professional profile ${status}`, profile });
  } catch (error) {
    res.status(500).json({ message: 'Failed to review professional profile', error: (error as Error).message });
  }
};

export {
  getMyProfiles,
  updateMyProfile,
  submitMyProfile,
  uploadMyVerificationDocs,
  getPublicProfiles,
  getPublicProfile,
  createEnquiry,
  getMyEnquiries,
  getMySentEnquiries,
  createServiceEngagement,
  getMyServiceEngagements,
  updateServiceEngagementStatus,
  getProfilesForReview,
  reviewProfile,
};
