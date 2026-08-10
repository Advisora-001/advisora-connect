import mongoose, { Document, Schema } from 'mongoose';

export interface IPayoutRequest extends Document {
  lawyerId: mongoose.Types.ObjectId;
  walletId: mongoose.Types.ObjectId;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  processedAt?: Date;
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const payoutRequestSchema = new Schema<IPayoutRequest>(
  {
    lawyerId: { type: Schema.Types.ObjectId, ref: 'LawyerProfile', required: true },
    walletId: { type: Schema.Types.ObjectId, ref: 'Wallet', required: true },
    amount: { type: Number, required: true },
    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    accountName: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'processed'], default: 'pending' },
    processedAt: { type: Date },
    adminNote: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IPayoutRequest>('PayoutRequest', payoutRequestSchema);