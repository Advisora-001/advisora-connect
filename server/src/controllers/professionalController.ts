import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import ProfessionalProfile, {
  professionalCategories,
  ProfessionalCategory,
} from '../models/ProfessionalProfile';
import ProfessionalEnquiry from '../models/ProfessionalEnquiry';
import User from '../models/User';

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
    ] as const;

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        profile.set(field, req.body[field]);
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

    const missing: string[] = [];
    if (!profile.professionalTitle.trim()) missing.push('professional title');
    if (!profile.bio.trim()) missing.push('professional bio');
    if (profile.qualifications.length === 0) missing.push('at least one qualification');
    if (profile.verificationDocs.length === 0) missing.push('at least one supporting credential document');
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
    if (profile.verificationDocs.length + files.length > 5) {
      return res.status(400).json({ message: 'A maximum of five verification documents is allowed' });
    }

    profile.verificationDocs = [
      ...profile.verificationDocs,
      ...files.map((file) => (file as Express.Multer.File & { path: string }).path),
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
    if (
      typeof category !== 'string' ||
      !professionalCategories.includes(category as ProfessionalCategory)
    ) {
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
      .select('-verificationDocs -membershipNumber -reviewNote')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ count: profiles.length, profiles });
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
      .select('-verificationDocs -membershipNumber -reviewNote');
    if (!profile) {
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
  getProfilesForReview,
  reviewProfile,
};
