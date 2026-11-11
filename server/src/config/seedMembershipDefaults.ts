import ProfessionalCategory from '../models/ProfessionalCategory';
import MembershipPlan from '../models/MembershipPlan';
import PlatformFeePolicy from '../models/PlatformFeePolicy';

const defaultCategories = [
  {
    key: 'legal',
    label: 'Legal professional',
    pluralLabel: 'Legal professionals',
    description: 'Lawyers and other qualified legal practitioners.',
    registrationFields: [{ key: 'professionalBody', label: 'Professional body', required: true, type: 'text', options: [] }],
    verificationRequirements: [{ key: 'practising-credential', label: 'Current practising credential', required: true, acceptedDocumentTypes: ['pdf', 'jpg', 'png'] }],
    specializations: ['Corporate & Commercial Law', 'Family Law', 'Litigation', 'Employment & Labour Law', 'Tax Law'],
    serviceTypes: ['Legal advice', 'Representation', 'Contract review', 'Fractional counsel'],
    consultationOptions: ['video', 'audio', 'in-person'],
  },
  {
    key: 'accounting',
    label: 'Accountant',
    pluralLabel: 'Accountants',
    description: 'Qualified accounting and financial reporting professionals.',
    registrationFields: [{ key: 'professionalBody', label: 'Professional body', required: true, type: 'text', options: [] }],
    verificationRequirements: [{ key: 'membership-credential', label: 'Professional membership credential', required: true, acceptedDocumentTypes: ['pdf', 'jpg', 'png'] }],
    specializations: ['Audit', 'Tax accounting', 'Management accounting', 'Bookkeeping'],
    serviceTypes: ['Accounting', 'Audit', 'Financial reporting', 'Bookkeeping'],
    consultationOptions: ['video', 'audio', 'in-person'],
  },
  {
    key: 'tax',
    label: 'Tax consultant',
    pluralLabel: 'Tax consultants',
    description: 'Tax compliance, planning, and advisory professionals.',
    registrationFields: [{ key: 'professionalBody', label: 'Professional body', required: false, type: 'text', options: [] }],
    verificationRequirements: [{ key: 'qualification-credential', label: 'Tax qualification or professional credential', required: true, acceptedDocumentTypes: ['pdf', 'jpg', 'png'] }],
    specializations: ['Personal tax', 'Corporate tax', 'Tax compliance', 'Tax planning'],
    serviceTypes: ['Tax preparation', 'Tax advisory', 'Tax compliance'],
    consultationOptions: ['video', 'audio', 'in-person'],
  },
];

const seedMembershipDefaults = async () => {
  for (const category of defaultCategories) {
    await ProfessionalCategory.updateOne(
      { key: category.key },
      { $setOnInsert: category },
      { upsert: true }
    );
  }

  await MembershipPlan.updateOne(
    { key: 'basic' },
    {
      $setOnInsert: {
        key: 'basic',
        name: 'Basic Membership',
        tier: 'basic',
        description: 'Free professional profile, directory listing, ordinary enquiries, and basic dashboard access.',
        isActive: true,
        currency: 'NGN',
        individualPrices: [{ interval: 'month', amount: 0 }, { interval: 'year', amount: 0 }],
        firmPrices: [{ interval: 'month', amount: 0, includedSeats: 1, additionalSeatAmount: 0 }, { interval: 'year', amount: 0, includedSeats: 1, additionalSeatAmount: 0 }],
        benefits: {
          directoryListing: true,
          receiveEnquiries: true,
          respondToEnquiries: true,
          appointmentManagement: false,
          analytics: false,
          increasedSearchVisibility: false,
          maxServices: 1,
          maxSeats: 1,
          maxProfilesPerSeat: 3,
          enhancedEnquiryManagement: false,
        },
      },
    },
    { upsert: true }
  );

  await MembershipPlan.updateOne(
    { key: 'premium' },
    {
      $setOnInsert: {
        key: 'premium',
        name: 'Premium Membership',
        tier: 'premium',
        description: 'Paid membership with enhanced profile and practice management benefits.',
        isActive: false,
        currency: 'NGN',
        individualPrices: [],
        firmPrices: [],
        benefits: {
          directoryListing: true,
          receiveEnquiries: true,
          respondToEnquiries: true,
          appointmentManagement: true,
          analytics: true,
          increasedSearchVisibility: true,
          maxServices: 20,
          maxSeats: 1,
          maxProfilesPerSeat: 3,
          enhancedEnquiryManagement: true,
        },
      },
    },
    { upsert: true }
  );

  await PlatformFeePolicy.updateOne(
    { key: 'default' },
    {
      $setOnInsert: {
        key: 'default',
        isActive: true,
        type: 'fixed',
        amount: Number(process.env.PLATFORM_FEE_AMOUNT) || 10000,
        currency: 'NGN',
        appliesTo: ['consultation', 'lead', 'service'],
      },
    },
    { upsert: true }
  );
};

export default seedMembershipDefaults;
