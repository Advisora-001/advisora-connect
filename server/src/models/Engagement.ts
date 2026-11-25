import mongoose, { Document, Schema } from 'mongoose';

export interface IEngagement extends Document {
  // References
  proposalId: mongoose.Types.ObjectId;
  lawyerId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  leadId: mongoose.Types.ObjectId;
  subscriptionId: mongoose.Types.ObjectId;

  // Engagement details
  monthlyRetainer: number;
  hoursPerMonth: number;
  engagementMonths: number;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  status: 'active' | 'paused' | 'completed' | 'terminated' | 'expired';

  // Terms
  paymentTerms: 'monthly_advance' | 'monthly_arrears' | 'quarterly_advance';
  terminationNoticeDays: number;
  includesOutOfScopeRate: boolean;
  outOfScopeHourlyRate?: number;

  // Scope
  scopeOfWork: string[];
  customScope?: string;
  industries: string[];
  companyStages: string[];
  engagementType: string;

  // Tracking
  hoursUsedThisMonth: number;
  hoursUsedTotal: number;
  lastBillingDate: Date;
  nextBillingDate: Date;
  totalBilled: number;
  lastMeetingDate?: Date;
  nextMeetingDate?: Date;

  // Meetings
  meetings: Array<{
    date: Date;
    duration: number; // minutes
    type: 'video' | 'audio' | 'in-person';
    notes?: string;
    attendedBy: ('lawyer' | 'client')[];
  }>;

  // Hours tracking
  hourEntries: Array<{
    date: Date;
    hours: number;
    description: string;
    category: string; // e.g., 'contract_review', 'meeting', 'research', 'drafting'
    billed: boolean;
  }>;

  // Status changes
  statusHistory: Array<{
    status: string;
    changedAt: Date;
    changedBy: mongoose.Types.ObjectId;
    reason?: string;
  }>;

  // Termination
  terminatedAt?: Date;
  terminatedBy?: mongoose.Types.ObjectId;
  terminationReason?: string;

  // Metadata
  notes?: string; // Lawyer's private notes
  clientNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const engagementSchema = new Schema<IEngagement>(
  {
    // References
    proposalId: { type: Schema.Types.ObjectId, ref: 'FractionalProposal', required: true, index: true },
    lawyerId: { type: Schema.Types.ObjectId, ref: 'ProfessionalProfile', required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
    subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription', required: true },

    // Engagement details
    monthlyRetainer: { type: Number, required: true, min: 0 },
    hoursPerMonth: { type: Number, required: true, min: 1 },
    engagementMonths: { type: Number, required: true, min: 1 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    autoRenew: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'terminated', 'expired'],
      default: 'active',
      index: true,
    },

    // Terms
    paymentTerms: {
      type: String,
      enum: ['monthly_advance', 'monthly_arrears', 'quarterly_advance'],
      default: 'monthly_advance',
    },
    terminationNoticeDays: { type: Number, default: 30 },
    includesOutOfScopeRate: { type: Boolean, default: false },
    outOfScopeHourlyRate: { type: Number, min: 0 },

    // Scope
    scopeOfWork: [{ type: String }],
    customScope: { type: String },
    industries: [{ type: String }],
    companyStages: [{ type: String }],
    engagementType: { type: String, required: true },

    // Tracking
    hoursUsedThisMonth: { type: Number, default: 0 },
    hoursUsedTotal: { type: Number, default: 0 },
    lastBillingDate: { type: Date },
    nextBillingDate: { type: Date },
    totalBilled: { type: Number, default: 0 },
    lastMeetingDate: { type: Date },
    nextMeetingDate: { type: Date },

    // Meetings
    meetings: [{
      date: { type: Date, required: true },
      duration: { type: Number, required: true, min: 1 }, // minutes
      type: { type: String, enum: ['video', 'audio', 'in-person'], required: true },
      notes: { type: String },
      attendedBy: [{ type: String, enum: ['lawyer', 'client'] }],
    }],

    // Hours tracking
    hourEntries: [{
      date: { type: Date, required: true },
      hours: { type: Number, required: true, min: 0.25, max: 24 },
      description: { type: String, required: true },
      category: {
        type: String,
        enum: ['contract_review', 'meeting', 'research', 'drafting', 'consultation', 'compliance', 'governance', 'fundraising', 'ip_management', 'employment_law', 'other'],
        default: 'other'
      },
      billed: { type: Boolean, default: false },
    }],

    // Status changes
    statusHistory: [{
      status: { type: String, required: true },
      changedAt: { type: Date, default: Date.now },
      changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      reason: { type: String },
    }],

    // Termination
    terminatedAt: { type: Date },
    terminatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    terminationReason: { type: String },

    // Metadata
    notes: { type: String, maxlength: 5000 },
    clientNotes: { type: String, maxlength: 5000 },
  },
  { timestamps: true }
);

// Indexes
engagementSchema.index({ lawyerId: 1, status: 1 });
engagementSchema.index({ clientId: 1, status: 1 });
engagementSchema.index({ proposalId: 1 });
engagementSchema.index({ nextBillingDate: 1 });
engagementSchema.index({ endDate: 1 });

export default mongoose.model<IEngagement>('Engagement', engagementSchema);