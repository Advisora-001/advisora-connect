import mongoose, { Document, Schema } from 'mongoose';

export interface ILawyerProfile extends Document {
  userId: mongoose.Types.ObjectId;
  barNumber?: string;
  stateOfCall?: string;
  yearOfCall?: number;
  practiceAreas?: string[];
  bio?: string;
  officeAddress?: string;
  city?: string;
  state?: string;
  languages?: string[];
  yearsOfExperience?: number;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  verificationBadge?: boolean;
  verificationDocs?: string[];
  subscription?: {
    plan?: 'basic' | 'professional' | 'premium';
    status?: 'active' | 'expired' | 'cancelled';
    startDate?: Date;
    endDate?: Date;
  };
  featuredListing?: {
    isActive?: boolean;
    startDate?: Date;
    endDate?: Date;
  };
  rating?: number;
  reviewCount?: number;
  consultationFee?: number;
  isAvailable?: boolean;
  availableDays?: string[];
  availableHours?: string;
  onboardingAgreementAccepted?: boolean;
  onboardingAgreementAcceptedAt?: Date;
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  declaration?: {
    informationAccurate: boolean;
    qualifiedToPractise: boolean;
    noDisciplinaryAction: boolean;
    declaredAt: Date;
  };
}

const lawyerProfileSchema = new Schema<ILawyerProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    barNumber: { type: String, default: '' },
    stateOfCall: { type: String, default: '' },
    yearOfCall: { type: Number, default: 0 },
    practiceAreas: [{ type: String, default: [] }],
    bio: { type: String, default: '' },
    officeAddress: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    languages: [{ type: String, default: [] }],
    yearsOfExperience: { type: Number, default: 0 },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    verificationBadge: { type: Boolean, default: false },
    verificationDocs: [{ type: String }],
    subscription: {
      plan: {
        type: String,
        enum: ['basic', 'professional', 'premium'],
        default: 'basic',
      },
      status: {
        type: String,
        enum: ['active', 'expired', 'cancelled'],
        default: 'expired',
      },
      startDate: Date,
      endDate: Date,
    },
    featuredListing: {
      isActive: { type: Boolean, default: false },
      startDate: Date,
      endDate: Date,
    },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    consultationFee: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
    availableDays: [{ type: String }],
    availableHours: { type: String, default: '9:00 AM - 5:00 PM' },
    onboardingAgreementAccepted: { type: Boolean, default: false },
    onboardingAgreementAcceptedAt: { type: Date },
    accountName: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    bankName: { type: String, default: "" },
    declaration: {
      informationAccurate: { type: Boolean, default: false },
      qualifiedToPractise: { type: Boolean, default: false },
      noDisciplinaryAction: { type: Boolean, default: false },
      declaredAt: { type: Date },
    },
  },
  { timestamps: true }
);

export default mongoose.model<ILawyerProfile>('LawyerProfile', lawyerProfileSchema);
