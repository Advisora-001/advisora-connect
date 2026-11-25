import mongoose, { Document, Schema } from 'mongoose';

export interface IVolunteerLawyer extends Document {
  // User reference (optional - can register before creating platform account)
  userId?: mongoose.Types.ObjectId;

  // Professional info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  // Licensing
  licenseType: 'scn' | 'bar_number' | 'practicing_license' | 'other';
  licenseNumber: string;
  licensingBody: string; // e.g., Nigerian Bar Association, Law Society
  yearOfCall: number;
  jurisdiction: string; // e.g., Nigeria, specific state
  isCurrentlyPracticing: boolean;

  // Practice areas (multi-select from categories)
  practiceAreas: string[];

  // Volunteering preferences
  preferredCategories: Array<'domestic_violence' | 'sexual_abuse' | 'child_abuse' | 'child_custody' | 'women_rights' | 'exceptional_hardship' | 'other'>;
  maxCasesPerMonth: number;
  availabilityHoursPerWeek: number;
  preferredConsultationModes: Array<'video' | 'audio' | 'in-person'>;
  languages: string[];

  // Commitment
  commitmentLevel: 'occasional' | 'regular' | 'dedicated';
  willingToMentor: boolean;

  // Declarations
  noDisciplinaryActions: boolean;
  noConflictsOfInterest: boolean;
  understandsProBonoObligations: boolean;
  professionalIndemnityInsurance: boolean;

  // Status and review
  status: 'pending' | 'approved' | 'rejected' | 'suspended' | 'withdrawn';
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;

  // Statistics
  casesAccepted: number;
  casesCompleted: number;
  totalVolunteerHours: number;
  lastActiveAt?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const volunteerLawyerSchema = new Schema<IVolunteerLawyer>(
  {
    // User reference
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },

    // Professional info
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    phone: { type: String, required: true, trim: true },

    // Licensing
    licenseType: {
      type: String,
      required: true,
      enum: ['scn', 'bar_number', 'practicing_license', 'other']
    },
    licenseNumber: { type: String, required: true, trim: true },
    licensingBody: { type: String, required: true, trim: true },
    yearOfCall: { type: Number, required: true, min: 1950, max: new Date().getFullYear() },
    jurisdiction: { type: String, required: true, trim: true, default: 'Nigeria' },
    isCurrentlyPracticing: { type: Boolean, default: true },

    // Practice areas
    practiceAreas: [{ type: String, trim: true }],

    // Volunteering preferences
    preferredCategories: [{
      type: String,
      enum: ['domestic_violence', 'sexual_abuse', 'child_abuse', 'child_custody', 'women_rights', 'exceptional_hardship', 'other']
    }],
    maxCasesPerMonth: { type: Number, default: 2, min: 1, max: 20 },
    availabilityHoursPerWeek: { type: Number, default: 5, min: 1, max: 40 },
    preferredConsultationModes: [{
      type: String,
      enum: ['video', 'audio', 'in-person']
    }],
    languages: [{ type: String, trim: true }],

    // Commitment
    commitmentLevel: {
      type: String,
      enum: ['occasional', 'regular', 'dedicated'],
      default: 'regular'
    },
    willingToMentor: { type: Boolean, default: false },

    // Declarations
    noDisciplinaryActions: { type: Boolean, required: true, default: false },
    noConflictsOfInterest: { type: Boolean, required: true, default: false },
    understandsProBonoObligations: { type: Boolean, required: true, default: false },
    professionalIndemnityInsurance: { type: Boolean, default: false },

    // Status and review
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended', 'withdrawn'],
      default: 'pending',
      index: true
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    reviewNotes: { type: String, maxlength: 2000 },

    // Statistics
    casesAccepted: { type: Number, default: 0 },
    casesCompleted: { type: Number, default: 0 },
    totalVolunteerHours: { type: Number, default: 0 },
    lastActiveAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes
volunteerLawyerSchema.index({ status: 1, createdAt: -1 });
volunteerLawyerSchema.index({ preferredCategories: 1, status: 1 });
volunteerLawyerSchema.index({ email: 1 }, { unique: true });

export default mongoose.model<IVolunteerLawyer>('VolunteerLawyer', volunteerLawyerSchema);