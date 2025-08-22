import prisma from '@/core/prisma';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../utils/http-errors';
import { BanUserPayload, PaginatedUsers, UserProfile, UserSearchFilters } from './types';

export class UserService {
  async searchUsers(filters: UserSearchFilters): Promise<PaginatedUsers> {
    const { page = 1, limit = 20, query, isActive, isBanned, sortBy = 'createdAt', sortOrder = 'desc' } = filters;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(query && {
        OR: [
          { username: { contains: query, mode: 'insensitive' as const } },
          { firstName: { contains: query, mode: 'insensitive' as const } },
          { lastName: { contains: query, mode: 'insensitive' as const } },
          { email: { contains: query, mode: 'insensitive' as const } }
        ]
      }),
      ...(isActive !== undefined && { isActive }),
      ...(isBanned !== undefined && { isBanned })
    };

    const orderBy = this.buildOrderBy(sortBy, sortOrder);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          fullName: true,
          profileImage: true,
          bio: true,
          emailVerified: true,
          isActive: true,
          isBanned: true,
          createdAt: true
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    return {
      users: users.map(user => ({
        ...user,
        isBanned: user.isBanned || false
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }
  async getUserProfile(userId: string, requestingUserId: string): Promise<UserProfile> {
    const user = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      include: {
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                slug: true,
                permissions: true,
                isGlobal: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundError('Kullanıcı bulunamadı');
    }

    const isAdmin = await this.isUserAdmin(requestingUserId);
    const isSelf = userId === requestingUserId;

    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      profileImage: user.profileImage,
      bio: user.bio,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
      createdAt: user.createdAt,
      // Private fields (only for self/admin)
      ...(isSelf || isAdmin) && {
        email: user.email,
        isBanned: user.isBanned,
        banReason: user.banReason,
        banExpiresAt: user.banExpiresAt
      }
    };
  }

  async updateUser(userId: string, adminId: string, payload: any): Promise<UserProfile> {
    if (!(await this.isUserAdmin(adminId))) {
      throw new ForbiddenError('Bu işlem için admin yetkisi gereklidir');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null }
    });

    if (!user) {
      throw new NotFoundError('Kullanıcı bulunamadı');
    }

    if (payload.username && payload.username !== user.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: payload.username,
          id: { not: userId },
          deletedAt: null
        }
      });

      if (existingUser) {
        throw new BadRequestError('Bu kullanıcı adı zaten kullanılıyor');
      }
    }

    let updateData = { ...payload };
    if (payload.firstName || payload.lastName) {
      const firstName = payload.firstName || user.firstName;
      const lastName = payload.lastName || user.lastName;
      updateData.fullName = `${firstName} ${lastName}`;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    return await this.getUserProfile(userId, adminId);
  }

  async banUser(userId: string, adminId: string, payload: BanUserPayload): Promise<void> {
    if (!(await this.isUserAdmin(adminId))) {
      throw new ForbiddenError('Bu işlem için admin yetkisi gereklidir');
    }

    if (userId === adminId) {
      throw new BadRequestError('Kendinizi banlayamazsınız');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null }
    });

    if (!user) {
      throw new NotFoundError('Kullanıcı bulunamadı');
    }

    let banExpiresAt: Date | null = null;
    if (payload.duration) {
      banExpiresAt = new Date();
      banExpiresAt.setDate(banExpiresAt.getDate() + payload.duration);
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: true,
        banReason: payload.reason,
        banExpiresAt,
        updatedAt: new Date()
      }
    });
  }

  async unbanUser(userId: string, adminId: string): Promise<void> {
    if (!(await this.isUserAdmin(adminId))) {
      throw new ForbiddenError('Bu işlem için admin yetkisi gereklidir');
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: false,
        banReason: null,
        banExpiresAt: null,
        updatedAt: new Date()
      }
    });
  }

  async deleteUser(userId: string, adminId: string): Promise<void> {
    if (!(await this.isUserAdmin(adminId))) {
      throw new ForbiddenError('Bu işlem için admin yetkisi gereklidir');
    }

    if (userId === adminId) {
      throw new BadRequestError('Kendinizi silemezsiniz');
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        isActive: false,
        updatedAt: new Date()
      }
    });
  }

  private async isUserAdmin(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              select: { permissions: true }
            }
          }
        }
      }
    });

    if (!user) return false;

    return user.userRoles.some(userRole => {
      const permissions = userRole.role.permissions as string[];
      return permissions.includes('*') || permissions.includes('admin:user-management');
    });
  }
  private buildOrderBy(sortBy: string, sortOrder: string) {
    const order = sortOrder === 'asc' ? 'asc' : 'desc';
    
    switch (sortBy) {
      case 'username':
        return { username: order };
      case 'firstName':
        return { firstName: order };
      default:
        return { createdAt: order };
    }
  }
}

export const userService = new UserService();