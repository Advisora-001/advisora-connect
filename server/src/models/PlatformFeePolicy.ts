import mongoose, { Document, Schema } from 'mongoose';

export interface IPlatformFeePolicy extends Document {
  key: string;
  isActive: boolean;
  type: 'fixed' | 'percentage';
  amount: number;
  currency: string;
  appliesTo: ('consultation' | 'lead' | 'service')[];
}

const platformFeePolicySchema = new Schema<IPlatformFeePolicy>(
  {
    key: { type: String, required: true, unique: true, default: 'default' },
    isActive: { type: Boolean, default: true },
    type: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'NGN', uppercase: true },
    appliesTo: [{ type: String, enum: ['consultation', 'lead', 'service'] }],
  },
  { timestamps: true }
);

export default mongoose.model<IPlatformFeePolicy>('PlatformFeePolicy', platformFeePolicySchema);
