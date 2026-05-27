import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // Create demo users
  const adminPassword = await bcrypt.hash('admin123', 12);
  const memberPassword = await bcrypt.hash('member123', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@demo.com',
      name: 'Alice Admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const member1 = await prisma.user.create({
    data: {
      email: 'bob@demo.com',
      name: 'Bob Member',
      password: memberPassword,
      role: 'MEMBER',
    },
  });

  const member2 = await prisma.user.create({
    data: {
      email: 'carol@demo.com',
      name: 'Carol Dev',
      password: memberPassword,
      role: 'MEMBER',
    },
  });

  // Create a demo project
  const project = await prisma.project.create({
    data: {
      name: 'Website Redesign',
      description: 'Modernize the company website with new branding',
      ownerId: admin.id,
      members: {
        create: [
          { userId: admin.id, role: 'ADMIN' },
          { userId: member1.id, role: 'MEMBER' },
          { userId: member2.id, role: 'MEMBER' },
        ],
      },
    },
  });

  // Create demo tasks
  const now = new Date();
  const pastDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago (overdue)
  const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  await prisma.task.createMany({
    data: [
      {
        title: 'Design homepage mockup',
        description: 'Create wireframes and mockups for the new homepage',
        status: 'COMPLETED',
        priority: 'HIGH',
        dueDate: pastDate,
        projectId: project.id,
        assigneeId: member2.id,
        creatorId: admin.id,
      },
      {
        title: 'Implement authentication',
        description: 'Set up user login and registration',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: futureDate,
        projectId: project.id,
        assigneeId: member1.id,
        creatorId: admin.id,
      },
      {
        title: 'Write API documentation',
        description: 'Document all REST endpoints',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: futureDate,
        projectId: project.id,
        assigneeId: member1.id,
        creatorId: admin.id,
      },
      {
        title: 'Fix mobile responsiveness',
        description: 'Ensure site works on all screen sizes',
        status: 'TODO',
        priority: 'LOW',
        dueDate: pastDate,
        projectId: project.id,
        assigneeId: member2.id,
        creatorId: admin.id,
      },
    ],
  });

  console.log('Seed complete!');
  console.log('\nDemo credentials:');
  console.log('  Admin: admin@demo.com / admin123');
  console.log('  Member: bob@demo.com / member123');
  console.log('  Member: carol@demo.com / member123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
