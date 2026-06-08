import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { sendError } from '../utils/response.js';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0]?.message || 'Invalid request body', 400);
      return;
    }
    req.body = parsed.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0]?.message || 'Invalid query parameters', 400);
      return;
    }
    req.query = parsed.data as Request['query'];
    next();
  };
}
