import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import * as publicController from '../controllers/public.controller.js';

const router = Router();

const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.isProduction ? 30 : 1000,
  skip: () => !env.isProduction,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/config', publicLimiter, publicController.getAppConfig);
router.get('/students/:studentId', publicLimiter, publicController.getStudentProfile);

export default router;
