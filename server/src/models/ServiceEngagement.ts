import mongoose, { Document, Schema } from 'mongoose';

export interface IServiceEngagement extends Document {
  professionalId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
  serviceType: string;
  consultationMode: 'video' | 'audio' | 'in-person';
  scope: string;
  offeredPrice: number;
  acceptedPrice: number;
  status: 'offered' | 'accepted' | 'active' | 'completed' | 'cancelled';
  scheduledAt?: Date;
  completedAt?: Date;
  meetingLink?: string;
  platformFee: number;
  professionalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const serviceEngagementSchema = new Schema<IServiceEngagement>(
  {
    professionalId: {
      type: Schema.Types.ObjectId,
      ref: 'ProfessionalProfile',
      required: true,
      index: true,
    },
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: Schema.Types.ObjectId, ref: 'ProfessionalCategory', required: true },
    serviceType: { type: String, required: true },
    consultationMode: {
      type: String,
      enum: ['video', 'audio', 'in-person'],
      required: true,
    },
    scope: { type: String, required: true },
    offeredPrice: { type: Number, required: true },
    acceptedPrice: { type: Number },
    status: {
      type: String,
      enum: ['offered', 'accepted', 'active', 'completed', 'cancelled'],
      default: 'offered',
    },
    scheduledAt: { type: Date },
    completedAt: { type: Date },
    meetingLink: { type: String },
    platformFee: { type: Number, required: true, default: 0 },
    professionalAmount: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IServiceEngagement>('ServiceEngagement', serviceEngagementSchema);