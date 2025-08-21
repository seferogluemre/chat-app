import {
    BadRequestError,
    NotFoundError,
    UnauthorizedError,
} from "@/utils/http-errors";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import prisma from "../../../core/prisma";
import { DEFAULT_ROLE_PERMISSIONS } from "../permissions/constants";
import {
    JWTPayload,
    LoginPayload,
    LoginResponse,
    RegisterPayload,
    SessionInfo,
} from "./types";

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET!;
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
  private readonly SALT_ROUNDS = 12;

  /**
   * Kullanıcı kaydı
   */
  async register(payload: RegisterPayload): Promise<LoginResponse> {
    const { email, firstName, lastName, username, password, bio } = payload;

    // Email ve username kontrolü
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new BadRequestError("Bu email adresi zaten kullanılıyor");
      }
      if (existingUser.username === username) {
        throw new BadRequestError("Bu kullanıcı adı zaten kullanılıyor");
      }
    }

    // Şifreyi hash'le
    const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);
    const fullName = `${firstName} ${lastName}`;

    // Transaction ile user ve default role oluştur
    const result = await prisma.$transaction(async (tx) => {
      // User oluştur
      const user = await tx.user.create({
        data: {
          email,
          firstName,
          lastName,
          fullName,
          username,
          passwordHash,
          bio,
          emailVerified: false,
          isActive: true,
        },
      });

      // Default MEMBER role'ünü bul veya oluştur
      let memberRole = await tx.role.findUnique({
        where: { slug: "member" },
      });

      if (!memberRole) {
        memberRole = await tx.role.create({
          data: {
            name: "Member",
            slug: "member",
            description: "Varsayılan üye rolü",
            permissions: DEFAULT_ROLE_PERMISSIONS.MEMBER,
            isGlobal: true,
          },
        });
      }

      // User'a role ata
      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: memberRole.id,
        },
      });

      return user;
    });

    // Login response oluştur
    return await this.createLoginResponse(result, payload.email);
  }

  /**
   * Kullanıcı girişi
   */
  async login(
    payload: LoginPayload,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LoginResponse> {
    const { email, password } = payload;

    // User'ı bul
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError("Email veya şifre hatalı");
    }

    // Aktif mi kontrol et
    if (!user.isActive || user.deletedAt) {
      throw new UnauthorizedError("Hesabınız deaktif durumda");
    }

    // Ban kontrolü
    if (
      user.isBanned &&
      (!user.banExpiresAt || user.banExpiresAt > new Date())
    ) {
      throw new UnauthorizedError("Hesabınız yasaklanmış");
    }

    // Şifre kontrolü
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Email veya şifre hatalı");
    }

    return await this.createLoginResponse(user, email, ipAddress, userAgent);
  }

  /**
   * Token doğrulama
   */
  async verifyToken(token: string): Promise<JWTPayload> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as JWTPayload;

      // Session kontrolü
      const session = await prisma.session.findUnique({
        where: { id: decoded.sessionId },
      });

      if (!session || session.expiresAt < new Date()) {
        throw new UnauthorizedError("Session süresi dolmuş");
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError("Geçersiz token");
      }
      throw error;
    }
  }

  /**
   * Logout
   */
  async logout(sessionId: string): Promise<void> {
    await prisma.session.delete({
      where: { id: sessionId },
    });
  }

  /**
   * Şifre değiştirme
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("Kullanıcı bulunamadı");
    }

    // Mevcut şifre kontrolü
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );
    if (!isCurrentPasswordValid) {
      throw new BadRequestError("Mevcut şifre hatalı");
    }

    // Yeni şifreyi hash'le ve güncelle
    const newPasswordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });
  }

  /**
   * Kullanıcı session'larını listele
   */
  async getUserSessions(userId: string): Promise<SessionInfo[]> {
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    return sessions.map((session) => ({
      id: session.id,
      token: session.token.substring(0, 10) + "...", // Güvenlik için kısalt
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
    }));
  }

  /**
   * Session sonlandır
   */
  async revokeSession(userId: string, sessionId: string): Promise<void> {
    await prisma.session.deleteMany({
      where: {
        id: sessionId,
        userId, // Güvenlik için user kontrolü
      },
    });
  }

  /**
   * Tüm session'ları sonlandır (logout from all devices)
   */
  async revokeAllSessions(
    userId: string,
    exceptSessionId?: string
  ): Promise<void> {
    await prisma.session.deleteMany({
      where: {
        userId,
        ...(exceptSessionId && { id: { not: exceptSessionId } }),
      },
    });
  }

  /**
   * Login response oluşturma helper'ı
   */
  private async createLoginResponse(
    user: any,
    email: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LoginResponse> {
    // Session oluştur
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 gün

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: crypto.randomBytes(64).toString("hex"),
        ipAddress,
        userAgent,
        expiresAt,
      },
    });

    // JWT token oluştur
    const jwtPayload: JWTPayload = {
      userId: user.id,
      sessionId: session.id,
    };

    const token = jwt.sign(jwtPayload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        username: user.username,
        profileImage: user.profileImage,
        bio: user.bio,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
      },
      token,
      expiresAt,
    };
  }
}

// Singleton instance
export const authService = new AuthService();
