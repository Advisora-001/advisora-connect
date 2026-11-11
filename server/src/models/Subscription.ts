import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscription extends Document {
  ownerType: 'individual' | 'firm';
  userId?: mongoose.Types.ObjectId;
  firmId?: mongoose.Types.ObjectId;
  plan: 'basic' | 'professional' | 'premium';
  planKey: string;
  tier: 'basic' | 'premium';
  planSnapshot: Record<string, unknown>;
  billingInterval: 'month' | 'year';
  status: 'active' | 'expired' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  autoRenew: boolean;
  paystackRef?: string;
  amount: number;
  createdAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    ownerType: { type: String, enum: ['individual', 'firm'], default: 'individual' },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    firmId: { type: Schema.Types.ObjectId, ref: 'Firm' },
    plan: {
      type: String,
      enum: ['basic', 'professional', 'premium'],
      required: true,
    },
    planKey: { type: String, default: 'basic' },
    tier: { type: String, enum: ['basic', 'premium'], default: 'basic' },
    planSnapshot: { type: Schema.Types.Mixed, default: {} },
    billingInterval: { type: String, enum: ['month', 'year'], default: 'month' },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'active',
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    autoRenew: { type: Boolean, default: true },
    paystackRef: { type: String },
    amount: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

subscriptionSchema.pre('validate', function (next) {
  if (this.ownerType === 'firm' && !this.firmId) {
    next(new Error('Firm subscriptions require a firmId'));
    return;
  }
  if (this.ownerType === 'individual' && !this.userId) {
    next(new Error('Individual subscriptions require a userId'));
    return;
  }
  next();
});
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ firmId: 1, status: 1 });
subscriptionSchema.index({ paystackRef: 1 }, { sparse: true, unique: true });

export default mongoose.model<ISubscription>('Subscription', subscriptionSchema);