import { Request, Response } from 'express';
import ProfessionalCategory from '../models/ProfessionalCategory';
import ProfessionalProfile from '../models/ProfessionalProfile';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { canAddService, getEffectivePlan, getPlanEntitlements } from '../utils/entitlements';

// @desc    Get public professional profiles by category
// @route   GET /api/professionals
const getProfessionals = async (req: Request, res: Response) => {
  try {
    const { category, specialization, city, state, isAvailable } = req.query;

    const query: any = { verificationStatus: 'verified' };

    if (typeof category === 'string' && category.trim()) {
      const categoryKey = category.trim().toLowerCase();
      const categoryDoc = /^[a-f\d]{24}$/i.test(categoryKey)
        ? await ProfessionalCategory.findById(categoryKey).select('_id')
        : await ProfessionalCategory.findOne({ key: categoryKey, isActive: true }).select('_id');

      if (!categoryDoc) {
        return res.json({ count: 0, professionals: [] });
      }

      query.category = categoryDoc._id;
    }

    const practiceArea = req.query.practiceArea;
    const location = req.query.location;
    if (specialization || practiceArea) query.specialization = specialization || practiceArea;
    if (city || location) query.city = { $regex: (city || location) as string, $options: 'i' };
    if (state) query.state = state;
    if (isAvailable === 'true') query.isAvailable = true;

    const candidates = await ProfessionalProfile.find(query)
      .populate('userId', 'firstName lastName email avatar phone')
      .populate('category', 'key label')
      .sort({ rating: -1 })
      .limit(100);
    const visible = await Promise.all(candidates.map(async (profile) => {
      const ownerId = (profile.userId as any)?._id?.toString();
      if (!ownerId) return false;
      const { plan } = await getEffectivePlan(ownerId);
      return getPlanEntitlements(plan).listing && getPlanEntitlements(plan).searchVisibility;
    }));
    const professionals = candidates.filter((_profile, index) => visible[index]).slice(0, 50);

    res.json({ count: professionals.length, professionals });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single professional profile by ID (public)
// @route   GET /api/professionals/:id
const getProfessionalById = async (req: Request, res: Response) => {
  try {
    const professional = await ProfessionalProfile.findById(req.params.id)
      .populate('userId', 'firstName lastName email avatar phone')
      .populate('category', 'key label specializations registrationFields');

    if (!professional) {
      return res.status(404).json({ message: 'Professional not found' });
    }

    res.json(professional);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update own professional profile
// @route   PUT /api/professionals/profile
const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { profileId } = req.body;
    let profile = await ProfessionalProfile.findOne({
      userId,
      ...(profileId ? { _id: profileId } : {}),
    });
    if (!profile) {
      return res.status(404).json({ message: 'Professional profile not found' });
    }

    const category = await ProfessionalCategory.findById(profile.category);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Validate registration fields against category config
    const { categoryData, ...otherFields } = req.body;

    // Validate categoryData against registrationFields if provided
    if (categoryData && category.registrationFields.length > 0) {
      const mergedCategoryData = { ...(profile.categoryData || {}), ...categoryData };
      for (const field of category.registrationFields) {
        if (field.required && (mergedCategoryData as any)[field.name] === undefined) {
          return res.status(400).json({
            message: `Missing required field: ${field.name}`,
          });
        }
      }
      profile.categoryData = mergedCategoryData;
    }

    // Update other fields
    const allowedFields = [
      'specialization', 'photo', 'bio', 'officeAddress', 'city', 'state',
      'languages', 'yearsOfExperience', 'isAvailable', 'availableDays',
      'availableHours', 'availableFrom', 'availableTo', 'accountName',
      'accountNumber', 'bankName', 'phone', 'services', 'requireApproval',
    ];

    allowedFields.forEach((field) => {
      if (otherFields[field] !== undefined) {
        (profile as any)[field] = otherFields[field];
      }
    });

    if (otherFields.services !== undefined) {
      if (!Array.isArray(otherFields.services)) {
        return res.status(400).json({ message: 'Services must be an array' });
      }
      const existingCount = profile.services?.length || 0;
      const requestedCount = otherFields.services.length;
      const { plan } = await getEffectivePlan(userId.toString());
      const limit = getPlanEntitlements(plan).maxServices;
      if (requestedCount > limit) {
        return res.status(403).json({ message: `Your plan allows up to ${limit} services` });
      }
      if (requestedCount > existingCount) {
        const capacity = await canAddService(userId.toString(), profile._id.toString());
        if (!capacity.canAdd) {
          return res.status(403).json({ message: `Your plan allows up to ${capacity.limit} services` });
        }
      }
    }

    await profile.save();
    await profile.populate('userId', 'firstName lastName email avatar phone');
    await profile.populate('category', 'key label');

    res.json({ message: 'Profile updated', profile });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Submit verification for own professional profile
// @route   POST /api/professionals/verify
const submitVerification = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const profile = await ProfessionalProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ message: 'Professional profile not found' });
    }

    const category = await ProfessionalCategory.findById(profile.category);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Validate required verification docs
    const { verificationDocs } = req.body;
    if (!verificationDocs || !Array.isArray(verificationDocs)) {
      return res.status(400).json({ message: 'Verification documents are required' });
    }

    const requiredDocs = category.verificationRequirements.requiredDocs || [];
    for (const doc of requiredDocs) {
      if (!verificationDocs.includes(doc)) {
        return res.status(400).json({
          message: `Missing required document: ${doc}`,
        });
      }
    }

    profile.verificationStatus = 'pending';
    profile.verificationDocs = verificationDocs;
    await profile.save();

    res.json({ message: 'Verification submitted', profile });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Upload verification documents
// @route   POST /api/professionals/verify-upload
const uploadVerificationDocs = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const profile = await ProfessionalProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ message: 'Professional profile not found' });
    }

    const { docs } = req.body;
    if (!docs || !Array.isArray(docs)) {
      return res.status(400).json({ message: 'Documents array is required' });
    }

    profile.verificationDocs = [...(profile.verificationDocs || []), ...docs];
    await profile.save();

    res.json({ message: 'Documents uploaded', profile });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Accept onboarding agreement
// @route   POST /api/professionals/onboarding/accept
const acceptOnboardingAgreement = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const profile = await ProfessionalProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ message: 'Professional profile not found' });
    }

    profile.onboardingAgreementAccepted = true;
    profile.onboardingAgreementAcceptedAt = new Date();
    await profile.save();

    res.json({ message: 'Onboarding agreement accepted' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Submit professional declaration
// @route   POST /api/professionals/declaration
const submitDeclaration = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { informationAccurate, qualifiedToPractise, noDisciplinaryAction } = req.body;

    const profile = await ProfessionalProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ message: 'Professional profile not found' });
    }

    profile.declaration = {
      informationAccurate: Boolean(informationAccurate),
      qualifiedToPractise: Boolean(qualifiedToPractise),
      noDisciplinaryAction: Boolean(noDisciplinaryAction),
      declaredAt: new Date(),
    };
    await profile.save();

    res.json({ message: 'Declaration submitted', profile });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Upload professional photo
// @route   POST /api/professionals/upload-photo
const uploadPhoto = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { photo } = req.body;
    if (!photo) {
      return res.status(400).json({ message: 'Photo URL is required' });
    }

    const profile = await ProfessionalProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ message: 'Professional profile not found' });
    }

    profile.photo = photo;
    await profile.save();

    res.json({ message: 'Photo updated', profile });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export {
  getProfessionals,
  getProfessionalById,
  updateProfile,
  submitVerification,
  uploadVerificationDocs,
  acceptOnboardingAgreement,
  submitDeclaration,
  uploadPhoto,
};