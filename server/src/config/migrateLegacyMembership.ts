import LawyerProfile from '../models/LawyerProfile';
import MembershipPlan from '../models/MembershipPlan';
import Subscription from '../models/Subscription';
import User from '../models/User';
import syncLegacyLawyerProfile from '../services/syncLegacyLawyerProfile';

const migrateLegacyMembership = async () => {
  const [lawyers, basicPlan, premiumPlan] = await Promise.all([
    LawyerProfile.find(),
    MembershipPlan.findOne({ key: 'basic' }),
    MembershipPlan.findOne({ key: 'premium' }),
  ]);
  if (!basicPlan) throw new Error('Basic membership plan must be seeded before legacy membership migration.');

  for (const lawyer of lawyers) {
    await syncLegacyLawyerProfile(lawyer, true);

    if (lawyer.photo) {
      await User.updateOne(
        { _id: lawyer.userId, $or: [{ avatar: { $exists: false } }, { avatar: '' }] },
        { $set: { avatar: lawyer.photo } },
      );
    }

    const existingSubscription = await Subscription.exists({ userId: lawyer.userId, status: 'active' });
    if (existingSubscription) continue;

    const legacySubscription = lawyer.subscription;
    const legacyPaidSubscriptionIsActive = Boolean(
      legacySubscription &&
      legacySubscription.plan !== 'basic' &&
      legacySubscription.status === 'active' &&
      (!legacySubscription.endDate || legacySubscription.endDate > new Date()),
    );
    const tier = legacyPaidSubscriptionIsActive ? 'premium' : 'basic';
    const plan = tier === 'basic' ? basicPlan : premiumPlan;
    const startDate = legacyPaidSubscriptionIsActive && legacySubscription?.startDate
      ? legacySubscription.startDate
      : new Date();
    await Subscription.create({
      ownerType: 'individual',
      userId: lawyer.userId,
      plan: tier,
      planKey: tier,
      tier,
      planSnapshot: plan?.toObject() || {},
      billingInterval: 'month',
      status: 'active',
      startDate,
      endDate: legacyPaidSubscriptionIsActive ? legacySubscription?.endDate : undefined,
      amount: 0,
      autoRenew: false,
    });
  }
};

export default migrateLegacyMembership;
