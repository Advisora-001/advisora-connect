import LawyerProfile from '../models/LawyerProfile';
import ProfessionalProfile from '../models/ProfessionalProfile';

const syncLegacyLawyerProfile = async (
  lawyer: InstanceType<typeof LawyerProfile>,
  preserveExisting = false,
) => {
  const verificationDocs = lawyer.verificationDocs || [];
  const profileFields = {
    professionalTitle: 'Legal professional',
    bio: lawyer.bio || '',
    qualifications: lawyer.barNumber ? [`SCN: ${lawyer.barNumber}`] : [],
    professionalBody: 'Nigerian Bar Association',
    membershipNumber: lawyer.barNumber || '',
    specializations: lawyer.practiceAreas || [],
    services: (lawyer.services || []).map((service) => service.name).filter(Boolean),
    yearsOfExperience: lawyer.yearsOfExperience || 0,
    city: lawyer.city || '',
    state: lawyer.state || '',
    country: 'Nigeria',
    publicDetails: {
      stateOfCall: lawyer.stateOfCall || '',
      yearOfCall: lawyer.yearOfCall || 0,
      officeAddress: lawyer.officeAddress || '',
      languages: lawyer.languages || [],
      consultationFee: lawyer.consultationFee || 0,
      rating: lawyer.rating || 0,
      reviewCount: lawyer.reviewCount || 0,
      availableDays: lawyer.availableDays || [],
      availableHours: lawyer.availableHours || '',
      services: lawyer.services || [],
    },
    verificationDocs,
    verificationUploads: verificationDocs.map((url) => ({ requirementKey: 'practising-credential', url })),
    verificationStatus: lawyer.verificationStatus || 'pending',
    isAvailable: lawyer.isAvailable !== false,
    customFields: { professionalBody: 'Nigerian Bar Association' },
  };

  const profile = await ProfessionalProfile.findOne({ userId: lawyer.userId, category: 'legal' });
  if (!profile) {
    await ProfessionalProfile.create({
      ...profileFields,
      userId: lawyer.userId,
      category: 'legal',
    });
    return;
  }

  if (preserveExisting) {
    for (const [field, value] of Object.entries(profileFields)) {
      const currentValue = profile.get(field);
      const isEmpty = Array.isArray(currentValue)
        ? currentValue.length === 0
        : currentValue instanceof Map
          ? currentValue.size === 0
        : typeof currentValue === 'string'
          ? currentValue.trim().length === 0
          : currentValue === undefined || currentValue === null;
      const hasMigratedValue = Array.isArray(value) ? value.length > 0 : value !== '';
      if (isEmpty && hasMigratedValue) profile.set(field, value);
    }
    if (profile.verificationStatus === 'draft') {
      profile.verificationStatus = lawyer.verificationStatus || 'pending';
    }
  } else {
    for (const [field, value] of Object.entries(profileFields)) {
      profile.set(field, value);
    }
  }
  await profile.save();
};

export default syncLegacyLawyerProfile;
