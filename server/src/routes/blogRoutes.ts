import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import {
  getPublishedPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  getAllPosts,
} from '../controllers/blogController';
import { blogImageUpload } from '../config/cloudinary';

const router = Router();

router.get('/admin/all', protect, authorize('admin'), getAllPosts);
router.post('/admin', protect, authorize('admin'), blogImageUpload.array('images', 10), createPost);
router.put('/admin/:id', protect, authorize('admin'), updatePost);
router.delete('/admin/:id', protect, authorize('admin'), deletePost);
router.get('/:slug', getPostBySlug);
router.get('/', getPublishedPosts);

export default router;
