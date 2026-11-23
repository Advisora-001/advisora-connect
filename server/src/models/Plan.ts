import mongoose, { Document, Schema } from 'mongoose';

export interface IPlan extends Document {
  key: string;
  name: string;
  description?: string;
  isActive: boolean;
  isFree: boolean;
  billingInterval: 'monthly' | 'yearly';
  price: {
    amount: number;
    currency: string;
  };
  entitlements: {
    listing: boolean;
    searchVisibility: boolean;
    enhancedPlacement: boolean;
    appointmentManagement: boolean;
    analytics: boolean;
    enquiryManagement: boolean;
  };
  limits: {
    maxProfiles: number;
    maxServices: number;
    maxEnquiriesPerMonth: number;
  };
  firmPrice: {
    amount: number;
    currency: string;
  };
  includedSeats: number;
  additionalSeatPrice: {
    amount: number;
    currency: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const planSchema = new Schema<IPlan>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    isFree: { type: Boolean, default: false },
    billingInterval: {
      type: String,
      enum: ['monthly', 'yearly'],
      required: true,
    },
    price: {
      amount: { type: Number, required: true, default: 0 },
      currency: { type: String, default: 'NGN' },
    },
    entitlements: {
      listing: { type: Boolean, default: true },
      searchVisibility: { type: Boolean, default: true },
      enhancedPlacement: { type: Boolean, default: false },
      appointmentManagement: { type: Boolean, default: false },
      analytics: { type: Boolean, default: false },
      enquiryManagement: { type: Boolean, default: true },
    },
    limits: {
      maxProfiles: { type: Number, default: 1 },
      maxServices: { type: Number, default: 3 },
      maxEnquiriesPerMonth: { type: Number, default: 50 },
    },
    firmPrice: {
      amount: { type: Number, required: true, default: 0 },
      currency: { type: String, default: 'NGN' },
    },
    includedSeats: { type: Number, default: 1 },
    additionalSeatPrice: {
      amount: { type: Number, default: 0 },
      currency: { type: String, default: 'NGN' },
    },
    // Paystack integration
    paystackPlanCodeMonthly: { type: String, trim: true },
    paystackPlanCodeYearly: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model<IPlan>('Plan', planSchema);