export type Role = 'ADMIN' | 'MEMBER';
export type ProjectRole = 'ADMIN' | 'MEMBER';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  role: ProjectRole;
  joinedAt: string;
  user: Pick<User, 'id' | 'name' | 'email'>;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner: Pick<User, 'id' | 'name' | 'email'>;
  members: ProjectMember[];
  tasks?: Task[];
  _count?: { tasks: number };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string;
  projectId: string;
  assigneeId?: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  assignee?: Pick<User, 'id' | 'name' | 'email'>;
  creator?: Pick<User, 'id' | 'name' | 'email'>;
  project?: Pick<Project, 'id' | 'name'>;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface DashboardData {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  myTasks?: number;
  recentTasks: Task[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}
