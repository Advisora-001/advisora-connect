import mongoose from 'mongoose';
import MembershipPlan from '../models/MembershipPlan';
import Subscription from '../models/Subscription';

const basicBenefits = {
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
};

const getMembershipBenefits = async (userId: mongoose.Types.ObjectId, firmId?: mongoose.Types.ObjectId) => {
  const activeFilter = { status: 'active', $or: [{ endDate: { $exists: false } }, { endDate: { $gt: new Date() } }] };
  const subscription = firmId
    ? await Subscription.findOne({ ...activeFilter, firmId }).sort({ createdAt: -1 })
    : await Subscription.findOne({ ...activeFilter, userId }).sort({ createdAt: -1 });
  if (subscription) {
    const snapshot = subscription.planSnapshot as { benefits?: typeof basicBenefits } | undefined;
    if (snapshot?.benefits) return snapshot.benefits;
  }

  const basicPlan = await MembershipPlan.findOne({ key: 'basic', isActive: true });
  return basicPlan?.benefits || basicBenefits;
};

export default getMembershipBenefits;
