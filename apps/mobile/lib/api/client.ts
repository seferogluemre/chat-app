import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { navigate } from 'expo-router/build/global-state/routing';
import { StorageService } from '../storage/storage';
import { API_CONFIG } from '../utils/constants';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  timestamp: string;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      async (config) => {
        const token = await StorageService.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        if (__DEV__) {
          console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }
        
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        if (__DEV__) {
          console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
        }
        return response;
      },
      async (error: AxiosError<ApiResponse>) => {
        if (__DEV__) {
          console.log(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.response?.data);
        }

        // Handle 401 - Unauthorized (token expired)
        if (error.response?.status === 401) {
          await StorageService.clearAll();
          navigate("/(tabs)/login");
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, params?: any): Promise<ApiResponse<T>> {
    const response = await this.client.get(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.put(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const response = await this.client.delete(url);
    return response.data;
  }

  async upload<T>(url: string, formData: FormData): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();