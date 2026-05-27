import apiClient from './client';
import { Task, ApiResponse, Priority, TaskStatus } from '../types';

export const tasksApi = {
  getByProject: async (projectId: string): Promise<Task[]> => {
    const { data } = await apiClient.get<ApiResponse<Task[]>>(
      `/projects/${projectId}/tasks`
    );
    return data.data!;
  },

  create: async (
    projectId: string,
    payload: {
      title: string;
      description?: string;
      priority?: Priority;
      dueDate?: string;
      assigneeId?: string;
    }
  ): Promise<Task> => {
    const { data } = await apiClient.post<ApiResponse<Task>>(
      `/projects/${projectId}/tasks`,
      payload
    );
    return data.data!;
  },

  update: async (
    projectId: string,
    taskId: string,
    updates: {
      title?: string;
      description?: string;
      status?: TaskStatus;
      priority?: Priority;
      dueDate?: string | null;
      assigneeId?: string | null;
    }
  ): Promise<Task> => {
    const { data } = await apiClient.put<ApiResponse<Task>>(
      `/projects/${projectId}/tasks/${taskId}`,
      updates
    );
    return data.data!;
  },

  delete: async (projectId: string, taskId: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/tasks/${taskId}`);
  },
};
