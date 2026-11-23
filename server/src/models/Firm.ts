import mongoose, { Document, Schema } from 'mongoose';

export interface IFirm extends Document {
  name: string;
  slug: string;
  description?: string;
  adminId: mongoose.Types.ObjectId;
  contactEmail?: string;
  contactPhone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  website?: string;
  logo?: string;
  subscriptionId?: mongoose.Types.ObjectId;
  plan?: mongoose.Types.ObjectId;
  status: 'active' | 'suspended' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const firmSchema = new Schema<IFirm>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    contactEmail: { type: String, lowercase: true },
    contactPhone: { type: String },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String },
    },
    website: { type: String },
    logo: { type: String },
    subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription' },
    plan: { type: Schema.Types.ObjectId, ref: 'Plan' },
    status: {
      type: String,
      enum: ['active', 'suspended', 'cancelled'],
      default: 'active',
    },
  },
  { timestamps: true }
);

export default mongoose.model<IFirm>('Firm', firmSchema);