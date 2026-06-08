import { Router } from 'express';
import * as attendanceController from '../../controllers/attendance.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();

router.use(authenticate, requireRole('admin', 'teacher'));

router.patch('/:id', attendanceController.updateAttendance);

export default router;
