import mongoose, { Document, Schema } from 'mongoose';

export interface IPaymentWebhookEvent extends Document {
  eventId: string;
  eventType: string;
  status: 'processing' | 'processed';
  processedAt: Date;
  reference: string;
}

const paymentWebhookEventSchema = new Schema<IPaymentWebhookEvent>(
  {
    eventId: { type: String, required: true, unique: true },
    eventType: { type: String, required: true },
    status: { type: String, enum: ['processing', 'processed'], default: 'processing' },
    reference: { type: String, required: true },
    processedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<IPaymentWebhookEvent>('PaymentWebhookEvent', paymentWebhookEventSchema);
