import { Router } from 'express';
import * as teacherController from '../../controllers/teacher.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();

router.use(authenticate, requireRole('teacher'));

router.get('/dashboard', teacherController.getDashboard);
router.get('/profile', teacherController.getProfile);

export default router;
