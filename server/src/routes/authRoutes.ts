import { Router } from 'express';
import {
  register,
  login,
  refresh,
  getMe,
  verifyEmail,
  resendVerification,
  logout,
  forgotPassword,
  resetPassword,
} from '../controllers/authController';
import { protect } from '../middleware/auth';
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from '../middleware/validate';

const router = Router();

router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);
router.post('/refresh', refresh);
router.get('/me', protect, getMe);
router.get('/verify-email', verifyEmail);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPasswordValidator, forgotPassword);
router.post('/reset-password', resetPasswordValidator, resetPassword);
router.post('/logout', protect, logout);

export default router;
