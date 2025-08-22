import { ApiMessage, PaginatedResponse } from '../../types/api';
import { ENDPOINTS } from '../../utils/constants';
import { apiClient } from '../client';

export interface SendMessageRequest {
  roomId: string;
  content: string;
  replyToId?: string;
}

export interface UpdateMessageRequest {
  content: string;
}

export interface MessageSearchParams {
  search?: string;
  senderId?: string;
  isPinned?: boolean;
  after?: string;
  before?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export class MessageService {
  static async getRoomMessages(roomId: string, params?: MessageSearchParams): Promise<PaginatedResponse<ApiMessage>> {
    const response = await apiClient.get<PaginatedResponse<ApiMessage>>(
      ENDPOINTS.MESSAGES.ROOM_MESSAGES(roomId),
      params
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Mesajlar getirilemedi');
    }
    
    return response.data;
  }

  static async sendMessage(data: SendMessageRequest): Promise<ApiMessage> {
    const response = await apiClient.post<ApiMessage>(ENDPOINTS.MESSAGES.SEND, data);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Mesaj gönderilemedi');
    }
    
    return response.data;
  }

  static async updateMessage(messageId: string, data: UpdateMessageRequest): Promise<ApiMessage> {
    const response = await apiClient.put<ApiMessage>(ENDPOINTS.MESSAGES.UPDATE(messageId), data);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Mesaj düzenlenemedi');
    }
    
    return response.data;
  }

  static async deleteMessage(messageId: string): Promise<void> {
    const response = await apiClient.delete(ENDPOINTS.MESSAGES.DELETE(messageId));
    
    if (!response.success) {
      throw new Error(response.message || 'Mesaj silinemedi');
    }
  }

  static async togglePinMessage(messageId: string, pinned: boolean): Promise<ApiMessage> {
    const response = await apiClient.post<ApiMessage>(ENDPOINTS.MESSAGES.PIN(messageId), { pinned });
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Mesaj pin durumu değiştirilemedi');
    }
    
    return response.data;
  }

  static async toggleReaction(messageId: string, emoji: string, action: 'add' | 'remove'): Promise<void> {
    const response = await apiClient.post(`/messages/${messageId}/react`, { emoji, action });
    
    if (!response.success) {
      throw new Error(response.message || 'Reaction eklenemedi');
    }
  }
}