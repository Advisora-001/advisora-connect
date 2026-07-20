import { Request, Response } from 'express';
import LawyerProfile from '../models/LawyerProfile';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

// @desc    Get all lawyers (with search & filters)
// @route   GET /api/lawyers
const getLawyers = async (req: Request, res: Response) => {
  try {
    const { practiceArea, location, state, experience, name, isAvailable } = req.query;

    const query: any = { verificationStatus: 'verified' };

    if (practiceArea) {
      query.practiceAreas = { $in: [practiceArea as string] };
    }
    if (location) {
      query.city = { $regex: location as string, $options: 'i' };
    }
    if (state) {
      query.state = state as string;
    }
    if (isAvailable === 'true') {
      query.isAvailable = true;
    }
    if (experience) {
      query.yearsOfExperience = { $gte: parseInt(experience as string) };
    }

    // Sort: featured first, then by rating
    let sortBy: any = { rating: -1 };
    
    const lawyers = await LawyerProfile.find(query)
      .populate('userId', 'firstName lastName email avatar')
      .sort({ 'featuredListing.isActive': -1, rating: -1 })
      .limit(50);

    // If name search, filter by name
    let filteredLawyers = lawyers;
    if (name) {
      const nameStr = (name as string).toLowerCase();
      filteredLawyers = lawyers.filter((l: any) => {
        const fullName = `${l.userId?.firstName} ${l.userId?.lastName}`.toLowerCase();
        return fullName.includes(nameStr);
      });
    }

    res.json({ count: filteredLawyers.length, lawyers: filteredLawyers });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Get single lawyer profile
// @route   GET /api/lawyers/:id
const getLawyerById = async (req: AuthRequest, res: Response) => {
  try {
    const requester = req.user;
    if (!requester) {
      return res.status(401).json({ message: 'Please log in to view lawyer profiles.', code: 'AUTH_REQUIRED' });
    }

    const lawyer = await LawyerProfile.findById(req.params.id)
      .populate('userId', 'firstName lastName email avatar phone');

    if (!lawyer) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }

    res.json(lawyer);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update lawyer profile
// @route   PUT /api/lawyers/profile
const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    console.log('Update profile request:', { userId: req.user?._id, body: req.body });
    
    let profile = await LawyerProfile.findOne({ userId: req.user?._id });
    if (!profile) {
      profile = new LawyerProfile({ userId: req.user?._id });
    }

    const allowedFields = [
      'barNumber', 'stateOfCall', 'yearOfCall', 'practiceAreas', 'bio',
      'officeAddress', 'city', 'state', 'languages', 'yearsOfExperience',
      'consultationFee', 'isAvailable', 'availableDays', 'availableHours', 'accountName', 'accountNumber', 'bankName'
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        (profile as any)[field] = req.body[field];
      }
    });

    const updatedProfile = await profile.save();
    console.log('Profile updated successfully:', updatedProfile._id);
    res.json(updatedProfile);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ 
      message: 'Failed to update profile', 
      error: (error as Error).message 
    });
  }
};

// @desc    Upload verification documents
// @route   POST /api/lawyers/verify
const submitVerification = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await LawyerProfile.findOne({ userId: req.user?._id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const { verificationDocs } = req.body;
    if (verificationDocs) {
      profile.verificationDocs = verificationDocs;
      profile.verificationStatus = 'pending';
      await profile.save();
    }

    res.json({ message: 'Verification documents submitted', verificationStatus: profile.verificationStatus });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get lawyers for dropdown (public)
// @route   GET /api/lawyers/list
const getLawyersList = async (_req: Request, res: Response) => {
  try {
    const lawyers = await LawyerProfile.find({ verificationStatus: 'verified' })
      .populate('userId', 'firstName lastName')
      .select('practiceAreas city state')
      .limit(100);

    res.json(lawyers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Upload verification documents (multipart)
// @route   POST /api/lawyers/verify-upload
const uploadVerificationDocs = async (req: AuthRequest, res: Response) => {
  try {
    const files = req.files as unknown as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No documents uploaded' });
    }

    const verificationDocs = files.map((file) => (file as any).path);

    const profile = await LawyerProfile.findOne({ userId: req.user?._id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    profile.verificationDocs = verificationDocs;
    profile.verificationStatus = 'pending';
    await profile.save();

    res.status(201).json({
      message: 'Verification documents uploaded',
      verificationStatus: profile.verificationStatus,
      verificationDocs: profile.verificationDocs,
    });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: (error as Error).message });
  }
};

// @desc    Accept onboarding agreement
// @route   POST /api/lawyers/onboarding/accept
const acceptOnboardingAgreement = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await LawyerProfile.findOne({ userId: req.user?._id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    profile.onboardingAgreementAccepted = true;
    profile.onboardingAgreementAcceptedAt = new Date();
    await profile.save();

    res.json({ message: 'Onboarding agreement accepted', onboardingAgreementAccepted: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Submit professional declaration
// @route   POST /api/lawyers/declaration
const submitDeclaration = async (req: AuthRequest, res: Response) => {
  try {
    const { informationAccurate, qualifiedToPractise, noDisciplinaryAction } = req.body;

    if (!informationAccurate || !qualifiedToPractise || !noDisciplinaryAction) {
      return res.status(400).json({ message: 'All declaration statements must be confirmed' });
    }

    const profile = await LawyerProfile.findOne({ userId: req.user?._id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    profile.declaration = {
      informationAccurate: true,
      qualifiedToPractise: true,
      noDisciplinaryAction: true,
      declaredAt: new Date(),
    };
    await profile.save();

    res.json({ message: 'Declaration submitted successfully', declaration: profile.declaration });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Upload profile photo
// @route   POST /api/lawyers/upload-photo
const uploadPhoto = async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file as any;
    if (!file) {
      return res.status(400).json({ message: "No photo uploaded" });
    }

    const photoUrl = file.path;

    const profile = await LawyerProfile.findOne({ userId: req.user?._id });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    profile.photo = photoUrl;
    await profile.save();

    res.json({ message: "Photo uploaded successfully", photo: photoUrl });
  } catch (error) {
    res.status(500).json({ message: "Upload failed", error: (error as Error).message });
  }
};

export { getLawyers, getLawyerById, updateProfile, submitVerification, getLawyersList, uploadVerificationDocs, acceptOnboardingAgreement, submitDeclaration, uploadPhoto };
