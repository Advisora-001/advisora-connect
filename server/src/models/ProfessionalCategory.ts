import mongoose, { Document, Schema } from 'mongoose';

export interface IProfessionalCategory extends Document {
  key: string;
  label: string;
  pluralLabel: string;
  description: string;
  isActive: boolean;
  registrationFields: Array<{ key: string; label: string; required: boolean; type: 'text' | 'number' | 'date' | 'select'; options: string[] }>;
  verificationRequirements: Array<{ key: string; label: string; required: boolean; acceptedDocumentTypes: string[] }>;
  specializations: string[];
  serviceTypes: string[];
  consultationOptions: string[];
}

const fieldSchema = new Schema(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    required: { type: Boolean, default: false },
    type: { type: String, enum: ['text', 'number', 'date', 'select'], default: 'text' },
    options: [{ type: String, trim: true }],
  },
  { _id: false }
);

const verificationRequirementSchema = new Schema(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    required: { type: Boolean, default: true },
    acceptedDocumentTypes: [{ type: String, trim: true }],
  },
  { _id: false }
);

const professionalCategorySchema = new Schema<IProfessionalCategory>(
  {
    key: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[a-z0-9-]+$/ },
    label: { type: String, required: true, trim: true, maxlength: 100 },
    pluralLabel: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, default: '', maxlength: 500 },
    isActive: { type: Boolean, default: true },
    registrationFields: { type: [fieldSchema], default: [] },
    verificationRequirements: { type: [verificationRequirementSchema], default: [] },
    specializations: [{ type: String, trim: true }],
    serviceTypes: [{ type: String, trim: true }],
    consultationOptions: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

export default mongoose.model<IProfessionalCategory>('ProfessionalCategory', professionalCategorySchema);
