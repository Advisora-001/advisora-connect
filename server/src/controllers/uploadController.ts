import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getCloudinaryService, UPLOAD_PRESETS, UploadPresetKey, TransformationOptions } from '../services/cloudinary';
import ProfessionalProfile from '../models/ProfessionalProfile';
import Lead from '../models/Lead';

/**
 * Get signed upload URL for direct-to-Cloudinary upload
 * @route POST /api/uploads/signed-url
 * @access Private
 */
export const getSignedUploadUrl = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { preset, folder, transformations } = req.body;

    if (!preset || !Object.keys(require('../services/cloudinary').UPLOAD_PRESETS).includes(preset)) {
      return res.status(400).json({ message: 'Invalid upload preset' });
    }

    if (!folder) {
      return res.status(400).json({ message: 'Folder is required' });
    }

    // Validate user has access to this folder/preset
    const allowedPresets: Record<string, UploadPresetKey[]> = {
      client: ['profile_photo'],
      lawyer: ['verification', 'profile_photo'],
      professional: ['verification', 'profile_photo'],
      admin: ['verification', 'profile_photo', 'document', 'blog_media'],
    };

    const userPresets = allowedPresets[user.role] || [];
    if (!userPresets.includes(preset as UploadPresetKey)) {
      return res.status(403).json({ message: 'Not authorized for this upload type' });
    }

    // Build folder path with user context
    const fullFolder = `advisora/${folder}/${user._id}`;

    // Default transformations based on preset
    const defaultTransformations: Record<string, TransformationOptions> = {
      profile_photo: { width: 800, height: 800, crop: 'limit', quality: 'auto:good', format: 'auto', gravity: 'face' },
      verification: { width: 1200, height: 1600, crop: 'limit', quality: 'auto:good', format: 'auto' },
      document: { quality: 'auto:good', fetch_format: 'auto' },
      blog_media: { width: 1920, height: 1080, crop: 'limit', quality: 'auto:good', format: 'auto' },
    };

    const cloudinary = require('../services/cloudinary').getCloudinaryService();
    const signedUrl = await cloudinary.getSignedUploadUrl(
      preset as keyof typeof UPLOAD_PRESETS,
      fullFolder,
      req.body.transformations || defaultTransformations[preset]
    );

    res.json({
      ...signedUrl,
      uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/upload`,
    });
  } catch (error: any) {
    console.error('Get signed upload URL error:', error);
    res.status(500).json({
      message: 'Failed to generate signed upload URL',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Verify upload completed successfully
 * @route POST /api/uploads/verify
 * @access Private
 */
export const verifyUpload = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { publicId } = req.body;
    if (!publicId) {
      return res.status(400).json({ message: 'Public ID is required' });
    }

    const cloudinary = require('../services/cloudinary').getCloudinaryService();
    const verification = await cloudinary.verifyUpload(publicId);

    if (!verification) {
      return res.status(404).json({ message: 'Upload not found or not completed' });
    }

    res.json({
      verified: true,
      publicId: verification.public_id,
      url: verification.secure_url,
      format: verification.format,
      width: verification.width,
      height: verification.height,
      size: verification.bytes,
    });
  } catch (error: any) {
    console.error('Verify upload error:', error);
    res.status(500).json({
      message: 'Failed to verify upload',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Delete an upload
 * @route DELETE /api/uploads/:publicId
 * @access Private
 */
export const deleteUpload = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { publicId } = req.params;
    if (!publicId) {
      return res.status(400).json({ message: 'Public ID is required' });
    }

    const cloudinary = require('../services/cloudinary').getCloudinaryService();
    const success = await cloudinary.deleteUpload(publicId);

    if (!success) {
      return res.status(404).json({ message: 'Upload not found or already deleted' });
    }

    res.json({ message: 'Upload deleted successfully' });
  } catch (error: any) {
    console.error('Delete upload error:', error);
    res.status(500).json({
      message: 'Failed to delete upload',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get signed upload URLs for verification documents
 * @route POST /api/uploads/verification/urls
 * @access Private (Professional only)
 */
export const getVerificationUploadUrls = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || (user.role !== 'lawyer' && user.role !== 'professional')) {
      return res.status(403).json({ message: 'Only professionals can upload verification documents' });
    }

    const { requiredDocuments } = req.body;
    if (!requiredDocuments || !Array.isArray(requiredDocuments)) {
      return res.status(400).json({ message: 'Required documents array is required' });
    }

    const cloudinary = require('../services/cloudinary').getCloudinaryService();
    const urls = await Promise.all(
      requiredDocuments.map(async (docType: string) => {
        const signedUrl = await cloudinary.getSignedUploadUrl(
          'verification',
          `advisora/verification/${req.user!._id}`,
          { width: 1200, height: 1600, crop: 'limit', quality: 'auto:good', format: 'auto' }
        );
        return { documentType: docType, ...signedUrl };
      })
    );

    res.json({ urls });
  } catch (error: any) {
    console.error('Get verification upload URLs error:', error);
    res.status(500).json({
      message: 'Failed to generate verification upload URLs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Complete verification document submission
 * @route POST /api/professionals/verification/submit
 * @access Private (Professional only)
 */
export const submitVerification = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || (user.role !== 'lawyer' && user.role !== 'professional')) {
      return res.status(403).json({ message: 'Only professionals can submit verification' });
    }

    const { documents, category, specialization, categoryData, declaration } = req.body;

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({ message: 'At least one verification document is required' });
    }

    if (!category) {
      return res.status(400).json({ message: 'Professional category is required' });
    }

    if (!declaration || !declaration.informationAccurate || !declaration.qualifiedToPractise || !declaration.noDisciplinaryAction) {
      return res.status(400).json({ message: 'All declaration fields must be accepted' });
    }

    // Verify all documents exist in Cloudinary
    const cloudinary = require('../services/cloudinary').getCloudinaryService();
    for (const doc of documents) {
      const verification = await cloudinary.verifyUpload(doc.publicId);
      if (!verification) {
        return res.status(400).json({ message: `Document ${doc.publicId} not found or not verified` });
      }
      // Add Cloudinary URL to document
      doc.url = verification.secure_url;
      doc.format = verification.format;
      doc.size = verification.bytes;
    }

    // Update professional profile
    const profile = await ProfessionalProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        $set: {
          category,
          specialization,
          categoryData,
          verificationStatus: 'pending',
          verificationDocs: documents.map(d => d.url),
          declaration: {
            informationAccurate: declaration.informationAccurate,
            qualifiedToPractise: declaration.qualifiedToPractise,
            noDisciplinaryAction: declaration.noDisciplinaryAction,
            declaredAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ message: 'Professional profile not found' });
    }

    // Notify admin
    try {
      const adminUsers = await require('../models/User').default.find({ role: 'admin' });
      for (const admin of adminUsers) {
        await require('../controllers/notificationController').createNotification(
          admin._id.toString(),
          'verification_submitted',
          'New Verification Submission',
          `Professional ${user.firstName} ${user.lastName} submitted verification documents`,
          '/admin'
        );
      }
    } catch (notifyErr) {
      console.error('Failed to notify admin:', notifyErr);
    }

    res.json({
      message: 'Verification submitted successfully. Our team will review within 24-48 hours.',
      profile: {
        verificationStatus: profile.verificationStatus,
        verificationDocs: profile.verificationDocs,
      },
    });
  } catch (error: any) {
    console.error('Submit verification error:', error);
    res.status(500).json({
      message: 'Failed to submit verification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get verification status
 * @route GET /api/professionals/verification/status
 * @access Private (Professional only)
 */
export const getVerificationStatus = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || (user.role !== 'lawyer' && user.role !== 'professional')) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const profile = await ProfessionalProfile.findOne({ userId: req.user._id }).select(
      'verificationStatus verificationDocs verificationBadge verificationDocs category specialization'
    );

    if (!profile) {
      return res.status(404).json({ message: 'Professional profile not found' });
    }

    res.json({
      verificationStatus: profile.verificationStatus,
      verificationBadge: profile.verificationBadge,
      verificationDocs: profile.verificationDocs,
      category: profile.category,
      specialization: profile.specialization,
    });
  } catch (error: any) {
    console.error('Get verification status error:', error);
    res.status(500).json({
      message: 'Failed to fetch verification status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};