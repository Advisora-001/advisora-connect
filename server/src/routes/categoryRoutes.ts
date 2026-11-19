import { Router } from 'express';
import { getCategories, getAdminCategories, getCategoryByKey } from '../controllers/categoryController';
import { createCategory, updateCategory, deleteCategory } from '../controllers/categoryController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getCategories);
router.get('/admin', protect, authorize('admin'), getAdminCategories);
router.get('/:key', getCategoryByKey);

// Admin routes
router.use(protect, authorize('admin'));
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;