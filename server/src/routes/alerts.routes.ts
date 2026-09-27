import { Router } from 'express';
import * as alertController from '../controllers/alert.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);
router.get('/preferences', alertController.getPreferences);
router.patch('/preferences', alertController.updatePreferences);
router.get('/vapid-public-key', alertController.vapidPublicKey);
router.post('/push-subscription', alertController.subscribePush);
router.delete('/push-subscription', alertController.unsubscribePush);
router.post('/weekly-defaulters', requireRole('admin', 'teacher'), alertController.sendWeekly);

export default router;
