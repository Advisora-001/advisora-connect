import { Router } from 'express';
import { protect } from '../middleware/auth';
import { upload } from '../config/cloudinary';
import { uploadDocument, listDocuments, shareDocument } from '../controllers/documentController';

const router = Router();

router.post('/', protect, upload.single('file'), uploadDocument);
router.get('/', protect, listDocuments);
router.post('/:id/share', protect, shareDocument);

export default router;
