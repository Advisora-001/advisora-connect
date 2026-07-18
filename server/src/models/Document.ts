import mongoose, { Document, Schema } from 'mongoose';

export interface ILegalDocument extends Document {
  uploadedBy: mongoose.Types.ObjectId;
  lawyerId?: mongoose.Types.ObjectId;
  clientId?: mongoose.Types.ObjectId;
  fileName: string;
  cloudinaryUrl: string;
  fileType: string;
  fileSize: number;
  accessPermissions: mongoose.Types.ObjectId[];
  expiryDate?: Date;
  auditLog: Array<{
    action: string;
    userId: mongoose.Types.ObjectId;
    timestamp: Date;
  }>;
  createdAt: Date;
}

const documentSchema = new Schema<ILegalDocument>(
  {
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lawyerId: { type: Schema.Types.ObjectId, ref: 'LawyerProfile' },
    clientId: { type: Schema.Types.ObjectId, ref: 'User' },
    fileName: { type: String, required: true },
    cloudinaryUrl: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    accessPermissions: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    expiryDate: { type: Date },
    auditLog: [
      {
        action: String,
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<ILegalDocument>('Document', documentSchema);