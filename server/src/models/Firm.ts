import mongoose, { Document, Schema } from 'mongoose';

export type FirmMembershipStatus = 'invited' | 'active' | 'suspended';

export interface IFirm extends Document {
  name: string;
  type: 'individual-practice' | 'firm';
  ownerUserId: mongoose.Types.ObjectId;
  email: string;
  country: string;
  members: Array<{
    userId?: mongoose.Types.ObjectId;
    email: string;
    role: 'owner' | 'admin' | 'professional';
    status: FirmMembershipStatus;
    categories: string[];
    invitedAt: Date;
    joinedAt?: Date;
    inviteTokenHash?: string;
    inviteExpiresAt?: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const firmMemberSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ['owner', 'admin', 'professional'], default: 'professional' },
    status: { type: String, enum: ['invited', 'active', 'suspended'], default: 'invited' },
    categories: [{ type: String, trim: true }],
    invitedAt: { type: Date, default: Date.now },
    joinedAt: Date,
    inviteTokenHash: { type: String, select: false },
    inviteExpiresAt: Date,
  },
  { _id: false }
);

const firmSchema = new Schema<IFirm>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    type: { type: String, enum: ['individual-practice', 'firm'], default: 'firm' },
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    country: { type: String, default: 'Nigeria', trim: true },
    members: { type: [firmMemberSchema], default: [] },
  },
  { timestamps: true }
);

firmSchema.index({ ownerUserId: 1 });
firmSchema.index({ 'members.userId': 1 });
firmSchema.index({ 'members.email': 1 });

export default mongoose.model<IFirm>('Firm', firmSchema);
