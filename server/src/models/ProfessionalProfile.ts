import mongoose, { Document, Schema } from 'mongoose';

export const professionalCategories = ['legal', 'accounting', 'tax'] as const;
export type ProfessionalCategory = (typeof professionalCategories)[number];
export type ProfessionalVerificationStatus = 'draft' | 'pending' | 'verified' | 'rejected';

export interface IProfessionalProfile extends Document {
  userId: mongoose.Types.ObjectId;
  category: ProfessionalCategory;
  professionalTitle: string;
  bio: string;
  qualifications: string[];
  professionalBody: string;
  membershipNumber: string;
  specializations: string[];
  services: string[];
  yearsOfExperience: number;
  city: string;
  state: string;
  country: string;
  verificationDocs: string[];
  verificationStatus: ProfessionalVerificationStatus;
  reviewNote: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const professionalProfileSchema = new Schema<IProfessionalProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, enum: professionalCategories, required: true },
    professionalTitle: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 2000 },
    qualifications: [{ type: String }],
    professionalBody: { type: String, default: '' },
    membershipNumber: { type: String, default: '' },
    specializations: [{ type: String }],
    services: [{ type: String }],
    yearsOfExperience: { type: Number, default: 0, min: 0 },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: 'Nigeria' },
    verificationDocs: [{ type: String }],
    verificationStatus: {
      type: String,
      enum: ['draft', 'pending', 'verified', 'rejected'],
      default: 'draft',
    },
    reviewNote: { type: String, default: '' },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

professionalProfileSchema.index({ userId: 1, category: 1 }, { unique: true });
professionalProfileSchema.index({ category: 1, verificationStatus: 1, state: 1, city: 1 });

export default mongoose.model<IProfessionalProfile>('ProfessionalProfile', professionalProfileSchema);
