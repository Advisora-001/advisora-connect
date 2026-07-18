import mongoose, { Document, Schema } from 'mongoose';

export interface IPaymentRecord extends Document {
  userId: mongoose.Types.ObjectId;
  appointmentId: mongoose.Types.ObjectId;
  lawyerId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  amount: number;
  platformFee: number;
  lawyerAmount: number;
  paystackRef: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: Date;
}

const paymentRecordSchema = new Schema<IPaymentRecord>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true },
    lawyerId: { type: Schema.Types.ObjectId, ref: 'LawyerProfile', required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    platformFee: { type: Number, required: true },
    lawyerAmount: { type: Number, required: true },
    paystackRef: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

export default mongoose.model<IPaymentRecord>('PaymentRecord', paymentRecordSchema);