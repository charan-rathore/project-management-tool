import { Response } from 'express';
import { ApiResponse } from '../types';

// Standardized response helpers.
// Why? Every endpoint should return the same shape so the frontend
// can handle responses predictably without per-endpoint logic.

export function sendSuccess<T>(res: Response, data: T, message?: string, statusCode = 200) {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
}

export function sendError(res: Response, message: string, statusCode = 400, errors?: string[]) {
  const response: ApiResponse = {
    success: false,
    message,
    errors,
  };
  return res.status(statusCode).json(response);
}
