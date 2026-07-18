import mongoose, { Document, Schema } from 'mongoose';

export interface ILead extends Document {
  lawyerId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'declined' | 'booked' | 'closed' | 'expired';
  enquiryMessage: string;
  leadFee: number;
  platformFee: number;
  paymentRef?: string;
  paymentStatus: 'unpaid' | 'paid' | 'failed';
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  createdAt: Date;
  respondedAt?: Date;
  expiresAt: Date;
  contactedAt?: Date;
}

const leadSchema = new Schema<ILead>(
  {
    lawyerId: { type: Schema.Types.ObjectId, ref: 'LawyerProfile', required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'booked', 'closed', 'expired'],
      default: 'pending',
    },
    enquiryMessage: {
      type: String,
      required: true,
      maxlength: [500, 'Enquiry message cannot exceed 500 characters'],
    },
    leadFee: { type: Number, required: true, default: 0 },
    platformFee: { type: Number, required: true, default: 0 },
    paymentRef: { type: String },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'failed'],
      default: 'unpaid',
    },
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    clientPhone: { type: String },
    respondedAt: { type: Date },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
    },
    contactedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<ILead>('Lead', leadSchema);