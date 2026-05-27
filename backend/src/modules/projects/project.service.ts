import { prisma } from '../../config/database';

export async function createProject(name: string, description: string | undefined, ownerId: string) {
  // When a project is created, the owner is automatically added as a member with ADMIN role.
  // Why? The creator should have full access to their own project.
  const project = await prisma.project.create({
    data: {
      name,
      description,
      ownerId,
      members: {
        create: {
          userId: ownerId,
          role: 'ADMIN',
        },
      },
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      _count: { select: { tasks: true } },
    },
  });
  return project;
}

export async function getProjectsForUser(userId: string, userRole: string) {
  // Admins see all projects. Members see only projects they belong to.
  if (userRole === 'ADMIN') {
    return prisma.project.findMany({
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  return prisma.project.findMany({
    where: {
      members: { some: { userId } },
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getProjectById(projectId: string, userId: string, userRole: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!project) return null;

  // Authorization check: is this user a member of the project?
  if (userRole !== 'ADMIN') {
    const isMember = project.members.some((m) => m.userId === userId);
    if (!isMember) return null;
  }

  return project;
}

export async function updateProject(
  projectId: string,
  name: string | undefined,
  description: string | undefined,
  userId: string,
  userRole: string
) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error('Project not found');

  // Only project owner or system admin can edit
  if (project.ownerId !== userId && userRole !== 'ADMIN') {
    throw new Error('Not authorized to update this project');
  }

  return prisma.project.update({
    where: { id: projectId },
    data: { ...(name && { name }), ...(description !== undefined && { description }) },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { tasks: true, members: true } },
    },
  });
}

export async function addMemberToProject(
  projectId: string,
  userId: string,
  role: 'ADMIN' | 'MEMBER',
  requesterId: string,
  requesterRole: string
) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error('Project not found');

  if (project.ownerId !== requesterId && requesterRole !== 'ADMIN') {
    throw new Error('Only project owner or admin can add members');
  }

  const userExists = await prisma.user.findUnique({ where: { id: userId } });
  if (!userExists) throw new Error('User not found');

  const existing = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  if (existing) throw new Error('User is already a member of this project');

  return prisma.projectMember.create({
    data: { userId, projectId, role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}

export async function removeMemberFromProject(
  projectId: string,
  userId: string,
  requesterId: string,
  requesterRole: string
) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error('Project not found');

  if (project.ownerId !== requesterId && requesterRole !== 'ADMIN') {
    throw new Error('Only project owner or admin can remove members');
  }

  if (userId === project.ownerId) {
    throw new Error('Cannot remove the project owner');
  }

  return prisma.projectMember.delete({
    where: { userId_projectId: { userId, projectId } },
  });
}

export async function getAllUsers() {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: 'asc' },
  });
}
