import mongoose, { Document, Schema } from 'mongoose';

export interface ILegalDocument extends Document {
  slug: string;
  title: string;
  content: string;
  version: string;
  effectiveDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const legalDocumentSchema = new Schema<ILegalDocument>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    version: {
      type: String,
      required: true,
      default: '1.0',
    },
    effectiveDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<ILegalDocument>('LegalDocument', legalDocumentSchema);