import { Router } from 'express';
import * as academicController from '../../controllers/academic-reference.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();

router.use(authenticate, requireRole('admin', 'teacher', 'student'));

router.get('/faculty', academicController.getFaculty);
router.get('/representatives', academicController.getRepresentatives);

export default router;
