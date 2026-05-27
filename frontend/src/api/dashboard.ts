import apiClient from './client';
import { DashboardData, ApiResponse } from '../types';

export const dashboardApi = {
  get: async (): Promise<DashboardData> => {
    const { data } = await apiClient.get<ApiResponse<DashboardData>>('/dashboard');
    return data.data!;
  },
};
