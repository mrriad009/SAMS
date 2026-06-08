import { Router } from 'express';
import * as announcementController from '../../controllers/announcement.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireAdmin, requireRole } from '../../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', requireRole('admin', 'teacher'), announcementController.listAnnouncements);
router.post('/', requireRole('admin', 'teacher'), announcementController.createAnnouncement);
router.patch('/:id', requireAdmin, announcementController.updateAnnouncement);
router.delete('/:id', requireAdmin, announcementController.deleteAnnouncement);

export default router;
