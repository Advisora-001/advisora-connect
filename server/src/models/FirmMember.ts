import mongoose, { Document, Schema } from 'mongoose';

export interface IFirmMember extends Document {
  firmId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  professionalProfileId: mongoose.Types.ObjectId;
  role: 'owner' | 'admin' | 'member';
  invitedBy?: mongoose.Types.ObjectId;
  inviteToken?: string;
  inviteExpires?: Date;
  acceptedAt?: Date;
  status: 'invited' | 'active' | 'removed';
  createdAt: Date;
  updatedAt: Date;
}

const firmMemberSchema = new Schema<IFirmMember>(
  {
    firmId: { type: Schema.Types.ObjectId, ref: 'Firm', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    professionalProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'ProfessionalProfile',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
    },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    inviteToken: { type: String, select: false },
    inviteExpires: { type: Date },
    acceptedAt: { type: Date },
    status: {
      type: String,
      enum: ['invited', 'active', 'removed'],
      default: 'invited',
    },
  },
  { timestamps: true }
);

firmMemberSchema.index({ firmId: 1, userId: 1 }, { unique: true });
firmMemberSchema.index({ inviteToken: 1 });

export default mongoose.model<IFirmMember>('FirmMember', firmMemberSchema);