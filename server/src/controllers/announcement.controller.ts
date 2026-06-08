import type { Request, Response } from 'express';
import { z } from 'zod';
import * as announcementService from '../services/announcement.service.js';
import { getStaffScope } from '../services/teacher.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { paramId } from '../utils/params.js';

const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  targetAudience: z.enum(['all', 'department', 'section']).optional(),
  department: z.string().optional(),
  section: z.string().optional(),
  isPinned: z.boolean().optional(),
});

async function resolveCreatePayload(req: Request) {
  const parsed = createAnnouncementSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  let payload = {
    title: parsed.data.title.trim(),
    content: parsed.data.content.trim(),
    targetAudience: parsed.data.targetAudience ?? ('all' as const),
    department: parsed.data.department,
    section: parsed.data.section,
    isPinned: parsed.data.isPinned ?? false,
  };

  if (req.user?.role === 'teacher') {
    const scope = await getStaffScope(req.user.userId);
    payload = {
      ...payload,
      targetAudience: 'section',
      department: scope.department,
      section: scope.section ?? payload.section,
      isPinned: false,
    };
  }

  if (payload.targetAudience === 'section' && !payload.section) {
    throw new Error('Section is required for section announcements');
  }

  return payload;
}

export async function listAnnouncements(_req: Request, res: Response) {
  const items = await announcementService.listAnnouncements();
  return sendSuccess(res, items);
}

export async function createAnnouncement(req: Request, res: Response) {
  try {
    const payload = await resolveCreatePayload(req);
    const item = await announcementService.createAnnouncement({
      ...payload,
      authorId: req.user!.userId,
    });
    return sendSuccess(res, item, 'Announcement created', 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return sendError(res, error.errors[0]?.message || 'Invalid announcement', 400);
    }
    if (error instanceof Error) {
      return sendError(res, error.message, 400);
    }
    throw error;
  }
}

export async function updateAnnouncement(req: Request, res: Response) {
  const item = await announcementService.updateAnnouncement(paramId(req.params.id), req.body);
  return sendSuccess(res, item, 'Announcement updated');
}

export async function deleteAnnouncement(req: Request, res: Response) {
  await announcementService.deleteAnnouncement(paramId(req.params.id));
  return sendSuccess(res, null, 'Announcement deleted');
}

export async function getStudentAnnouncements(req: Request, res: Response) {
  const items = await announcementService.getStudentAnnouncements(req.user!.userId);
  return sendSuccess(res, items);
}
