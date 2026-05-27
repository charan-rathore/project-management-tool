import { Router } from 'express';
import { body } from 'express-validator';
import * as taskController from './task.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';

const router = Router({ mergeParams: true }); // mergeParams allows access to :projectId from parent router

router.use(authenticate);

router.get('/', taskController.getProjectTasks);

router.post(
  '/',
  [body('title').trim().notEmpty().withMessage('Task title is required')],
  validate,
  taskController.createTask
);

router.put('/:taskId', taskController.updateTask);

router.delete('/:taskId', taskController.deleteTask);

export default router;
