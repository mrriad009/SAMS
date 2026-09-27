import type { Request, Response } from 'express';
import * as alertService from '../services/alert.service.js';
import { getStaffScope } from '../services/teacher.service.js';
import { sendSuccess } from '../utils/response.js';

export async function getPreferences(req: Request, res: Response) {
  const prefs = await alertService.getPreferences(req.user!.userId);
  return sendSuccess(res, prefs);
}

export async function updatePreferences(req: Request, res: Response) {
  const saved = await alertService.savePreferences(req.user!.userId, req.body);
  return sendSuccess(res, saved, 'Alert preferences saved');
}

export async function vapidPublicKey(_req: Request, res: Response) {
  return sendSuccess(res, { publicKey: alertService.getVapidPublicKey() });
}

export async function subscribePush(req: Request, res: Response) {
  const subscription = req.body as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
  if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys.auth) {
    return res.status(400).json({ success: false, message: 'A push subscription is required' });
  }
  const saved = await alertService.savePushSubscription(req.user!.userId, {
    endpoint: subscription.endpoint,
    keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
  });
  return sendSuccess(res, saved, 'Push alerts enabled', 201);
}

export async function unsubscribePush(req: Request, res: Response) {
  const endpoint = String(req.body.endpoint || '');
  if (!endpoint) return res.status(400).json({ success: false, message: 'Endpoint is required' });
  await alertService.removePushSubscription(req.user!.userId, endpoint);
  return sendSuccess(res, { removed: true }, 'Push alerts disabled');
}

export async function sendWeekly(req: Request, res: Response) {
  const scope: { department?: string; section?: string; semester?: number } = {};
  if (req.user?.role === 'teacher') {
    const staff = await getStaffScope(req.user.userId);
    scope.department = staff.department;
    scope.section = staff.section || undefined;
    if (staff.semester != null) scope.semester = staff.semester;
  } else if (req.query.department) {
    scope.department = String(req.query.department);
  }
  const result = await alertService.sendWeeklyDefaulterAlerts(scope);
  return sendSuccess(res, result, 'Defaulter alerts sent');
}
