
export interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    username: string;
    profileImage?: string;
    bio?: string;
    emailVerified: boolean;
    isActive: boolean;
  };
  token: string;
  expiresAt: Date;
}

export interface RegisterPayload {
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  bio?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface JWTPayload {
  userId: string;
  sessionId: string;
}

export interface PasswordResetPayload {
  email: string;
}

export interface PasswordResetConfirmPayload {
  token: string;
  newPassword: string;
}

export interface SessionInfo {
  id: string;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  createdAt: Date;
}