import { v2 as cloudinary, UploadApiOptions } from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const configureCloudinary = (): void => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

configureCloudinary();

const upload = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: (): UploadApiOptions => ({ folder: 'advisora/uploads' }),
  }),
});

const blogImageUpload = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: (): UploadApiOptions => ({
      folder: 'advisora/blog',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    }),
  }),
});

export { cloudinary };
export default configureCloudinary;
export { upload, blogImageUpload };

