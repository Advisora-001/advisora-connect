import mongoose, { Document, Schema } from 'mongoose';

export interface IProfessionalProfile extends Document {
  userId: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
  specialization?: string;
  photo?: string;
  bio?: string;
  officeAddress?: string;
  city?: string;
  state?: string;
  languages?: string[];
  yearsOfExperience?: number;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  verificationBadge?: boolean;
  verificationDocs?: string[];
  rating?: number;
  reviewCount?: number;
  isAvailable?: boolean;
  availableDays?: string[];
  availableHours?: string;
  availableFrom?: string;
  availableTo?: string;
  onboardingAgreementAccepted?: boolean;
  onboardingAgreementAcceptedAt?: Date;
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  phone?: string;
  services?: {
    name: string;
    duration: number;
    price: number;
    type: 'video' | 'audio' | 'in-person';
  }[];
  requireApproval?: boolean;
  declaration?: {
    informationAccurate: boolean;
    qualifiedToPractise: boolean;
    noDisciplinaryAction: boolean;
    declaredAt: Date;
  };
  legacyLawyerProfileId?: mongoose.Types.ObjectId;
  categoryData?: Record<string, any>;

  // Fractional GC fields
  fractionalGC?: {
    isAvailable: boolean;
    monthlyRetainerMin: number;
    monthlyRetainerMax: number;
    hoursPerMonth: number;
    industries: string[];
    companyStages: string[];
    engagementTypes: string[];
    scopeOfWork: string[];
    minimumEngagementMonths: number;
    autoRenew: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const professionalProfileSchema = new Schema<IProfessionalProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'ProfessionalCategory',
      required: true,
      index: true,
    },
    specialization: { type: String, default: '' },
    photo: { type: String, default: '' },
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
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
    availableDays: [{ type: String }],
    availableHours: { type: String, default: '9:00 AM - 5:00 PM' },
    availableFrom: { type: String, default: '9:00 AM' },
    availableTo: { type: String, default: '5:00 PM' },
    onboardingAgreementAccepted: { type: Boolean, default: false },
    onboardingAgreementAcceptedAt: { type: Date },
    accountName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    bankName: { type: String, default: '' },
    phone: { type: String, default: '' },
    services: [
      {
        name: { type: String },
        duration: { type: Number },
        price: { type: Number },
        type: { type: String, enum: ['video', 'audio', 'in-person'], default: 'video' },
      },
    ],
    requireApproval: { type: Boolean, default: true },
    declaration: {
      informationAccurate: { type: Boolean, default: false },
      qualifiedToPractise: { type: Boolean, default: false },
      noDisciplinaryAction: { type: Boolean, default: false },
      declaredAt: { type: Date },
    },
    legacyLawyerProfileId: { type: Schema.Types.ObjectId, ref: 'LawyerProfile' },
    categoryData: { type: Schema.Types.Mixed, default: {} },

    // Fractional GC fields
    fractionalGC: {
      isAvailable: { type: Boolean, default: false },
      monthlyRetainerMin: { type: Number, default: 0 },
      monthlyRetainerMax: { type: Number, default: 0 },
      hoursPerMonth: { type: Number, default: 0 },
      industries: [{ type: String }],
      companyStages: [{ type: String }],
      engagementTypes: [{ type: String }],
      scopeOfWork: [{ type: String }],
      minimumEngagementMonths: { type: Number, default: 3 },
      autoRenew: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

professionalProfileSchema.index({ userId: 1, category: 1 }, { unique: true });

export default mongoose.model<IProfessionalProfile>('ProfessionalProfile', professionalProfileSchema);