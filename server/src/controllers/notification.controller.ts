import type { Request, Response } from 'express';
import * as notificationService from '../services/notification.service.js';
import { sendSuccess } from '../utils/response.js';
import { paramId } from '../utils/params.js';

export async function getNotifications(req: Request, res: Response) {
  const unreadOnly = req.query.unread === 'true';
  const notifications = await notificationService.getUserNotifications(
    req.user!.userId,
    unreadOnly
  );
  return sendSuccess(res, notifications);
}

export async function markRead(req: Request, res: Response) {
  const notification = await notificationService.markAsRead(paramId(req.params.id), req.user!.userId);
  return sendSuccess(res, notification);
}

export async function markAllRead(req: Request, res: Response) {
  await notificationService.markAllAsRead(req.user!.userId);
  return sendSuccess(res, null, 'All notifications marked as read');
}

export async function getUnreadCount(req: Request, res: Response) {
  const count = await notificationService.getUnreadCount(req.user!.userId);
  return sendSuccess(res, { count });
}
