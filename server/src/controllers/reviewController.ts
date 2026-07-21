import { Response } from 'express';
import Review from '../models/Review';
import LawyerProfile from '../models/LawyerProfile';
import Appointment from '../models/Appointment';
import { AuthRequest } from '../middleware/auth';

// @desc    Create a review (client only, must have completed appointment)
// @route   POST /api/reviews
const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const { lawyerId, rating, comment } = req.body;
    const clientId = req.user?._id;

    if (!lawyerId || !rating) {
      return res.status(400).json({ message: 'Lawyer ID and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if the lawyer profile exists
    const lawyer = await LawyerProfile.findById(lawyerId);
    if (!lawyer) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }

    // Check if client has a completed appointment with this lawyer
    const completedAppointment = await Appointment.findOne({
      clientId,
      lawyerId: lawyer.userId,
      status: 'confirmed',
      paymentStatus: 'paid',
    });

    if (!completedAppointment) {
      return res.status(403).json({ message: 'You can only review lawyers you have had a consultation with' });
    }

    // Check if client already reviewed this lawyer
    const existingReview = await Review.findOne({ lawyerId, clientId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this lawyer' });
    }

    const review = await Review.create({
      lawyerId,
      clientId,
      rating,
      comment: comment || '',
      status: 'approved', // Auto-approve for now
    });

    // Update lawyer's average rating
    const allReviews = await Review.find({ lawyerId, status: 'approved' });
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRating / allReviews.length;

    await LawyerProfile.findByIdAndUpdate(lawyerId, {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: allReviews.length,
    });

    // Populate client info for response
    const populated = await Review.findById(review._id)
      .populate('clientId', 'firstName lastName avatar');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Get reviews for a lawyer
// @route   GET /api/reviews/lawyer/:id
const getLawyerReviews = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ lawyerId: id, status: 'approved' })
      .populate('clientId', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ lawyerId: id, status: 'approved' });

    res.json({
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      averageRating: reviews.length > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
        : 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get client's own reviews
// @route   GET /api/reviews/mine
const getMyReviews = async (req: AuthRequest, res: Response) => {
  try {
    const reviews = await Review.find({ clientId: req.user?._id })
      .populate({
        path: 'lawyerId',
        populate: { path: 'userId', select: 'firstName lastName' },
      })
      .sort({ createdAt: -1 });

    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export { createReview, getLawyerReviews, getMyReviews };