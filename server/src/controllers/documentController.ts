import { Response } from 'express';
import mongoose from 'mongoose';
import Document from '../models/Document';
import { AuthRequest } from '../middleware/auth';

// @desc    Upload a document to Cloudinary
// @route   POST /api/documents
const uploadDocument = async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file as Express.Multer.File | undefined;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const doc = await Document.create({
      uploadedBy: req.user?._id,
      fileName: file.originalname,
      cloudinaryUrl: (file as any).path,
      fileType: file.mimetype,
      fileSize: file.size,
      accessPermissions: [req.user?._id],
    });

    res.status(201).json({ message: 'Document uploaded', document: doc });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: (error as Error).message });
  }
};

// @desc    List documents visible to the current user
// @route   GET /api/documents
const listDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const docs = await Document.find({
      $or: [
        { uploadedBy: req.user?._id },
        { accessPermissions: req.user?._id },
      ],
    }).sort({ createdAt: -1 });

    res.json({ count: docs.length, documents: docs });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Share a document with another user
// @route   POST /api/documents/:id/share
const shareDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'A valid userId is required' });
    }

    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (String(doc.uploadedBy) !== String(req.user?._id)) {
      return res.status(403).json({ message: 'Not authorized to share this document' });
    }

    const alreadyShared = doc.accessPermissions.some(
      (id) => String(id) === String(userId)
    );
    if (!alreadyShared) {
      doc.accessPermissions.push(new mongoose.Types.ObjectId(userId));
    }
    doc.auditLog.push({
      action: 'shared',
      userId: req.user?._id as mongoose.Types.ObjectId,
      timestamp: new Date(),
    });
    await doc.save();

    res.json({ message: 'Document shared', document: doc });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export { uploadDocument, listDocuments, shareDocument };
