import { Response } from 'express';
import * as taskService from './task.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';

export async function createTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { title, description, priority, dueDate, assigneeId } = req.body;
    const task = await taskService.createTask({
      title,
      description,
      priority,
      dueDate,
      assigneeId,
      projectId: req.params.projectId,
      creatorId: req.user!.id,
      userRole: req.user!.role,
    });
    sendSuccess(res, task, 'Task created', 201);
  } catch (error) {
    sendError(res, error instanceof Error ? error.message : 'Failed to create task', 400);
  }
}

export async function getProjectTasks(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const tasks = await taskService.getTasksForProject(
      req.params.projectId,
      req.user!.id,
      req.user!.role
    );
    sendSuccess(res, tasks);
  } catch (error) {
    sendError(res, error instanceof Error ? error.message : 'Failed to fetch tasks', 400);
  }
}

export async function updateTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const task = await taskService.updateTask(
      req.params.taskId,
      req.body,
      req.user!.id,
      req.user!.role
    );
    sendSuccess(res, task, 'Task updated');
  } catch (error) {
    sendError(res, error instanceof Error ? error.message : 'Failed to update task', 400);
  }
}

export async function deleteTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    await taskService.deleteTask(req.params.taskId, req.user!.id, req.user!.role);
    sendSuccess(res, null, 'Task deleted');
  } catch (error) {
    sendError(res, error instanceof Error ? error.message : 'Failed to delete task', 400);
  }
}
