import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

// Global error handler.
// Why? Unhandled errors in Express can crash the process or leak stack traces.
// This catches anything that falls through, logs it server-side,
// and returns a safe message to the client.
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[ERROR]', err.message, err.stack);
  sendError(res, 'An unexpected error occurred. Please try again.', 500);
}

// 404 handler for unknown routes
export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, `Route ${req.method} ${req.path} not found.`, 404);
}
