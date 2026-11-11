import mongoose, { Document, Schema } from 'mongoose';

export type MembershipTier = 'basic' | 'premium';
export type BillingInterval = 'month' | 'year';

export interface IMembershipPlan extends Document {
  key: string;
  name: string;
  tier: MembershipTier;
  description: string;
  isActive: boolean;
  currency: string;
  individualPrices: Array<{ interval: BillingInterval; amount: number }>;
  firmPrices: Array<{ interval: BillingInterval; amount: number; includedSeats: number; additionalSeatAmount: number }>;
  benefits: {
    directoryListing: boolean;
    receiveEnquiries: boolean;
    respondToEnquiries: boolean;
    appointmentManagement: boolean;
    analytics: boolean;
    increasedSearchVisibility: boolean;
    maxServices: number;
    maxSeats: number;
    maxProfilesPerSeat: number;
    enhancedEnquiryManagement: boolean;
  };
}

const membershipPlanSchema = new Schema<IMembershipPlan>(
  {
    key: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[a-z0-9-]+$/ },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    tier: { type: String, enum: ['basic', 'premium'], required: true },
    description: { type: String, default: '', maxlength: 1000 },
    isActive: { type: Boolean, default: true },
    currency: { type: String, default: 'NGN', uppercase: true, minlength: 3, maxlength: 3 },
    individualPrices: [{
      interval: { type: String, enum: ['month', 'year'], required: true },
      amount: { type: Number, required: true, min: 0 },
    }],
    firmPrices: [{
      interval: { type: String, enum: ['month', 'year'], required: true },
      amount: { type: Number, required: true, min: 0 },
      includedSeats: { type: Number, required: true, min: 1 },
      additionalSeatAmount: { type: Number, default: 0, min: 0 },
    }],
    benefits: {
      directoryListing: { type: Boolean, default: true },
      receiveEnquiries: { type: Boolean, default: true },
      respondToEnquiries: { type: Boolean, default: true },
      appointmentManagement: { type: Boolean, default: false },
      analytics: { type: Boolean, default: false },
      increasedSearchVisibility: { type: Boolean, default: false },
      maxServices: { type: Number, default: 1, min: -1 },
      maxSeats: { type: Number, default: 1, min: 1 },
      maxProfilesPerSeat: { type: Number, default: 3, min: 1 },
      enhancedEnquiryManagement: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export default mongoose.model<IMembershipPlan>('MembershipPlan', membershipPlanSchema);
