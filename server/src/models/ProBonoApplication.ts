import mongoose, { Document, Schema } from 'mongoose';

export interface IProBonoApplication extends Document {
  // Applicant info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';

  // Location
  address: string;
  city: string;
  state: string;
  country: string; // default Nigeria

  // Financial circumstances
  employmentStatus: 'employed' | 'unemployed' | 'self_employed' | 'student' | 'retired' | 'other';
  monthlyIncome?: number;
  dependantsCount: number;
  financialHardshipDetails: string;

  // Legal issue
  legalIssueCategory: 'domestic_violence' | 'sexual_abuse' | 'child_abuse' | 'child_custody' | 'women_rights' | 'exceptional_hardship' | 'other';
  legalIssueDescription: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  hasExistingLegalProceedings: boolean;
  existingProceedingsDetails?: string;

  // Supporting documents
  supportingDocuments: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    uploadedAt: Date;
  }>;

  // Consent and declarations
  consentToShareInfo: boolean;
  consentToContact: boolean;
  declarationOfTruth: boolean;

  // Status and review
  status: 'submitted' | 'under_review' | 'more_info_needed' | 'approved_consultation' | 'approved_limited' | 'approved_representation' | 'rejected' | 'withdrawn';
  assignedVolunteerLawyer?: mongoose.Types.ObjectId;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  rejectionReason?: string;

  // Scope of approved assistance
  approvedScope?: {
    consultation: boolean;
    advice: boolean;
    documentReview: boolean;
    documentPreparation: boolean;
    limitedRepresentation: boolean;
    representationDetails?: string;
  };

  // Metadata
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const proBonoApplicationSchema = new Schema<IProBonoApplication>(
  {
    // Applicant info
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    phone: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },

    // Location
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, default: 'Nigeria', trim: true },

    // Financial circumstances
    employmentStatus: {
      type: String,
      required: true,
      enum: ['employed', 'unemployed', 'self_employed', 'student', 'retired', 'other']
    },
    monthlyIncome: { type: Number, min: 0 },
    dependantsCount: { type: Number, default: 0, min: 0 },
    financialHardshipDetails: { type: String, required: true, maxlength: 2000 },

    // Legal issue
    legalIssueCategory: {
      type: String,
      required: true,
      enum: ['domestic_violence', 'sexual_abuse', 'child_abuse', 'child_custody', 'women_rights', 'exceptional_hardship', 'other'],
      index: true
    },
    legalIssueDescription: { type: String, required: true, maxlength: 3000 },
    urgencyLevel: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    hasExistingLegalProceedings: { type: Boolean, default: false },
    existingProceedingsDetails: { type: String, maxlength: 1000 },

    // Supporting documents
    supportingDocuments: [{
      fileName: { type: String, required: true },
      fileUrl: { type: String, required: true },
      fileType: { type: String, required: true },
      fileSize: { type: Number, required: true },
      uploadedAt: { type: Date, default: Date.now }
    }],

    // Consent and declarations
    consentToShareInfo: { type: Boolean, required: true, default: false },
    consentToContact: { type: Boolean, required: true, default: false },
    declarationOfTruth: { type: Boolean, required: true, default: false },

    // Status and review
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'more_info_needed', 'approved_consultation', 'approved_limited', 'approved_representation', 'rejected', 'withdrawn'],
      default: 'submitted',
      index: true
    },
    assignedVolunteerLawyer: { type: Schema.Types.ObjectId, ref: 'VolunteerLawyer' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    reviewNotes: { type: String, maxlength: 2000 },
    rejectionReason: { type: String, maxlength: 1000 },

    // Scope of approved assistance
    approvedScope: {
      consultation: { type: Boolean, default: false },
      advice: { type: Boolean, default: false },
      documentReview: { type: Boolean, default: false },
      documentPreparation: { type: Boolean, default: false },
      limitedRepresentation: { type: Boolean, default: false },
      representationDetails: { type: String, maxlength: 1000 }
    },

    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Indexes
proBonoApplicationSchema.index({ status: 1, createdAt: -1 });
proBonoApplicationSchema.index({ email: 1, status: 1 });
proBonoApplicationSchema.index({ legalIssueCategory: 1, urgencyLevel: 1 });

export default mongoose.model<IProBonoApplication>('ProBonoApplication', proBonoApplicationSchema);