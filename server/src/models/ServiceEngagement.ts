import mongoose, { Document, Schema } from 'mongoose';

export interface IServiceEngagement extends Document {
  professionalProfileId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  enquiryId?: mongoose.Types.ObjectId;
  title: string;
  scope: string;
  status: 'proposed' | 'active' | 'completed' | 'cancelled';
  proposedFee?: number;
  currency: string;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const serviceEngagementSchema = new Schema<IServiceEngagement>(
  {
    professionalProfileId: { type: Schema.Types.ObjectId, ref: 'ProfessionalProfile', required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    enquiryId: { type: Schema.Types.ObjectId, ref: 'ProfessionalEnquiry' },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    scope: { type: String, required: true, trim: true, maxlength: 5000 },
    status: { type: String, enum: ['proposed', 'active', 'completed', 'cancelled'], default: 'proposed' },
    proposedFee: { type: Number, min: 0 },
    currency: { type: String, default: 'NGN', uppercase: true },
    startDate: Date,
    endDate: Date,
  },
  { timestamps: true }
);

serviceEngagementSchema.index({ professionalProfileId: 1, status: 1, createdAt: -1 });
serviceEngagementSchema.index({ clientId: 1, createdAt: -1 });
serviceEngagementSchema.index({ enquiryId: 1 }, { unique: true, sparse: true });

export default mongoose.model<IServiceEngagement>('ServiceEngagement', serviceEngagementSchema);
