import { Simplify, ValueOf } from "type-fest";
import { PERMISSIONS } from "./constants";

export type GenericPermissionObject = {
  key: string;
  description: string;
};

export type BasePermissionObject = Simplify<
  ValueOf<{
    [K in keyof typeof PERMISSIONS]: ValueOf<(typeof PERMISSIONS)[K]>;
  }>
>;

export type PermissionObject =
  | BasePermissionObject
  | {
      key: "*";
      description: "Tüm yetkilere izin ver";
    };

export type PermissionKey = BasePermissionObject["key"] | "*";

export type PermissionIdentifier = PermissionKey | PermissionObject;

export interface UserWithPermissions {
  id: string;
  userRoles: Array<{
    role: {
      permissions: string[];
      isGlobal: boolean;
    };
    roomId?: string | null;
  }>;
}

export interface RoomPermissionContext {
  userId: string;
  roomId: string;
  permission: PermissionIdentifier;
}

export interface PermissionCheckResult {
  hasPermission: boolean;
  source?: "global" | "room-specific";
  roleId?: number;
}

export interface AuthenticatedRequest {
  user: UserWithPermissions;
}

export interface PermissionMiddlewareOptions {
  permission: PermissionIdentifier;
  requireRoomAccess?: boolean;
  roomIdParam?: string;
}