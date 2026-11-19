import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscription extends Document {
  userId?: mongoose.Types.ObjectId;
  firmId?: mongoose.Types.ObjectId;
  planId?: mongoose.Types.ObjectId;
  plan: string;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  paystackRef?: string;
  amount: number;
  currency?: string;
  billingInterval?: 'monthly' | 'yearly';
  planSnapshot?: Record<string, unknown>;
  createdAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    firmId: { type: Schema.Types.ObjectId, ref: 'Firm', index: true },
    planId: { type: Schema.Types.ObjectId, ref: 'Plan' },
    plan: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'expired', 'cancelled'],
      default: 'pending',
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    autoRenew: { type: Boolean, default: true },
    paystackRef: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'NGN' },
    billingInterval: { type: String, enum: ['monthly', 'yearly'] },
    planSnapshot: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

subscriptionSchema.index({ paystackRef: 1 }, { unique: true, sparse: true });
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ firmId: 1, status: 1 });

export default mongoose.model<ISubscription>('Subscription', subscriptionSchema);