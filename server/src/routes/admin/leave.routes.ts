import { Router } from 'express';
import * as leaveController from '../../controllers/leave.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();

router.use(authenticate, requireRole('admin', 'teacher'));
router.get('/', leaveController.listInbox);
router.patch('/:id', leaveController.review);

export default router;
