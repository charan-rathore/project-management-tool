import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { sendError } from '../utils/response';

// Why validation middleware?
// Never trust user input. Validation at the boundary (before it reaches service layer)
// prevents bad data from entering the system, breaking DB constraints, or causing bugs.
export function validate(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    sendError(res, 'Validation failed', 422, messages);
    return;
  }
  next();
}
