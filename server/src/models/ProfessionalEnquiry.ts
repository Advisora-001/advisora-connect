import mongoose, { Document, Schema } from 'mongoose';

export interface IProfessionalEnquiry extends Document {
  professionalProfileId: mongoose.Types.ObjectId;
  professionalUserId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  message: string;
  status: 'pending' | 'closed';
  createdAt: Date;
}

const professionalEnquirySchema = new Schema<IProfessionalEnquiry>(
  {
    professionalProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'ProfessionalProfile',
      required: true,
    },
    professionalUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true, maxlength: 2000 },
    status: { type: String, enum: ['pending', 'closed'], default: 'pending' },
  },
  { timestamps: true }
);

professionalEnquirySchema.index({ professionalUserId: 1, createdAt: -1 });
professionalEnquirySchema.index({ clientId: 1, createdAt: -1 });

export default mongoose.model<IProfessionalEnquiry>('ProfessionalEnquiry', professionalEnquirySchema);
