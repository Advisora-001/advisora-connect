import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import LawyerProfile from '../models/LawyerProfile';
import ProfessionalCategory from '../models/ProfessionalCategory';
import ProfessionalProfile from '../models/ProfessionalProfile';

dotenv.config();

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('MongoDB connected for migration...');

    const legalCategory = await ProfessionalCategory.findOne({ key: 'legal', isActive: true });
    if (!legalCategory) {
      console.error('❌ Legal category not found. Please run seed first.');
      process.exit(1);
    }

    const lawyerProfiles = await LawyerProfile.find({}).populate('userId');
    console.log(`📋 Found ${lawyerProfiles.length} LawyerProfile(s) to migrate`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const lp of lawyerProfiles) {
      try {
        const existing = await ProfessionalProfile.findOne({ userId: lp.userId });
        if (existing) {
          if (!existing.legacyLawyerProfileId) {
            existing.legacyLawyerProfileId = lp._id;
            await existing.save();
          }
          skipped++;
          continue;
        }

        const professionalProfile = await ProfessionalProfile.create({
          userId: lp.userId,
          category: legalCategory._id,
          specialization: lp.practiceAreas?.[0] || '',
          photo: lp.photo || '',
          bio: lp.bio || '',
          officeAddress: lp.officeAddress || '',
          city: lp.city || '',
          state: lp.state || '',
          languages: lp.languages || [],
          yearsOfExperience: lp.yearsOfExperience || 0,
          verificationStatus: lp.verificationStatus || 'pending',
          verificationBadge: lp.verificationBadge || false,
          verificationDocs: lp.verificationDocs || [],
          rating: lp.rating || 0,
          reviewCount: lp.reviewCount || 0,
          isAvailable: lp.isAvailable !== false,
          availableDays: lp.availableDays || [],
          availableHours: lp.availableHours || '9:00 AM - 5:00 PM',
          availableFrom: lp.availableFrom || '9:00 AM',
          availableTo: lp.availableTo || '5:00 PM',
          onboardingAgreementAccepted: lp.onboardingAgreementAccepted || false,
          onboardingAgreementAcceptedAt: lp.onboardingAgreementAcceptedAt,
          accountName: lp.accountName || '',
          accountNumber: lp.accountNumber || '',
          bankName: lp.bankName || '',
          phone: lp.phone || '',
          services: lp.services || [],
          requireApproval: lp.requireApproval !== false,
          declaration: lp.declaration,
          legacyLawyerProfileId: lp._id,
        });

        console.log(`✅ Migrated: ${(lp.userId as any)?.firstName} ${(lp.userId as any)?.lastName} (${(lp.userId as any)?.email})`);
        migrated++;
      } catch (err: any) {
        console.error(`❌ Error migrating ${lp.userId?._id}: ${err.message}`);
        errors++;
      }
    }

    console.log('\n--- Migration Complete ---');
    console.log(`Migrated: ${migrated}`);
    console.log(`Skipped (already exist): ${skipped}`);
    console.log(`Errors: ${errors}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migrate();