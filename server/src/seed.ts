import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User';
import LawyerProfile from './models/LawyerProfile';
import ProfessionalCategory from './models/ProfessionalCategory';
import Plan from './models/Plan';

dotenv.config();

const seedCategories = async () => {
  const categories = [
    {
      key: 'legal',
      label: 'Legal Services',
      description: 'Legal professionals including lawyers, attorneys, and legal consultants.',
      isActive: true,
      specializations: [
        'Corporate Law',
        'Family Law',
        'Property Law',
        'Criminal Law',
        'Employment Law',
        'Intellectual Property',
        'Tax Law',
        'Immigration Law',
      ],
      registrationFields: [
        { name: 'barNumber', type: 'text', required: true },
        { name: 'stateOfCall', type: 'text', required: true },
        { name: 'yearOfCall', type: 'number', required: true },
        { name: 'practiceAreas', type: 'multiselect', required: true, options: ['Corporate Law', 'Family Law', 'Property Law', 'Criminal Law', 'Employment Law', 'Intellectual Property', 'Tax Law', 'Immigration Law'] },
        { name: 'yearsOfExperience', type: 'number', required: false },
      ],
      verificationRequirements: {
        requiredDocs: ['bar_certificate', 'government_id', 'professional_indemnity_insurance'],
        criteria: ['Active bar membership', 'Good standing with bar association', 'No disciplinary actions'],
      },
      serviceTypes: ['consultation', 'document_review', 'document_preparation', 'representation'],
      consultationModes: ['video', 'audio', 'in-person'],
    },
    {
      key: 'accounting',
      label: 'Accounting & Tax',
      description: 'Accounting professionals including CPAs, tax consultants, and auditors.',
      isActive: true,
      specializations: [
        'Tax Preparation',
        'Bookkeeping',
        'Audit & Assurance',
        'Financial Planning',
        'Corporate Accounting',
      ],
      registrationFields: [
        { name: 'licenseNumber', type: 'text', required: true },
        { name: 'certifyingBody', type: 'text', required: true },
        { name: 'yearsOfExperience', type: 'number', required: false },
      ],
      verificationRequirements: {
        requiredDocs: ['professional_license', 'government_id'],
        criteria: ['Active professional license', 'Good standing with certifying body'],
      },
      serviceTypes: ['tax_preparation', 'bookkeeping', 'audit', 'financial_consultation'],
      consultationModes: ['video', 'audio', 'in-person'],
    },
    {
      key: 'tax',
      label: 'Tax Consulting',
      description: 'Tax specialists including tax advisors and enrolled agents.',
      isActive: true,
      specializations: [
        'Personal Tax',
        'Business Tax',
        'International Tax',
        'VAT & Indirect Tax',
        'Tax Controversy',
      ],
      registrationFields: [
        { name: 'taxIdNumber', type: 'text', required: true },
        { name: 'certifyingBody', type: 'text', required: true },
        { name: 'yearsOfExperience', type: 'number', required: false },
      ],
      verificationRequirements: {
        requiredDocs: ['tax_certification', 'government_id'],
        criteria: ['Valid tax certification', 'Good standing with tax authority'],
      },
      serviceTypes: ['tax_filing', 'tax_planning', 'tax_representation'],
      consultationModes: ['video', 'audio'],
    },
  ];

  for (const cat of categories) {
    const existing = await ProfessionalCategory.findOne({ key: cat.key });
    if (!existing) {
      await ProfessionalCategory.create(cat);
      console.log(`✅ Category seeded: ${cat.label} (${cat.key})`);
    } else {
      console.log(`⏭️  Category already exists: ${cat.label} (${cat.key})`);
    }
  }
};

const seedPlans = async () => {
  const plans = [
    {
      key: 'basic',
      name: 'Basic',
      description: 'Free plan for individual professionals. Includes listing, search visibility, ordinary enquiries, and basic dashboard.',
      isActive: true,
      isFree: true,
      billingInterval: 'monthly',
      price: { amount: 0, currency: 'NGN' },
      entitlements: {
        listing: true,
        searchVisibility: true,
        enhancedPlacement: false,
        appointmentManagement: false,
        analytics: false,
        enquiryManagement: true,
      },
      limits: { maxProfiles: 1, maxServices: 3, maxEnquiriesPerMonth: 50 },
      firmPrice: { amount: 0, currency: 'NGN' },
      includedSeats: 1,
      additionalSeatPrice: { amount: 0, currency: 'NGN' },
    },
    {
      key: 'premium',
      name: 'Premium',
      description: 'Premium plan with enhanced features. Not purchasable until configured and activated by an administrator.',
      isActive: false,
      isFree: false,
      billingInterval: 'monthly',
      price: { amount: 0, currency: 'NGN' },
      entitlements: {
        listing: true,
        searchVisibility: true,
        enhancedPlacement: true,
        appointmentManagement: true,
        analytics: true,
        enquiryManagement: true,
      },
      limits: { maxProfiles: 1, maxServices: 10, maxEnquiriesPerMonth: 200 },
      firmPrice: { amount: 0, currency: 'NGN' },
      includedSeats: 3,
      additionalSeatPrice: { amount: 0, currency: 'NGN' },
    },
  ];

  for (const plan of plans) {
    const existing = await Plan.findOne({ key: plan.key });
    if (!existing) {
      await Plan.create(plan);
      console.log(`✅ Plan seeded: ${plan.name} (${plan.key})`);
    } else {
      console.log(`⏭️  Plan already exists: ${plan.name} (${plan.key})`);
    }
  }
};

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('MongoDB connected for seeding...');

    await seedCategories();
    await seedPlans();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@advisora.com' });
    if (existingAdmin) {
      console.log('Admin user already exists. Skipping...');
    } else {
      // Create admin user
      const admin = await User.create({
        email: 'admin@advisora.com',
        password: 'Admin123!',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isVerified: true,
        isActive: true,
      });
      console.log(`✅ Admin created: admin@advisora.com / Admin123!`);
    }

    // Check if test lawyer exists
    const existingLawyer = await User.findOne({ email: 'lawyer@test.com' });
    if (existingLawyer) {
      console.log('Test lawyer already exists. Skipping...');
    } else {
      const lawyer = await User.create({
        email: 'lawyer@test.com',
        password: 'Lawyer123!',
        firstName: 'Test',
        lastName: 'Lawyer',
        phone: '08012345678',
        role: 'lawyer',
        isVerified: true,
        isActive: true,
      });

      await LawyerProfile.create({
        userId: lawyer._id,
        barNumber: 'BN2025/001',
        stateOfCall: 'Lagos',
        yearOfCall: 2018,
        practiceAreas: ['Corporate Law', 'Family Law', 'Property Law'],
        bio: 'Experienced corporate lawyer with over 7 years of practice. Specializing in business law, mergers, and property transactions.',
        officeAddress: '23 Adeola Odeku Street, Victoria Island',
        city: 'Lagos',
        state: 'Lagos',
        languages: ['English', 'Yoruba'],
        yearsOfExperience: 7,
        verificationStatus: 'verified',
        verificationBadge: true,
        subscription: { plan: 'premium', status: 'active', startDate: new Date(), endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        consultationFee: 25000,
        isAvailable: true,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        availableHours: '9:00 AM - 5:00 PM',
        rating: 4.5,
        reviewCount: 12,
      });
      console.log(`✅ Test lawyer created: lawyer@test.com / Lawyer123!`);
    }

    // Check if test client exists
    const existingClient = await User.findOne({ email: 'client@test.com' });
    if (existingClient) {
      console.log('Test client already exists. Skipping...');
    } else {
      await User.create({
        email: 'client@test.com',
        password: 'Client123!',
        firstName: 'Test',
        lastName: 'Client',
        phone: '08098765432',
        role: 'client',
        isVerified: true,
        isActive: true,
      });
      console.log(`✅ Test client created: client@test.com / Client123!`);
    }

    console.log('\n--- Seeding Complete ---');
    console.log('Admin:   admin@advisora.com / Admin123!');
    console.log('Lawyer:  lawyer@test.com   / Lawyer123!');
    console.log('Client:  client@test.com   / Client123!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seed();