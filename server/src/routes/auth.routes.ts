import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import * as authController from '../controllers/auth.controller.js';
import * as profileController from '../controllers/profile.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

const rateLimitMessage = { success: false, message: 'Too many requests, please try again later' };

/** Login / register / password reset — strict in production, off in local dev */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.isProduction ? 20 : 1000,
  skip: () => !env.isProduction,
  message: rateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
});

/** Token refresh — separate bucket so retries do not block login */
const refreshLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.isProduction ? 60 : 1000,
  skip: () => !env.isProduction,
  message: rateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, authController.register);
router.post('/register-student', authLimiter, profileController.registerStudent);
router.post('/login', authLimiter, authController.login);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh-token', refreshLimiter, authController.refreshToken);
router.get('/me', authenticate, authController.me);
router.patch('/change-password', authenticate, authController.changePassword);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);

export default router;
