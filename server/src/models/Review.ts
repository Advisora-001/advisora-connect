import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  lawyerId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    lawyerId: { type: Schema.Types.ObjectId, ref: 'LawyerProfile', required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

export default mongoose.model<IReview>('Review', reviewSchema);