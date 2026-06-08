import { Router } from 'express';
import * as courseController from '../../controllers/course.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireAdmin, requireRole } from '../../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', requireRole('admin', 'teacher'), courseController.listCourses);
router.get('/:id/students', requireRole('admin', 'teacher'), courseController.getEnrolledStudents);
router.post('/', requireAdmin, courseController.createCourse);
router.post('/:id/enroll', requireAdmin, courseController.enrollStudents);
router.patch('/:id', requireAdmin, courseController.updateCourse);
router.delete('/:id', requireAdmin, courseController.deleteCourse);

export default router;
