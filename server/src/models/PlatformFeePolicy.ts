import mongoose, { Document, Schema } from 'mongoose';

export interface IPlatformFeePolicy extends Document {
  transactionType: 'consultation' | 'enquiry' | 'engagement' | 'subscription';
  feeType: 'fixed' | 'percentage';
  fixedAmount?: number;
  percentage?: number;
  minAmount?: number;
  maxAmount?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const platformFeePolicySchema = new Schema<IPlatformFeePolicy>(
  {
    transactionType: {
      type: String,
      enum: ['consultation', 'enquiry', 'engagement', 'subscription'],
      required: true,
      unique: true,
    },
    feeType: {
      type: String,
      enum: ['fixed', 'percentage'],
      required: true,
    },
    fixedAmount: { type: Number },
    percentage: { type: Number },
    minAmount: { type: Number },
    maxAmount: { type: Number },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IPlatformFeePolicy>('PlatformFeePolicy', platformFeePolicySchema);