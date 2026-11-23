import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscriptionPayment extends Document {
  subscriptionId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  firmId?: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  paystackRef: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  paidAt?: Date;
  createdAt: Date;
}

const subscriptionPaymentSchema = new Schema<ISubscriptionPayment>(
  {
    subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    firmId: { type: Schema.Types.ObjectId, ref: 'Firm' },
    planId: { type: Schema.Types.ObjectId, ref: 'Plan', required: true },
    paystackRef: { type: String, required: true, unique: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<ISubscriptionPayment>('SubscriptionPayment', subscriptionPaymentSchema);
