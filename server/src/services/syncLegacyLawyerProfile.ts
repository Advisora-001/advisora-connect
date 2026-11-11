import LawyerProfile from '../models/LawyerProfile';
import ProfessionalProfile from '../models/ProfessionalProfile';

const syncLegacyLawyerProfile = async (
  lawyer: InstanceType<typeof LawyerProfile>,
  insertOnly = false,
) => {
  const verificationDocs = lawyer.verificationDocs || [];
  const profileFields = {
    professionalTitle: 'Legal professional',
    bio: lawyer.bio || '',
    professionalBody: 'Nigerian Bar Association',
    membershipNumber: lawyer.barNumber || '',
    specializations: lawyer.practiceAreas || [],
    services: (lawyer.services || []).map((service) => service.name).filter(Boolean),
    yearsOfExperience: lawyer.yearsOfExperience || 0,
    city: lawyer.city || '',
    state: lawyer.state || '',
    country: 'Nigeria',
    verificationDocs,
    verificationUploads: verificationDocs.map((url) => ({ requirementKey: 'practising-credential', url })),
    verificationStatus: lawyer.verificationStatus || 'pending',
    isAvailable: lawyer.isAvailable !== false,
    customFields: { professionalBody: 'Nigerian Bar Association' },
  };
  await ProfessionalProfile.updateOne(
    { userId: lawyer.userId, category: 'legal' },
    insertOnly
      ? { $setOnInsert: { ...profileFields, userId: lawyer.userId, category: 'legal' } }
      : { $set: profileFields, $setOnInsert: { userId: lawyer.userId, category: 'legal' } },
    { upsert: true, runValidators: true },
  );
};

export default syncLegacyLawyerProfile;
