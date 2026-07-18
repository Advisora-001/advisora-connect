import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User';
import LawyerProfile from './models/LawyerProfile';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('MongoDB connected for seeding...');

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