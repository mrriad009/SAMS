import { Router } from 'express';
import * as profileController from '../../controllers/profile.controller.js';
import * as courseController from '../../controllers/course.controller.js';
import * as attendanceController from '../../controllers/attendance.controller.js';
import * as announcementController from '../../controllers/announcement.controller.js';
import * as routineController from '../../controllers/routine.controller.js';
import * as notificationController from '../../controllers/notification.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();

router.use(authenticate, requireRole('student'));

router.get('/profile', profileController.getProfile);
router.patch('/profile', profileController.updateContact);
router.post('/profile/avatar', profileController.avatarUpload, profileController.uploadAvatar);
router.get('/courses', courseController.getStudentCourses);
router.get('/courses/available', courseController.getAvailableCourses);
router.get('/courses/retake-available', courseController.getRetakeAvailableCourses);
router.post('/courses/:id/enroll', courseController.enrollInCourse);
router.delete('/courses/:id/enroll', courseController.unenrollFromCourse);
router.get('/attendance', attendanceController.getStudentAttendance);
router.get('/attendance/summary', attendanceController.getStudentSummary);
router.get('/announcements', announcementController.getStudentAnnouncements);
router.get('/routine', routineController.getStudentRoutine);
router.get('/notifications', notificationController.getNotifications);
router.get('/notifications/unread-count', notificationController.getUnreadCount);
router.patch('/notifications/:id/read', notificationController.markRead);
router.patch('/notifications/read-all', notificationController.markAllRead);

export default router;
