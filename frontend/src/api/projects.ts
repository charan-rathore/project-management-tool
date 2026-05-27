import apiClient from './client';
import { Project, ProjectMember, User, ApiResponse } from '../types';

export const projectsApi = {
  getAll: async (): Promise<Project[]> => {
    const { data } = await apiClient.get<ApiResponse<Project[]>>('/projects');
    return data.data!;
  },

  getById: async (id: string): Promise<Project> => {
    const { data } = await apiClient.get<ApiResponse<Project>>(`/projects/${id}`);
    return data.data!;
  },

  create: async (name: string, description?: string): Promise<Project> => {
    const { data } = await apiClient.post<ApiResponse<Project>>('/projects', {
      name,
      description,
    });
    return data.data!;
  },

  update: async (id: string, name?: string, description?: string): Promise<Project> => {
    const { data } = await apiClient.put<ApiResponse<Project>>(`/projects/${id}`, {
      name,
      description,
    });
    return data.data!;
  },

  addMember: async (
    projectId: string,
    userId: string,
    role: 'ADMIN' | 'MEMBER' = 'MEMBER'
  ): Promise<ProjectMember> => {
    const { data } = await apiClient.post<ApiResponse<ProjectMember>>(
      `/projects/${projectId}/members`,
      { userId, role }
    );
    return data.data!;
  },

  removeMember: async (projectId: string, userId: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/members/${userId}`);
  },

  getAllUsers: async (): Promise<User[]> => {
    const { data } = await apiClient.get<ApiResponse<User[]>>('/projects/users');
    return data.data!;
  },
};
