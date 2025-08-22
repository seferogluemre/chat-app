import { ApiUser, LoginResponse } from '../../types/api';
import { ENDPOINTS } from '../../utils/constants';
import { apiClient } from '../client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
  bio?: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  bio?: string;
  profileImage?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export class AuthService {
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(ENDPOINTS.AUTH.LOGIN, credentials);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Giriş başarısız');
    }
    
    return response.data;
  }

  static async register(userData: RegisterRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(ENDPOINTS.AUTH.REGISTER, userData);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Kayıt başarısız');
    }
    
    return response.data;
  }

  static async logout(): Promise<void> {
    try {
      await apiClient.post(ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  static async getProfile(): Promise<ApiUser> {
    const response = await apiClient.get<ApiUser>(ENDPOINTS.AUTH.ME);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Profil bilgileri alınamadı');
    }
    
    return response.data;
  }

  static async updateProfile(data: UpdateProfileRequest): Promise<ApiUser> {
    const response = await apiClient.put<ApiUser>('/auth/profile', data);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Profil güncellenemedi');
    }
    
    return response.data;
  }

  static async changePassword(data: ChangePasswordRequest): Promise<void> {
    const response = await apiClient.post('/auth/change-password', data);
    
    if (!response.success) {
      throw new Error(response.message || 'Şifre değiştirilemedi');
    }
  }

  static async verifyToken(): Promise<boolean> {
    try {
      const response = await apiClient.get('/auth/verify');
      return response.success;
    } catch (error) {
      return false;
    }
  }
}