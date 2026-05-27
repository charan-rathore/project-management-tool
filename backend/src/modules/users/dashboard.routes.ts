import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { getDashboardData } from './dashboard.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';

const router = Router();

router.get('/', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const data = await getDashboardData(req.user!.id, req.user!.role);
    sendSuccess(res, data);
  } catch {
    sendError(res, 'Failed to load dashboard', 500);
  }
});

export default router;
