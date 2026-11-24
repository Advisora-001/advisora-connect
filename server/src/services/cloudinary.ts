import { v2 as cloudinary } from 'cloudinary';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Upload presets (must be created in Cloudinary Dashboard)
export const UPLOAD_PRESETS = {
  verification: 'advisora_verification',
  profile_photo: 'advisora_profile',
  document: 'advisora_document',
  blog_media: 'advisora_blog',
} as const;

export type UploadPresetKey = keyof typeof UPLOAD_PRESETS;

export interface SignedUploadUrlResponse {
  signature: string;
  timestamp: number;
  api_key: string;
  cloud_name: string;
  preset: string;
  folder: string;
}

export interface UploadVerification {
  public_id: string;
  secure_url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  resource_type: 'image' | 'video' | 'raw';
}

export interface TransformationOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'limit' | 'scale' | 'thumb';
  quality?: 'auto' | 'auto:good' | 'auto:eco' | 'auto:low' | number;
  format?: 'auto' | 'jpg' | 'png' | 'webp' | 'pdf';
  gravity?: 'auto' | 'face' | 'center';
  flags?: string[];
  fetch_format?: 'auto' | 'jpg' | 'png' | 'webp' | 'pdf';
}

export class CloudinaryService {
  /**
   * Generate a signed upload URL for direct-to-Cloudinary uploads
   * This allows frontend to upload directly without backend bandwidth
   */
  async getSignedUploadUrl(
    preset: UploadPresetKey,
    folder: string,
    transformations?: TransformationOptions
  ): Promise<SignedUploadUrlResponse> {
    const timestamp = Math.round(Date.now() / 1000);
    const presetName = UPLOAD_PRESETS[preset];

    // Build parameters to sign
    const paramsToSign: Record<string, unknown> = {
      timestamp,
      upload_preset: presetName,
      folder,
    };

    if (transformations) {
      const transformationString = this.buildTransformationString(transformations);
      if (transformationString) {
        paramsToSign.transformation = transformationString;
      }
    }

    // Generate signature
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!
    );

    return {
      signature,
      timestamp,
      api_key: process.env.CLOUDINARY_API_KEY!,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
      preset: presetName,
      folder,
    };
  }

  /**
   * Build transformation string for Cloudinary
   */
  private buildTransformationString(options: TransformationOptions): string {
    const parts: string[] = [];

    if (options.width) parts.push(`w_${options.width}`);
    if (options.height) parts.push(`h_${options.height}`);
    if (options.crop) parts.push(`c_${options.crop}`);
    if (options.quality) parts.push(`q_${options.quality}`);
    if (options.format) parts.push(`f_${options.format}`);
    if (options.gravity) parts.push(`g_${options.gravity}`);
    if (options.flags) parts.push(`fl_${options.flags.join('.')}`);

    return parts.join(',');
  }

  /**
   * Verify an upload by public_id
   */
  async verifyUpload(publicId: string): Promise<UploadVerification | null> {
    try {
      const result = await cloudinary.api.resource(publicId);
      return {
        public_id: result.public_id,
        secure_url: result.secure_url,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        resource_type: result.resource_type as 'image' | 'video' | 'raw',
      };
    } catch (error) {
      console.error('Cloudinary verify upload error:', error);
      return null;
    }
  }

  /**
   * Delete an upload by public_id
   */
  async deleteUpload(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<boolean> {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      return true;
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return false;
    }
  }

  /**
   * Get optimized delivery URL with transformations
   */
  getOptimizedUrl(publicId: string, transformations: TransformationOptions = {}): string {
    const defaultTransformations: TransformationOptions = {
      quality: 'auto:good',
      fetch_format: 'auto',
      ...transformations,
    };

    return cloudinary.url(publicId, {
      secure: true,
      transformation: defaultTransformations,
    });
  }

  /**
   * Generate signed URL for private/protected resources
   */
  getSignedUrl(publicId: string, expiresAt: Date, transformations?: TransformationOptions): string {
    const expires = Math.floor(expiresAt.getTime() / 1000);
    return cloudinary.url(publicId, {
      sign_url: true,
      expires_at: expires,
      transformation: transformations,
    });
  }

  /**
   * Upload a file from buffer (for server-side uploads)
   */
  async uploadBuffer(
    buffer: Buffer,
    options: {
      folder: string;
      resource_type?: 'image' | 'video' | 'raw' | 'auto';
      public_id?: string;
      tags?: string[];
      context?: Record<string, string>;
    }
  ): Promise<UploadVerification | null> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder,
          resource_type: options.resource_type || 'auto',
          public_id: options.public_id,
          tags: options.tags,
          context: options.context,
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }
          if (!result) {
            reject(new Error('Upload returned no result'));
            return;
          }
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            format: result.format,
            width: result.width || 0,
            height: result.height || 0,
            bytes: result.bytes,
            resource_type: result.resource_type as 'image' | 'video' | 'raw',
          });
        }
      );

      uploadStream.end(buffer);
    });
  }

  /**
   * Get resources in a folder (for listing/management)
   */
  async listResources(
    folder: string,
    options: {
      resource_type?: 'image' | 'video' | 'raw';
      max_results?: number;
      next_cursor?: string;
    } = {}
  ) {
    return cloudinary.api.resources({
      type: 'upload',
      prefix: folder,
      resource_type: options.resource_type || 'image',
      max_results: options.max_results || 50,
      next_cursor: options.next_cursor,
    });
  }
}

// Singleton instance
let cloudinaryInstance: CloudinaryService | null = null;

export function getCloudinaryService(): CloudinaryService {
  if (!cloudinaryInstance) {
    // Verify configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary configuration missing. Check environment variables.');
    }
    cloudinaryInstance = new CloudinaryService();
  }
  return cloudinaryInstance;
}