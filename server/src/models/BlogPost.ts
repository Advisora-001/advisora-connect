import mongoose, { Document, Schema } from 'mongoose';

export type MediaType = 'image' | 'video';

export interface MediaItem {
  type: MediaType;
  url: string;
  publicId?: string;
  provider?: string;
  embedId?: string;
  caption?: string;
}

export interface IBlogPost extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  coverImage?: string;
  media: MediaItem[];
  isPublished: boolean;
  publishedAt?: Date;
  author: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const mediaSchema = new Schema<MediaItem>(
  {
    type: { type: String, enum: ['image', 'video'], required: true },
    url: { type: String, required: true },
    publicId: { type: String },
    provider: { type: String },
    embedId: { type: String },
    caption: { type: String },
  },
  { _id: false }
);

const blogPostSchema = new Schema<IBlogPost>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, required: true, trim: true },
    coverImage: { type: String },
    media: [mediaSchema],
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

blogPostSchema.pre('save', function (next) {
  if (!this.isPublished) {
    this.publishedAt = undefined;
  }
  next();
});

export default mongoose.model<IBlogPost>('BlogPost', blogPostSchema);
