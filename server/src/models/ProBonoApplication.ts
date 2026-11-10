import mongoose, { Document, Schema } from 'mongoose';

export const proBonoApplicationCategories = ['women-children', 'exceptional-hardship', 'other'] as const;
export const proBonoUrgencies = ['low', 'moderate', 'urgent', 'immediate'] as const;

export type ProBonoApplicationCategory = (typeof proBonoApplicationCategories)[number];
export type ProBonoUrgency = (typeof proBonoUrgencies)[number];
export type ProBonoApplicationStatus = 'new' | 'reviewing' | 'accepted' | 'rejected';

export interface IProBonoApplication extends Document {
  fullName: string;
  email: string;
  phone: string;
  category: ProBonoApplicationCategory;
  urgency: ProBonoUrgency;
  description: string;
  financialHardshipNote?: string;
  status: ProBonoApplicationStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const proBonoApplicationSchema = new Schema<IProBonoApplication>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [...proBonoApplicationCategories],
      required: true,
    },
    urgency: {
      type: String,
      enum: [...proBonoUrgencies],
      default: 'moderate',
    },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    financialHardshipNote: { type: String, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ['new', 'reviewing', 'accepted', 'rejected'],
      default: 'new',
    },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

proBonoApplicationSchema.index({ createdAt: -1 });
proBonoApplicationSchema.index({ status: 1, createdAt: -1 });
proBonoApplicationSchema.index({ email: 1, createdAt: -1 });

export default mongoose.model<IProBonoApplication>('ProBonoApplication', proBonoApplicationSchema);
