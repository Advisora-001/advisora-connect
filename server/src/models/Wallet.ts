import mongoose, { Document, Schema } from 'mongoose';

export interface IWallet extends Document {
  lawyerId: mongoose.Types.ObjectId;
  balance: number;
  totalEarned: number;
  pendingBalance: number;
  transactions: {
    type: 'credit' | 'debit' | 'payout';
    amount: number;
    description: string;
    appointmentId?: mongoose.Types.ObjectId;
    payoutRequestId?: mongoose.Types.ObjectId;
    createdAt?: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const walletSchema = new Schema<IWallet>(
  {
    lawyerId: { type: Schema.Types.ObjectId, ref: 'LawyerProfile', required: true, unique: true },
    balance: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    pendingBalance: { type: Number, default: 0 },
    transactions: [{
      type: { type: String, enum: ['credit', 'debit', 'payout'] },
      amount: { type: Number, required: true },
      description: { type: String },
      appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
      payoutRequestId: { type: Schema.Types.ObjectId, ref: 'PayoutRequest' },
      createdAt: { type: Date, default: Date.now },
    }],
  },
  { timestamps: true }
);

export default mongoose.model<IWallet>('Wallet', walletSchema);