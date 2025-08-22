import { ApiUser, PaginatedResponse } from '../../types/api';
import { ENDPOINTS } from '../../utils/constants';
import { apiClient } from '../client';

export interface UserSearchParams {
  query?: string;
  isActive?: boolean;
  sortBy?: 'username' | 'firstName' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export class UserService {
  static async searchUsers(params?: UserSearchParams): Promise<PaginatedResponse<ApiUser>> {
    const response = await apiClient.get<PaginatedResponse<ApiUser>>(ENDPOINTS.USERS.SEARCH, params);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Kullanıcılar getirilemedi');
    }
    
    return response.data;
  }

  static async getUserProfile(userId: string): Promise<ApiUser> {
    const response = await apiClient.get<ApiUser>(ENDPOINTS.USERS.PROFILE(userId));
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Kullanıcı profili getirilemedi');
    }
    
    return response.data;
  }

  static async getOnlineUsers(): Promise<{ count: number; users: ApiUser[] }> {
    const response = await apiClient.get<{ count: number; users: ApiUser[] }>(ENDPOINTS.USERS.ONLINE);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Online kullanıcılar getirilemedi');
    }
    
    return response.data;
  }
}