import mongoose, { Document, Schema } from 'mongoose';

export interface IAppointment extends Document {
  lawyerId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  leadId?: mongoose.Types.ObjectId;
  date: Date;
  timeSlot: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  consultationType: 'video' | 'physical' | 'phone';
  meetingLink?: string;
  notes?: string;
  consultationFee: number;
  platformFee: number;
  totalAmount: number;
  paymentRef?: string;
  paymentStatus: 'unpaid' | 'paid' | 'failed';
  createdAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    lawyerId: { type: Schema.Types.ObjectId, ref: 'LawyerProfile', required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    duration: { type: Number, default: 30 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    consultationType: {
      type: String,
      enum: ['video', 'physical', 'phone'],
      default: 'video',
    },
    meetingLink: { type: String },
    notes: { type: String },
    consultationFee: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    paymentRef: { type: String },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'failed'],
      default: 'unpaid',
    },
  },
  { timestamps: true }
);

export default mongoose.model<IAppointment>('Appointment', appointmentSchema);