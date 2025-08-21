import cache from "@/core/cache";
import prisma from "@/core/prisma";
import { Role } from "@prisma/client";
import {
    PermissionCheckResult,
    PermissionIdentifier,
    PermissionKey,
    RoomPermissionContext,
    UserWithPermissions,
} from "./types";

const ROLE_CACHE_KEY = (roleId: number) => `role:${roleId}`;
const USER_PERMISSIONS_CACHE_KEY = (userId: string) =>
  `user_permissions:${userId}`;


export function isPermissionGrantedToRole(
  role: Role,
  permission: PermissionIdentifier
): boolean {
  const permissions = role.permissions as PermissionKey[];
  const permissionKey =
    typeof permission === "string" ? permission : permission.key;

  return permissions.includes("*") || permissions.includes(permissionKey);
}

export async function hasGlobalPermission(
  user: UserWithPermissions,
  permission: PermissionIdentifier
): Promise<boolean> {
  for (const userRole of user.userRoles) {
    if (!userRole.role.isGlobal) continue;

    const permissions = userRole.role.permissions as PermissionKey[];
    const permissionKey =
      typeof permission === "string" ? permission : permission.key;

    if (permissions.includes("*") || permissions.includes(permissionKey)) {
      return true;
    }
  }

  return false;
}


export async function hasRoomPermission(
  context: RoomPermissionContext
): Promise<PermissionCheckResult> {
  const { userId, roomId, permission } = context;
  
  const cacheKey = USER_PERMISSIONS_CACHE_KEY(userId);
  let user = await cache.getValue(cacheKey);

  if (!user) {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!dbUser) {
      return { hasPermission: false };
    }

    user = dbUser;
    await cache.setValue(cacheKey, JSON.stringify(user), 300);
  } else {
    user = JSON.parse(user);
  }

  const permissionKey =
    typeof permission === "string" ? permission : permission.key;

  for (const userRole of user.userRoles) {
    if (userRole.role.isGlobal) {
      const permissions = userRole.role.permissions as PermissionKey[];
      if (permissions.includes("*") || permissions.includes(permissionKey)) {
        return {
          hasPermission: true,
          source: "global",
          roleId: userRole.role.id,
        };
      }
    }
  }

  for (const userRole of user.userRoles) {
    if (userRole.roomId === roomId) {
      const permissions = userRole.role.permissions as PermissionKey[];
      if (permissions.includes("*") || permissions.includes(permissionKey)) {
        return {
          hasPermission: true,
          source: "room-specific",
          roleId: userRole.role.id,
        };
      }
    }
  }

  return { hasPermission: false };
}

export async function userHasPermission(
  user: UserWithPermissions,
  permission: PermissionIdentifier,
  roomId?: string
): Promise<boolean> {
  const hasGlobal = await hasGlobalPermission(user, permission);
  if (hasGlobal) return true;

  if (roomId) {
    const roomResult = await hasRoomPermission({
      userId: user.id,
      roomId,
      permission,
    });
    return roomResult.hasPermission;
  }

  return false;
}


export async function ensureUserHasPermission(
  user: UserWithPermissions,
  permission: PermissionIdentifier,
  roomId?: string
): Promise<void> {
  const hasPermission = await userHasPermission(user, permission, roomId);

  if (!hasPermission) {
    throw new Error("Bu işlem için yetkiniz yok");
  }
}


export async function clearUserPermissionCache(userId: string): Promise<void> {
  const cacheKey = USER_PERMISSIONS_CACHE_KEY(userId);
  await cache.delete(cacheKey);
}