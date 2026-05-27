import { Response } from 'express';
import * as projectService from './project.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';

export async function createProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { name, description } = req.body;
    const project = await projectService.createProject(name, description, req.user!.id);
    sendSuccess(res, project, 'Project created', 201);
  } catch (error) {
    sendError(res, error instanceof Error ? error.message : 'Failed to create project');
  }
}

export async function getProjects(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const projects = await projectService.getProjectsForUser(req.user!.id, req.user!.role);
    sendSuccess(res, projects);
  } catch {
    sendError(res, 'Failed to fetch projects', 500);
  }
}

export async function getProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const project = await projectService.getProjectById(
      req.params.id,
      req.user!.id,
      req.user!.role
    );
    if (!project) {
      sendError(res, 'Project not found or access denied', 404);
      return;
    }
    sendSuccess(res, project);
  } catch {
    sendError(res, 'Failed to fetch project', 500);
  }
}

export async function updateProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { name, description } = req.body;
    const project = await projectService.updateProject(
      req.params.id,
      name,
      description,
      req.user!.id,
      req.user!.role
    );
    sendSuccess(res, project, 'Project updated');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update project';
    sendError(res, message, 400);
  }
}

export async function addMember(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { userId, role = 'MEMBER' } = req.body;
    const member = await projectService.addMemberToProject(
      req.params.id,
      userId,
      role,
      req.user!.id,
      req.user!.role
    );
    sendSuccess(res, member, 'Member added', 201);
  } catch (error) {
    sendError(res, error instanceof Error ? error.message : 'Failed to add member', 400);
  }
}

export async function removeMember(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    await projectService.removeMemberFromProject(
      req.params.id,
      req.params.userId,
      req.user!.id,
      req.user!.role
    );
    sendSuccess(res, null, 'Member removed');
  } catch (error) {
    sendError(res, error instanceof Error ? error.message : 'Failed to remove member', 400);
  }
}

export async function getAllUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const users = await projectService.getAllUsers();
    sendSuccess(res, users);
  } catch {
    sendError(res, 'Failed to fetch users', 500);
  }
}
