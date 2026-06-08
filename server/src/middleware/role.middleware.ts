import type { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';

export function requireRole(...roles: Array<'admin' | 'teacher' | 'student'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    if (!roles.includes(req.user.role)) {
      sendError(res, 'Insufficient permissions', 403);
      return;
    }
    next();
  };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    sendError(res, 'Authentication required', 401);
    return;
  }
  if (req.user.role !== 'admin') {
    sendError(res, 'Admin access required', 403);
    return;
  }
  next();
}

