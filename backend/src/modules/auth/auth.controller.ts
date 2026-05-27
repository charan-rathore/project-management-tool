import { Request, Response } from 'express';
import * as authService from './auth.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name } = req.body;
    const result = await authService.registerUser(email, password, name);
    sendSuccess(res, result, 'Registration successful', 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    sendError(res, message, 400);
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    sendSuccess(res, result, 'Login successful');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    sendError(res, message, 401);
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = await authService.getUserById(req.user!.id);
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }
    sendSuccess(res, user);
  } catch {
    sendError(res, 'Failed to fetch user', 500);
  }
}
