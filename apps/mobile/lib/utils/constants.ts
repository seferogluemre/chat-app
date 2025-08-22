// API Configuration
export const API_CONFIG = {
    BASE_URL: __DEV__ 
      ? 'http://localhost:13350/api'  // Development
      : 'https://your-production-api.com/api', // Production
    SOCKET_URL: __DEV__
      ? 'http://localhost:3001'
      : 'https://your-production-api.com',
    TIMEOUT: 10000, // 10 seconds
  };
  
  export const STORAGE_KEYS = {
    TOKEN: '@chat_app_token',
    USER: '@chat_app_user',
    SETTINGS: '@chat_app_settings',
  } as const;
  
  // API Endpoints
  export const ENDPOINTS = {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout',
      ME: '/auth/me',
      REFRESH: '/auth/refresh',
    },
    ROOMS: {
      LIST: '/rooms',
      PUBLIC: '/rooms/public',
      CREATE: '/rooms',
      DM: '/rooms/dm',
      DETAIL: (id: string) => `/rooms/${id}`,
      MEMBERS: (id: string) => `/rooms/${id}/members`,
    },
    MESSAGES: {
      ROOM_MESSAGES: (roomId: string) => `/messages/room/${roomId}`,
      SEND: '/messages',
      UPDATE: (id: string) => `/messages/${id}`,
      DELETE: (id: string) => `/messages/${id}`,
      PIN: (id: string) => `/messages/${id}/pin`,
    },
    USERS: {
      SEARCH: '/users/search',
      PROFILE: (id: string) => `/users/${id}`,
      ONLINE: '/users/online',
    },
  } as const;