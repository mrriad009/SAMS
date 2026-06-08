import type { Request, Response, NextFunction } from 'express';
import { AppError, sendError } from '../utils/response.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response {
  console.error(err);
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode);
  }
  return sendError(res, 'Internal server error', 500);
}

export function notFoundHandler(_req: Request, res: Response): Response {
  return sendError(res, 'Route not found', 404);
}
