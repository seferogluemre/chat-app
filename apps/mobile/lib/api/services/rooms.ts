import { ApiRoom, PaginatedResponse } from '../../types/api';
import { ENDPOINTS } from '../../utils/constants';
import { apiClient } from '../client';

export interface CreateRoomRequest {
  name?: string;
  description?: string;
  isPrivate: boolean;
  maxMembers?: number;
  roomImage?: string;
  memberIds?: string[];
}

export interface CreateDMRequest {
  participantId: string;
}

export interface UpdateRoomRequest {
  name?: string;
  description?: string;
  isPrivate?: boolean;
  maxMembers?: number;
  roomImage?: string;
  memberIds?: string[];
}

export interface RoomSearchParams {
  query?: string;
  isPrivate?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'memberCount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export class RoomService {
  static async getUserRooms(): Promise<ApiRoom[]> {
    const response = await apiClient.get<ApiRoom[]>(ENDPOINTS.ROOMS.LIST);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Odalar getirilemedi');
    }
    
    return response.data;
  }

  static async getPublicRooms(params?: RoomSearchParams): Promise<PaginatedResponse<ApiRoom>> {
    const response = await apiClient.get<PaginatedResponse<ApiRoom>>(ENDPOINTS.ROOMS.PUBLIC, params);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Public odalar getirilemedi');
    }
    
    return response.data;
  }

  static async getRoomDetails(roomId: string): Promise<ApiRoom> {
    const response = await apiClient.get<ApiRoom>(ENDPOINTS.ROOMS.DETAIL(roomId));
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Oda detayları getirilemedi');
    }
    
    return response.data;
  }

  static async createRoom(data: CreateRoomRequest): Promise<ApiRoom> {
    const response = await apiClient.post<ApiRoom>(ENDPOINTS.ROOMS.CREATE, data);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Oda oluşturulamadı');
    }
    
    return response.data;
  }

  static async createDM(data: CreateDMRequest): Promise<ApiRoom> {
    const response = await apiClient.post<ApiRoom>(ENDPOINTS.ROOMS.DM, data);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'DM oluşturulamadı');
    }
    
    return response.data;
  }

  static async updateRoom(roomId: string, data: UpdateRoomRequest): Promise<ApiRoom> {
    const response = await apiClient.put<ApiRoom>(ENDPOINTS.ROOMS.DETAIL(roomId), data);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Oda güncellenemedi');
    }
    
    return response.data;
  }

  static async deleteRoom(roomId: string): Promise<void> {
    const response = await apiClient.delete(ENDPOINTS.ROOMS.DETAIL(roomId));
    
    if (!response.success) {
      throw new Error(response.message || 'Oda silinemedi');
    }
  }

  static async getRoomMembers(roomId: string): Promise<any[]> {
    const response = await apiClient.get<any[]>(ENDPOINTS.ROOMS.MEMBERS(roomId));
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Üyeler getirilemedi');
    }
    
    return response.data;
  }
}