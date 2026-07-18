import mongoose, { Document, Schema } from 'mongoose';

export interface ILegalAcceptance extends Document {
  userId: mongoose.Types.ObjectId;
  documentId: mongoose.Types.ObjectId;
  slug: string;
  version: string;
  acceptedAt: Date;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const legalAcceptanceSchema = new Schema<ILegalAcceptance>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'LegalDocument',
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    version: {
      type: String,
      required: true,
    },
    acceptedAt: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
    },
  },
  { timestamps: true }
);

// Ensure one acceptance per user per document
legalAcceptanceSchema.index({ userId: 1, documentId: 1 }, { unique: true });

export default mongoose.model<ILegalAcceptance>('LegalAcceptance', legalAcceptanceSchema);