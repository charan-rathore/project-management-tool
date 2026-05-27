import { Priority, TaskStatus } from '@prisma/client';
import { prisma } from '../../config/database';

async function assertProjectAccess(projectId: string, userId: string, userRole: string) {
  if (userRole === 'ADMIN') return;
  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  if (!member) throw new Error('Access denied: not a project member');
}

export async function createTask(data: {
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: string;
  assigneeId?: string;
  projectId: string;
  creatorId: string;
  userRole: string;
}) {
  await assertProjectAccess(data.projectId, data.creatorId, data.userRole);

  // If assignee is provided, verify they are a project member
  if (data.assigneeId) {
    const isMember = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: data.assigneeId, projectId: data.projectId } },
    });
    if (!isMember) throw new Error('Assignee must be a member of this project');
  }

  return prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority || 'MEDIUM',
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      assigneeId: data.assigneeId || null,
      projectId: data.projectId,
      creatorId: data.creatorId,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true } },
    },
  });
}

export async function getTasksForProject(
  projectId: string,
  userId: string,
  userRole: string
) {
  await assertProjectAccess(projectId, userId, userRole);

  return prisma.task.findMany({
    where: { projectId },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateTask(
  taskId: string,
  updates: {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: Priority;
    dueDate?: string | null;
    assigneeId?: string | null;
  },
  userId: string,
  userRole: string
) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { include: { members: true } } },
  });

  if (!task) throw new Error('Task not found');

  // Authorization:
  // - System Admin: can do anything
  // - Project Admin: can update any field
  // - Assignee (Member): can only update status
  if (userRole !== 'ADMIN') {
    const projectMember = task.project.members.find((m) => m.userId === userId);
    if (!projectMember) throw new Error('Access denied');

    if (projectMember.role !== 'ADMIN') {
      // Regular member can only update status if they are the assignee
      if (task.assigneeId !== userId) {
        throw new Error('Members can only update tasks assigned to them');
      }
      const allowedFields = Object.keys(updates).filter(
        (k) => !['status'].includes(k)
      );
      if (allowedFields.length > 0) {
        throw new Error('Members can only update task status');
      }
    }
  }

  if (updates.assigneeId !== undefined && updates.assigneeId !== null) {
    const isMember = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: updates.assigneeId, projectId: task.projectId } },
    });
    if (!isMember) throw new Error('Assignee must be a project member');
  }

  return prisma.task.update({
    where: { id: taskId },
    data: {
      ...(updates.title && { title: updates.title }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.status && { status: updates.status }),
      ...(updates.priority && { priority: updates.priority }),
      ...(updates.dueDate !== undefined && {
        dueDate: updates.dueDate ? new Date(updates.dueDate) : null,
      }),
      ...(updates.assigneeId !== undefined && { assigneeId: updates.assigneeId }),
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true } },
    },
  });
}

export async function deleteTask(taskId: string, userId: string, userRole: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { include: { members: true } } },
  });

  if (!task) throw new Error('Task not found');

  if (userRole !== 'ADMIN') {
    const member = task.project.members.find((m) => m.userId === userId);
    if (!member || member.role !== 'ADMIN') {
      throw new Error('Only project admins can delete tasks');
    }
  }

  await prisma.task.delete({ where: { id: taskId } });
}
