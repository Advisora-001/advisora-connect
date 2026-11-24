import { v2 as cloudinary } from 'cloudinary';
import { diskStorage } from 'multer';

const configureCloudinary = (): void => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

configureCloudinary();

// Cloudinary upload function for single file
const upload = (fieldName: string, ...args: any[]) => {
  // This is a wrapper for Cloudinary's uploader
  // In practice, this would be configured with diskStorage or memoryStorage
  // and integrated with multer for Express
  return cloudinary.uploader.upload;
};

// Cloudinary upload function for array of files
const uploadArray = (fieldName: string, ...args: any[]) => {
  return cloudinary.uploader.upload;
};

// blogImageUpload for blog posts
const blogImageUpload = (...args: any[]) => {
  return cloudinary.uploader.upload;
};

export { cloudinary };
export default configureCloudinary;
export { upload, blogImageUpload };

