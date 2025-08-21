import { z } from 'zod';

export const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email adresi gereklidir' })
    .email('Geçerli bir email adresi giriniz')
    .min(3, 'Email en az 3 karakter olmalıdır')
    .max(255, 'Email en fazla 255 karakter olabilir')
    .toLowerCase()
    .trim(),
  
  firstName: z
    .string({ required_error: 'Ad gereklidir' })
    .min(2, 'Ad en az 2 karakter olmalıdır')
    .max(50, 'Ad en fazla 50 karakter olabilir')
    .trim(),
  
  lastName: z
    .string({ required_error: 'Soyad gereklidir' })
    .min(2, 'Soyad en az 2 karakter olmalıdır')
    .max(50, 'Soyad en fazla 50 karakter olabilir')
    .trim(),
  
  username: z
    .string({ required_error: 'Kullanıcı adı gereklidir' })
    .min(3, 'Kullanıcı adı en az 3 karakter olmalıdır')
    .max(50, 'Kullanıcı adı en fazla 50 karakter olabilir')
    .regex(/^[a-zA-Z0-9_]+$/, 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir')
    .toLowerCase()
    .trim(),
  
  password: z
    .string({ required_error: 'Şifre gereklidir' })
    .min(8, 'Şifre en az 8 karakter olmalıdır')
    .max(128, 'Şifre en fazla 128 karakter olabilir')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir'
    ),
  
  bio: z
    .string()
    .max(255, 'Bio en fazla 255 karakter olabilir')
    .trim()
    .optional()
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email adresi gereklidir' })
    .email('Geçerli bir email adresi giriniz')
    .toLowerCase()
    .trim(),
  
  password: z
    .string({ required_error: 'Şifre gereklidir' })
    .min(1, 'Şifre boş olamaz')
});

export const passwordResetRequestSchema = z.object({
  email: z
    .string({ required_error: 'Email adresi gereklidir' })
    .email('Geçerli bir email adresi giriniz')
    .toLowerCase()
    .trim()
});

export const passwordResetConfirmSchema = z.object({
  token: z
    .string({ required_error: 'Reset token gereklidir' })
    .min(1, 'Token boş olamaz'),
  
  newPassword: z
    .string({ required_error: 'Yeni şifre gereklidir' })
    .min(8, 'Şifre en az 8 karakter olmalıdır')
    .max(128, 'Şifre en fazla 128 karakter olabilir')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir'
    )
});

export const changePasswordSchema = z.object({
  currentPassword: z
    .string({ required_error: 'Mevcut şifre gereklidir' })
    .min(1, 'Mevcut şifre boş olamaz'),
  
  newPassword: z
    .string({ required_error: 'Yeni şifre gereklidir' })
    .min(8, 'Yeni şifre en az 8 karakter olmalıdır')
    .max(128, 'Yeni şifre en fazla 128 karakter olabilir')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Yeni şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir'
    )
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'Yeni şifre mevcut şifreden farklı olmalıdır',
  path: ['newPassword']
});

export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(2, 'Ad en az 2 karakter olmalıdır')
    .max(50, 'Ad en fazla 50 karakter olabilir')
    .trim()
    .optional(),
  
  lastName: z
    .string()
    .min(2, 'Soyad en az 2 karakter olmalıdır')
    .max(50, 'Soyad en fazla 50 karakter olabilir')
    .trim()
    .optional(),
  
  bio: z
    .string()
    .max(255, 'Bio en fazla 255 karakter olabilir')
    .trim()
    .optional()
    .or(z.literal('')), // Empty string'e izin ver
  
  profileImage: z
    .string()
    .url('Profil resmi geçerli bir URL olmalıdır')
    .optional()
    .or(z.literal('')) // Empty string'e izin ver
});

export const revokeSessionSchema = z.object({
  sessionId: z
    .string({ required_error: 'Session ID gereklidir' })
    .uuid('Geçerli bir session ID giriniz')
});

export const revokeAllSessionsSchema = z.object({
  currentSessionId: z
    .string()
    .uuid('Geçerli bir session ID giriniz')
    .optional()
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type PasswordResetRequestDto = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetConfirmDto = z.infer<typeof passwordResetConfirmSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
export type RevokeSessionDto = z.infer<typeof revokeSessionSchema>;
export type RevokeAllSessionsDto = z.infer<typeof revokeAllSessionsSchema>;

export const validateSchema = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Validation failed: ${errorMessages.join(', ')}`);
    }
    throw error;
  }
};

export const safeValidateSchema = <T>(schema: z.ZodSchema<T>, data: unknown) => {
  return schema.safeParse(data);
};