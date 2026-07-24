import { Router } from 'express';
import { getNotifications, markAsRead } from '../controllers/notificationController';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/', protect, getNotifications);
router.put('/mark-read', protect, markAsRead);

export default router;
