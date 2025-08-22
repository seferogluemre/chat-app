export const API_CONFIG = {
  BASE_URL: __DEV__
    ? "http://192.168.1.117:13350/api" // PORT EKLENDİ!
    : "https://your-production-api.com/api",
  SOCKET_URL: __DEV__
    ? "http://192.168.1.117:13350"
    : "https://your-production-api.com",
  TIMEOUT: 10000,
};

export const STORAGE_KEYS = {
  TOKEN: "@chat_app_token",
  USER: "@chat_app_user",
  SETTINGS: "@chat_app_settings",
} as const;

export const ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",           // /api KALDIRILDI
    REGISTER: "/auth/register",     // /api KALDIRILDI
    LOGOUT: "/auth/logout",         // /api KALDIRILDI
    ME: "/auth/me",                 // /api KALDIRILDI
    REFRESH: "/auth/refresh",       // /api KALDIRILDI
  },
  ROOMS: {
    LIST: "/rooms",                 // /api KALDIRILDI
    PUBLIC: "/rooms/public",        // /api KALDIRILDI
    CREATE: "/rooms",               // /api KALDIRILDI
    DM: "/rooms/dm",                // /api KALDIRILDI
    DETAIL: (id: string) => `/rooms/${id}`,
    MEMBERS: (id: string) => `/rooms/${id}/members`,
  },
  MESSAGES: {
    ROOM_MESSAGES: (roomId: string) => `/messages/room/${roomId}`,
    SEND: "/messages",
    UPDATE: (id: string) => `/messages/${id}`,
    DELETE: (id: string) => `/messages/${id}`,
    PIN: (id: string) => `/messages/${id}/pin`,
  },
  USERS: {
    SEARCH: "/users/search",
    PROFILE: (id: string) => `/users/${id}`,
    ONLINE: "/users/online",
  },
} as const;