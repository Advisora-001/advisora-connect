import { Request, Response } from 'express';
import LegalDocument from '../models/LegalDocument';
import LegalAcceptance from '../models/LegalAcceptance';
import { AuthRequest } from '../middleware/auth';

// @desc    Get all active legal documents (public)
// @route   GET /api/legal
const getActiveDocuments = async (_req: Request, res: Response) => {
  try {
    const documents = await LegalDocument.find({ isActive: true })
      .select('slug title version effectiveDate')
      .sort({ effectiveDate: -1 });

    res.json({ count: documents.length, documents });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get a single legal document by slug (public)
// @route   GET /api/legal/:slug
const getDocumentBySlug = async (req: Request, res: Response) => {
  try {
    const document = await LegalDocument.findOne({
      slug: req.params.slug,
      isActive: true,
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Accept a legal document (authenticated)
// @route   POST /api/legal/:slug/accept
const acceptDocument = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const document = await LegalDocument.findOne({
      slug: req.params.slug,
      isActive: true,
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Upsert acceptance
    await LegalAcceptance.findOneAndUpdate(
      { userId: user._id, documentId: document._id },
      {
        userId: user._id,
        documentId: document._id,
        slug: document.slug,
        version: document.version,
        acceptedAt: new Date(),
        ipAddress: req.ip || req.socket?.remoteAddress,
      },
      { upsert: true, new: true }
    );

    res.json({ message: 'Document accepted', slug: document.slug, version: document.version });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Check which documents a user has accepted
// @route   GET /api/legal/acceptances/mine
const getMyAcceptances = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const acceptances = await LegalAcceptance.find({ userId: user._id })
      .populate('documentId', 'slug title version')
      .sort({ acceptedAt: -1 });

    res.json({ count: acceptances.length, acceptances });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Check if user has accepted all required documents
// @route   GET /api/legal/acceptances/status
const getAcceptanceStatus = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const activeDocuments = await LegalDocument.find({ isActive: true }).select('_id slug version');
    const acceptances = await LegalAcceptance.find({ userId: user._id }).select('documentId version');

    const status = activeDocuments.map((doc) => {
      const accepted = acceptances.find(
        (a) => a.documentId.toString() === doc._id.toString() && a.version === doc.version
      );
      return {
        slug: doc.slug,
        title: doc.title,
        version: doc.version,
        accepted: !!accepted,
      };
    });

    const allAccepted = status.every((s) => s.accepted);

    res.json({ allAccepted, documents: status });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin endpoints

// @desc    Create a new legal document (admin)
// @route   POST /api/legal/admin
const createDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { slug, title, content, version, effectiveDate } = req.body;

    const existing = await LegalDocument.findOne({ slug });
    if (existing) {
      return res.status(400).json({ message: 'Document with this slug already exists' });
    }

    const document = await LegalDocument.create({
      slug,
      title,
      content,
      version: version || '1.0',
      effectiveDate: effectiveDate || new Date(),
    });

    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a legal document (admin)
// @route   PUT /api/legal/admin/:id
const updateDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, version, effectiveDate, isActive } = req.body;

    const document = await LegalDocument.findByIdAndUpdate(
      req.params.id,
      { title, content, version, effectiveDate, isActive },
      { new: true, runValidators: true }
    );

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all documents (admin, including inactive)
// @route   GET /api/legal/admin
const getAllDocuments = async (_req: AuthRequest, res: Response) => {
  try {
    const documents = await LegalDocument.find().sort({ createdAt: -1 });
    res.json({ count: documents.length, documents });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get acceptance statistics (admin)
// @route   GET /api/legal/admin/acceptance-stats
const getAcceptanceStats = async (_req: AuthRequest, res: Response) => {
  try {
    const activeDocuments = await LegalDocument.find({ isActive: true });
    const User = (await import('../models/User')).default;
    const totalUsers = await User.countDocuments({ isActive: true });

    const stats = await Promise.all(
      activeDocuments.map(async (doc) => {
        const acceptedCount = await LegalAcceptance.countDocuments({
          documentId: doc._id,
          version: doc.version,
        });
        return {
          slug: doc.slug,
          title: doc.title,
          version: doc.version,
          acceptedCount,
          totalUsers,
          acceptanceRate: totalUsers > 0 ? Math.round((acceptedCount / totalUsers) * 100) : 0,
        };
      })
    );

    res.json({ stats });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export {
  getActiveDocuments,
  getDocumentBySlug,
  acceptDocument,
  getMyAcceptances,
  getAcceptanceStatus,
  createDocument,
  updateDocument,
  getAllDocuments,
  getAcceptanceStats,
};