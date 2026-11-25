import mongoose, { Document, Schema } from 'mongoose';

export interface IFractionalProposal extends Document {
  // References
  lawyerId: mongoose.Types.ObjectId;           // ProfessionalProfile of lawyer
  clientId: mongoose.Types.ObjectId;           // User of client
  leadId?: mongoose.Types.ObjectId;            // Optional: linked lead

  // Proposal details
  monthlyRetainer: number;                     // NGN
  hoursPerMonth: number;
  engagementMonths: number;                    // Minimum commitment
  startDate: Date;
  autoRenew: boolean;

  // Scope
  industries: string[];
  companyStages: string[];
  engagementType: string;                      // 'Monthly Retainer' | 'Project-based' | 'Interim GC' | 'Board Advisor'
  scopeOfWork: string[];                       // Selected from predefined list
  customScope?: string;                        // Additional custom scope

  // Terms
  paymentTerms: 'monthly_advance' | 'monthly_arrears' | 'quarterly_advance';
  terminationNoticeDays: number;               // Default 30
  includesOutOfScopeRate: boolean;             // Hourly rate for additional work
  outOfScopeHourlyRate?: number;

  // Status workflow
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'active' | 'rejected' | 'expired' | 'withdrawn';
  sentAt?: Date;
  viewedAt?: Date;
  respondedAt?: Date;
  acceptedAt?: Date;
  expiresAt: Date;                             // Proposal validity (default 14 days)

  // Subscription link (created after acceptance)
  subscriptionId?: mongoose.Types.ObjectId;
  paystackRef?: string;

  // Metadata
  notes?: string;                              // Lawyer's notes to client
  clientNotes?: string;                        // Client's notes
  createdAt: Date;
  updatedAt: Date;
}

const fractionalProposalSchema = new Schema<IFractionalProposal>(
  {
    // References
    lawyerId: {
      type: Schema.Types.ObjectId,
      ref: 'ProfessionalProfile',
      required: true,
      index: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    leadId: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      index: true,
    },

    // Proposal details
    monthlyRetainer: { type: Number, required: true, min: 0 },
    hoursPerMonth: { type: Number, required: true, min: 1 },
    engagementMonths: { type: Number, required: true, min: 1, default: 3 },
    startDate: { type: Date, required: true },
    autoRenew: { type: Boolean, default: true },

    // Scope
    industries: [{ type: String }],
    companyStages: [{ type: String }],
    engagementType: {
      type: String,
      required: true,
      enum: ['Monthly Retainer', 'Project-based', 'Interim GC', 'Board Advisor'],
    },
    scopeOfWork: [{ type: String }],
    customScope: { type: String },

    // Terms
    paymentTerms: {
      type: String,
      enum: ['monthly_advance', 'monthly_arrears', 'quarterly_advance'],
      default: 'monthly_advance',
    },
    terminationNoticeDays: { type: Number, default: 30 },
    includesOutOfScopeRate: { type: Boolean, default: false },
    outOfScopeHourlyRate: { type: Number, min: 0 },

    // Status workflow
    status: {
      type: String,
      enum: ['draft', 'sent', 'viewed', 'accepted', 'active', 'rejected', 'expired', 'withdrawn'],
      default: 'draft',
      index: true,
    },
    sentAt: { type: Date },
    viewedAt: { type: Date },
    respondedAt: { type: Date },
    acceptedAt: { type: Date },
    expiresAt: { type: Date, required: true },

    // Subscription link
    subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription' },
    paystackRef: { type: String },

    // Metadata
    notes: { type: String, maxlength: 2000 },
    clientNotes: { type: String, maxlength: 2000 },
  },
  { timestamps: true }
);

// Indexes
fractionalProposalSchema.index({ lawyerId: 1, status: 1 });
fractionalProposalSchema.index({ clientId: 1, status: 1 });
fractionalProposalSchema.index({ expiresAt: 1, status: 1 });

export default mongoose.model<IFractionalProposal>('FractionalProposal', fractionalProposalSchema);