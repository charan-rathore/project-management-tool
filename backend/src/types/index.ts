import { Request } from 'express';
import { Role } from '@prisma/client';

// Extend Express Request to carry the authenticated user's identity.
// Why? After JWT verification middleware runs, we need to pass the user
// data forward to controllers without re-querying the DB every time.
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
    name: string;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}
