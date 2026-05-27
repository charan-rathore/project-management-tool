import { prisma } from '../../config/database';

export async function getDashboardData(userId: string, userRole: string) {
  const now = new Date();

  if (userRole === 'ADMIN') {
    // System admin sees all stats
    const [totalProjects, totalTasks, completedTasks, overdueTasks, recentTasks] =
      await Promise.all([
        prisma.project.count(),
        prisma.task.count(),
        prisma.task.count({ where: { status: 'COMPLETED' } }),
        prisma.task.count({
          where: {
            dueDate: { lt: now },
            status: { not: 'COMPLETED' },
          },
        }),
        prisma.task.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            assignee: { select: { id: true, name: true } },
            project: { select: { id: true, name: true } },
          },
        }),
      ]);

    return {
      totalProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      inProgressTasks: await prisma.task.count({ where: { status: 'IN_PROGRESS' } }),
      todoTasks: await prisma.task.count({ where: { status: 'TODO' } }),
      recentTasks,
    };
  }

  // Member dashboard: scoped to their projects
  const memberProjects = await prisma.projectMember.findMany({
    where: { userId },
    select: { projectId: true },
  });
  const projectIds = memberProjects.map((m) => m.projectId);

  const [totalProjects, totalTasks, completedTasks, overdueTasks, myTasks, recentTasks] =
    await Promise.all([
      prisma.project.count({ where: { id: { in: projectIds } } }),
      prisma.task.count({ where: { projectId: { in: projectIds } } }),
      prisma.task.count({
        where: { projectId: { in: projectIds }, status: 'COMPLETED' },
      }),
      prisma.task.count({
        where: {
          projectId: { in: projectIds },
          dueDate: { lt: now },
          status: { not: 'COMPLETED' },
        },
      }),
      prisma.task.count({ where: { assigneeId: userId } }),
      prisma.task.findMany({
        where: { assigneeId: userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { id: true, name: true } },
        },
      }),
    ]);

  return {
    totalProjects,
    totalTasks,
    completedTasks,
    overdueTasks,
    myTasks,
    inProgressTasks: await prisma.task.count({
      where: { projectId: { in: projectIds }, status: 'IN_PROGRESS' },
    }),
    todoTasks: await prisma.task.count({
      where: { projectId: { in: projectIds }, status: 'TODO' },
    }),
    recentTasks,
  };
}
