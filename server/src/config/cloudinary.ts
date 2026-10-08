import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

const configureCloudinary = (): void => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

const blogImageStorage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, file) => ({
    folder: 'advisora/blog',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`,
  }),
});

const upload = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: async (_req, file) => ({
      folder: 'advisora',
      allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
      public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`,
    }),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const blogImageUpload = multer({
  storage: blogImageStorage,
  limits: { fileSize: 8 * 1024 * 1024 },
});

export default configureCloudinary;
export { upload, blogImageUpload, cloudinary };

