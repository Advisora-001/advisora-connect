import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscriptionPayment extends Document {
  subscriptionId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  firmId?: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  paystackRef: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paidAt?: Date;
}

const subscriptionPaymentSchema = new Schema<ISubscriptionPayment>(
  {
    subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    firmId: { type: Schema.Types.ObjectId, ref: 'Firm' },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'NGN', uppercase: true },
    paystackRef: { type: String, required: true, unique: true },
    status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
    paidAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model<ISubscriptionPayment>('SubscriptionPayment', subscriptionPaymentSchema);
