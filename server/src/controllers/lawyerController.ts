import { Request, Response } from 'express';
import LawyerProfile from '../models/LawyerProfile';
import User from '../models/User';
import Appointment from '../models/Appointment';
import Wallet from '../models/Wallet';
import ProfessionalCategory from '../models/ProfessionalCategory';
import ProfessionalProfile from '../models/ProfessionalProfile';
import { AuthRequest } from '../middleware/auth';

// @desc    Get all lawyers (with search & filters)
// @route   GET /api/lawyers
const getLawyers = async (req: Request, res: Response) => {
  try {
    const { practiceArea, location, state, experience, name, isAvailable } = req.query;

    // Build LawyerProfile query
    const lawyerQuery: any = { verificationStatus: 'verified' };

    if (practiceArea) {
      lawyerQuery.practiceAreas = { $in: [practiceArea as string] };
    }
    if (location) {
      lawyerQuery.city = { $regex: location as string, $options: 'i' };
    }
    if (state) {
      lawyerQuery.state = state as string;
    }
    if (isAvailable === 'true') {
      lawyerQuery.isAvailable = true;
    }
    if (experience) {
      lawyerQuery.yearsOfExperience = { $gte: parseInt(experience as string) };
    }

    // Build ProfessionalProfile query (category=legal, canonical listing)
    const legalCategory = await ProfessionalCategory.findOne({ key: 'legal', isActive: true });
    const profQuery: any = { verificationStatus: 'verified' };
    if (legalCategory) profQuery.category = legalCategory._id;

    // Apply same filters to ProfessionalProfile
    if (location) {
      profQuery.city = { $regex: location as string, $options: 'i' };
    }
    if (state) {
      profQuery.state = state as string;
    }
    if (isAvailable === 'true') {
      profQuery.isAvailable = true;
    }
    if (experience) {
      profQuery.yearsOfExperience = { $gte: parseInt(experience as string) };
    }

    // Fetch both sources
    const [lawyerProfiles, professionalProfiles] = await Promise.all([
      LawyerProfile.find(lawyerQuery)
        .populate('userId', 'firstName lastName email avatar')
        .sort({ 'featuredListing.isActive': -1, rating: -1 })
        .limit(50),
      ProfessionalProfile.find(profQuery)
        .populate('userId', 'firstName lastName email avatar')
        .populate('category', 'key label')
        .sort({ rating: -1 })
        .limit(50),
    ]);

    // Build a set of userIds that have ProfessionalProfile (canonical)
    const profUserIds = new Set(professionalProfiles.map((p: any) => p.userId?._id?.toString() || p.userId?.toString()));

    // Filter LawyerProfiles to exclude those already represented by ProfessionalProfile
    const uniqueLawyers = lawyerProfiles.filter((l: any) => {
      const uid = l.userId?._id?.toString() || l.userId?.toString();
      return !profUserIds.has(uid);
    });

    // Transform ProfessionalProfiles to lawyer directory format
    const transformedPros = professionalProfiles.map((p: any) => {
      const categoryData = p.categoryData || {};
      return {
        _id: p._id,
        userId: p.userId,
        photo: p.photo || '',
        otherNames: categoryData.otherNames || '',
        barNumber: categoryData.barNumber || '',
        stateOfCall: categoryData.stateOfCall || '',
        yearOfCall: categoryData.yearOfCall || 0,
        practiceAreas: categoryData.practiceAreas || (p.specialization ? [p.specialization] : []),
        bio: p.bio || '',
        officeAddress: p.officeAddress || '',
        city: p.city || '',
        state: p.state || '',
        languages: p.languages || [],
        yearsOfExperience: p.yearsOfExperience || 0,
        verificationStatus: p.verificationStatus,
        verificationBadge: p.verificationBadge,
        verificationDocs: p.verificationDocs || [],
        rating: p.rating || 0,
        reviewCount: p.reviewCount || 0,
        consultationFee: categoryData.consultationFee || 0,
        isAvailable: p.isAvailable,
        availableDays: p.availableDays || [],
        availableHours: p.availableHours || '9:00 AM - 5:00 PM',
        availableFrom: p.availableFrom || '9:00 AM',
        availableTo: p.availableTo || '5:00 PM',
        onboardingAgreementAccepted: p.onboardingAgreementAccepted,
        onboardingAgreementAcceptedAt: p.onboardingAgreementAcceptedAt,
        accountName: p.accountName || '',
        accountNumber: p.accountNumber || '',
        bankName: p.bankName || '',
        phone: p.phone || '',
        services: p.services || [],
        requireApproval: p.requireApproval,
        declaration: p.declaration,
        legacyLawyerProfileId: p.legacyLawyerProfileId,
        categoryData: p.categoryData,
        source: 'professional',
        featuredListing: { isActive: false }, // ProfessionalProfile doesn't have featured listing yet
      };
    });

    // Transform LawyerProfiles to include source flag
    const transformedLawyers = uniqueLawyers.map((l: any) => {
      const obj = l.toObject ? l.toObject() : l;
      return { ...obj, source: 'legacy' };
    });

    // Merge and sort
    let allLawyers = [...transformedPros, ...transformedLawyers];

    // If name search, filter by name
    if (name) {
      const nameStr = (name as string).toLowerCase();
      allLawyers = allLawyers.filter((l: any) => {
        const fullName = `${l.userId?.firstName || ''} ${l.userId?.lastName || ''}`.toLowerCase();
        return fullName.includes(nameStr);
      });
    }

    // Sort: featured first (legacy), then by rating
    allLawyers.sort((a: any, b: any) => {
      const aFeatured = a.featuredListing?.isActive ? 1 : 0;
      const bFeatured = b.featuredListing?.isActive ? 1 : 0;
      if (bFeatured !== aFeatured) return bFeatured - aFeatured;
      return (b.rating || 0) - (a.rating || 0);
    });

    res.json({ count: allLawyers.length, lawyers: allLawyers });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
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

    // First try ProfessionalProfile (canonical listing)
    let professional = await ProfessionalProfile.findById(req.params.id)
      .populate('userId', 'firstName lastName email avatar phone')
      .populate('category', 'key label specializations');

    if (professional) {
      const categoryData = professional.categoryData || {};
      return res.json({
        _id: professional._id,
        userId: professional.userId,
        photo: professional.photo || '',
        otherNames: categoryData.otherNames || '',
        barNumber: categoryData.barNumber || '',
        stateOfCall: categoryData.stateOfCall || '',
        yearOfCall: categoryData.yearOfCall || 0,
        practiceAreas: categoryData.practiceAreas || (professional.specialization ? [professional.specialization] : []),
        bio: professional.bio || '',
        officeAddress: professional.officeAddress || '',
        city: professional.city || '',
        state: professional.state || '',
        languages: professional.languages || [],
        yearsOfExperience: professional.yearsOfExperience || 0,
        verificationStatus: professional.verificationStatus,
        verificationBadge: professional.verificationBadge,
        verificationDocs: professional.verificationDocs || [],
        rating: professional.rating || 0,
        reviewCount: professional.reviewCount || 0,
        consultationFee: categoryData.consultationFee || 0,
        isAvailable: professional.isAvailable,
        availableDays: professional.availableDays || [],
        availableHours: professional.availableHours || '9:00 AM - 5:00 PM',
        availableFrom: professional.availableFrom || '9:00 AM',
        availableTo: professional.availableTo || '5:00 PM',
        onboardingAgreementAccepted: professional.onboardingAgreementAccepted,
        onboardingAgreementAcceptedAt: professional.onboardingAgreementAcceptedAt,
        accountName: professional.accountName || '',
        accountNumber: professional.accountNumber || '',
        bankName: professional.bankName || '',
        phone: professional.phone || '',
        services: professional.services || [],
        requireApproval: professional.requireApproval,
        declaration: professional.declaration,
        legacyLawyerProfileId: professional.legacyLawyerProfileId,
        categoryData: professional.categoryData,
        source: 'professional',
        featuredListing: { isActive: false },
        category: professional.category,
      });
    }

    // Fall back to legacy LawyerProfile
    const lawyer = await LawyerProfile.findById(req.params.id)
      .populate('userId', 'firstName lastName email avatar phone');

    if (!lawyer) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }

    res.json(lawyer);
  } catch (error: any) {
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
      'consultationFee', 'isAvailable', 'availableDays', 'availableHours', 'availableFrom', 'availableTo', 'accountName', 'accountNumber', 'bankName', 'otherNames',
      'services', 'requireApproval', 'phone'
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

// @desc    Get lawyer availability for a given date
// @route   GET /api/lawyers/:id/availability?date=YYYY-MM-DD
const getAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date || typeof date !== 'string') {
      return res.status(400).json({ message: 'Date query parameter (YYYY-MM-DD) is required' });
    }

    const lawyer = await LawyerProfile.findById(id);
    if (!lawyer) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }

    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.toLocaleDateString('en-US', { weekday: 'long' });

    // Check if lawyer is available on this day
    if (!lawyer.availableDays?.includes(dayOfWeek)) {
      return res.json({ available: false, slots: [], reason: 'Lawyer not available on this day' });
    }

    // Parse available hours
    const availableFrom = lawyer.availableHours?.split('-')[0]?.trim() || '9:00 AM';
    const availableTo = lawyer.availableHours?.split('-')[1]?.trim() || '5:00 PM';

    // Generate time slots (30-min intervals)
    const slots = generateTimeSlots(availableFrom, availableTo, 30);

    // Get existing appointments for this lawyer on this date
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await Appointment.find({
      lawyerId: id,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' },
    });

    // Filter out booked slots
    const bookedSlots = existingAppointments.map(a => a.timeSlot);
    const availableSlots = slots.filter(slot => !bookedSlots.includes(slot));

    res.json({
      available: availableSlots.length > 0,
      date,
      dayOfWeek,
      slots: availableSlots,
      timezone: 'Africa/Lagos',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// Helper: generate time slots
function generateTimeSlots(from: string, to: string, intervalMinutes: number): string[] {
  const slots: string[] = [];
  const parseTime = (t: string): number => {
    const [time, period] = t.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period?.toUpperCase() === 'PM' && hours !== 12) hours += 12;
    if (period?.toUpperCase() === 'AM' && hours === 12) hours = 0;
    return hours * 60 + (minutes || 0);
  };

  const startMin = parseTime(from);
  const endMin = parseTime(to);

  for (let m = startMin; m + intervalMinutes <= endMin; m += intervalMinutes) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const displayM = min.toString().padStart(2, '0');
    slots.push(`${displayH}:${displayM} ${period}`);
  }

  return slots;
}

// @desc    Get lawyer wallet
// @route   GET /api/lawyers/wallet
const getWallet = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await LawyerProfile.findOne({ userId: req.user?._id });
    if (!profile) {
      return res.status(404).json({ message: 'Lawyer profile not found' });
    }

    let wallet = await Wallet.findOne({ lawyerId: profile._id });
    if (!wallet) {
      wallet = new Wallet({ lawyerId: profile._id, balance: 0, totalEarned: 0, pendingBalance: 0 });
      await wallet.save();
    }

    res.json({ wallet });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Request a payout
// @route   POST /api/lawyers/wallet/payout-request
const requestPayout = async (req: AuthRequest, res: Response) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid payout amount is required' });
    }

    const profile = await LawyerProfile.findOne({ userId: req.user?._id });
    if (!profile) {
      return res.status(404).json({ message: 'Lawyer profile not found' });
    }

    if (!profile.accountNumber || !profile.bankName || !profile.accountName) {
      return res.status(400).json({ message: 'Please complete your payout details (bank info) before requesting a payout.' });
    }

    const wallet = await Wallet.findOne({ lawyerId: profile._id });
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Create payout request
    const PayoutRequest = await import('../models/PayoutRequest').then(m => m.default);
    const request = await PayoutRequest.create({
      lawyerId: profile._id,
      walletId: wallet._id,
      amount,
      bankName: profile.bankName,
      accountNumber: profile.accountNumber,
      accountName: profile.accountName,
      status: 'pending',
    });

    wallet.balance -= amount;
    wallet.pendingBalance += amount;
    wallet.transactions.push({
      type: 'payout',
      amount,
      description: 'Payout requested',
      payoutRequestId: request._id,
    });
    await wallet.save();

    res.status(201).json({ message: 'Payout request submitted', request, wallet });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export { getLawyers, getLawyerById, updateProfile, submitVerification, getLawyersList, uploadVerificationDocs, acceptOnboardingAgreement, submitDeclaration, uploadPhoto, getAvailability, getWallet, requestPayout };
