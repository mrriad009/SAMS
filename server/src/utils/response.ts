import type { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: Record<string, unknown>;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  status = 200,
  meta?: Record<string, unknown>
): Response {
  const response: ApiResponse<T> = { success: true, data, message, meta };
  return res.status(status).json(response);
}

export function sendError(
  res: Response,
  message: string,
  status = 400,
  meta?: Record<string, unknown>
): Response {
  const response: ApiResponse = { success: false, message, meta };
  return res.status(status).json(response);
}

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode = 400
  ) {
    super(message);
    this.name = 'AppError';
  }
}
