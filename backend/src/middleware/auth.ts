import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AuthenticatedRequest } from '../types';
import { sendError } from '../utils/response';
import { Role } from '@prisma/client';

// Why JWT verification middleware?
// Authentication and Authorization are two distinct problems.
// Authentication = "Who are you?" — verified by checking the JWT signature.
// Authorization = "Are you allowed to do this?" — checked in route handlers.
//
// This middleware handles ONLY authentication: it verifies the token
// and attaches the user identity to the request object.
// It does NOT make DB calls for every request — JWT is self-contained.

interface JwtPayload {
  id: string;
  email: string;
  role: Role;
  name: string;
}

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Access denied. No token provided.', 401);
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    sendError(res, 'Invalid or expired token.', 401);
  }
}

// Why a separate requireAdmin middleware?
// Separation of concerns. Any route can apply either middleware independently.
// A route might need authentication but not admin access.
export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== 'ADMIN') {
    sendError(res, 'Access denied. Admin role required.', 403);
    return;
  }
  next();
}
