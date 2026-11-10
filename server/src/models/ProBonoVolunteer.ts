import mongoose, { Document, Schema } from 'mongoose';

export const proBonoVolunteerProfessions = ['lawyer', 'accountant', 'tax', 'other'] as const;
export const proBonoVolunteerContributionTypes = [
  'periodic-hours',
  'initial-consultation',
  'advisory-research',
  'case-representation',
] as const;

export type ProBonoVolunteerProfession = (typeof proBonoVolunteerProfessions)[number];
export type ProBonoVolunteerContributionType = (typeof proBonoVolunteerContributionTypes)[number];
export type ProBonoVolunteerStatus = 'new' | 'reviewing' | 'approved' | 'rejected';

export interface IProBonoVolunteer extends Document {
  fullName: string;
  email: string;
  phone: string;
  profession: ProBonoVolunteerProfession;
  barNumber?: string;
  practiceAreas?: string;
  contributionType: ProBonoVolunteerContributionType;
  availabilityNote?: string;
  status: ProBonoVolunteerStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const proBonoVolunteerSchema = new Schema<IProBonoVolunteer>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    profession: {
      type: String,
      enum: [...proBonoVolunteerProfessions],
      required: true,
    },
    barNumber: { type: String, trim: true, maxlength: 100 },
    practiceAreas: { type: String, trim: true, maxlength: 500 },
    contributionType: {
      type: String,
      enum: [...proBonoVolunteerContributionTypes],
      required: true,
    },
    availabilityNote: { type: String, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ['new', 'reviewing', 'approved', 'rejected'],
      default: 'new',
    },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

proBonoVolunteerSchema.index({ createdAt: -1 });
proBonoVolunteerSchema.index({ status: 1, createdAt: -1 });
proBonoVolunteerSchema.index({ email: 1, createdAt: -1 });

export default mongoose.model<IProBonoVolunteer>('ProBonoVolunteer', proBonoVolunteerSchema);
