import mongoose, { Document, Schema } from 'mongoose';

export interface IProfessionalCategory extends Document {
  key: string;
  label: string;
  description?: string;
  isActive: boolean;
  specializations: string[];
  registrationFields: {
    name: string;
    type: 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'file';
    required: boolean;
    options?: string[];
  }[];
  verificationRequirements: {
    requiredDocs: string[];
    criteria: string[];
  };
  serviceTypes: string[];
  consultationModes: ('video' | 'audio' | 'in-person')[];
  createdAt: Date;
  updatedAt: Date;
}

const professionalCategorySchema = new Schema<IProfessionalCategory>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    specializations: [{ type: String, default: [] }],
    registrationFields: [
      {
        name: { type: String, required: true },
        type: {
          type: String,
          enum: ['text', 'number', 'select', 'multiselect', 'date', 'file'],
          required: true,
        },
        required: { type: Boolean, default: false },
        options: [{ type: String }],
      },
    ],
    verificationRequirements: {
      requiredDocs: [{ type: String, default: [] }],
      criteria: [{ type: String, default: [] }],
    },
    serviceTypes: [{ type: String, default: [] }],
    consultationModes: [
      {
        type: String,
        enum: ['video', 'audio', 'in-person'],
        default: ['video'],
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IProfessionalCategory>('ProfessionalCategory', professionalCategorySchema);