import { Router } from 'express';
import * as attendanceController from '../../controllers/attendance.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', requireRole('admin', 'teacher'), attendanceController.listSessions);
router.post('/', requireRole('admin', 'teacher'), attendanceController.createSession);
router.get('/:id/attendance', requireRole('admin', 'teacher'), attendanceController.getSessionAttendance);
router.post('/:id/attendance', requireRole('admin', 'teacher'), attendanceController.submitAttendance);

export default router;
