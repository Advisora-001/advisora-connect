import { Response } from 'express';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/auth';

// @desc    Get user's notifications (most recent 50)
// @route   GET /api/notifications
const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await Notification.find({ userId: req.user?._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ userId: req.user?._id, read: false });

    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark notifications as read
// @route   PUT /api/notifications/mark-read
const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { ids } = req.body;
    if (ids && ids.length > 0) {
      await Notification.updateMany(
        { _id: { $in: ids }, userId: req.user?._id },
        { read: true }
      );
    } else {
      // Mark all as read
      await Notification.updateMany(
        { userId: req.user?._id, read: false },
        { read: true }
      );
    }

    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper to create notifications from anywhere
export const createNotification = async (
  userId: string,
  type: string,
  title: string,
  message: string,
  link?: string
) => {
  try {
    await Notification.create({ userId, type, title, message, link: link || '' });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

export { getNotifications, markAsRead };
