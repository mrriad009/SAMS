import { Router } from 'express';
import * as reportController from '../../controllers/report.controller.js';
import * as attendanceController from '../../controllers/attendance.controller.js';
import * as profileController from '../../controllers/profile.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireAdmin, requireRole } from '../../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/attendance', requireRole('admin', 'teacher'), reportController.getReport);
router.get('/dashboard', requireRole('admin', 'teacher'), attendanceController.getDashboardStats);
router.get('/trend', requireRole('admin', 'teacher'), attendanceController.getTrend);
router.get('/low-attendance', requireRole('admin', 'teacher'), attendanceController.getLowAttendance);
router.get('/today-sessions', requireRole('admin', 'teacher'), attendanceController.getTodaySessions);
router.get('/settings', requireRole('admin', 'teacher'), profileController.getSettings);
router.patch('/settings', requireAdmin, profileController.updateSettings);
router.patch('/profile', requireAdmin, profileController.updateAdminProfile);

export default router;
