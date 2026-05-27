import { Router } from 'express';
import { body } from 'express-validator';
import * as projectController from './project.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';

const router = Router();

// All project routes require authentication
router.use(authenticate);

router.get('/users', projectController.getAllUsers);

router.get('/', projectController.getProjects);

router.post(
  '/',
  [body('name').trim().notEmpty().withMessage('Project name is required')],
  validate,
  projectController.createProject
);

router.get('/:id', projectController.getProject);

router.put(
  '/:id',
  [body('name').optional().trim().notEmpty().withMessage('Name cannot be empty')],
  validate,
  projectController.updateProject
);

router.post(
  '/:id/members',
  [body('userId').notEmpty().withMessage('User ID is required')],
  validate,
  projectController.addMember
);

router.delete('/:id/members/:userId', projectController.removeMember);

export default router;
