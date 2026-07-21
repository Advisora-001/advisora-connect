import { Router } from 'express';
import { createReview, getLawyerReviews, getMyReviews } from '../controllers/reviewController';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/', protect, createReview);
router.get('/lawyer/:id', getLawyerReviews);
router.get('/mine', protect, getMyReviews);

export default router;