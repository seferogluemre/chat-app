import { z } from "zod";

export const userSearchSchema = z.object({
  query: z
    .string()
    .min(1, "Arama terimi en az 1 karakter olmalıdır")
    .max(50, "Arama terimi en fazla 50 karakter olabilir")
    .trim()
    .optional(),

  isActive: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),

  isBanned: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),

  sortBy: z.enum(["username", "firstName", "createdAt"]).default("createdAt"),

  sortOrder: z.enum(["asc", "desc"]).default("desc"),

  page: z
    .string()
    .regex(/^\d+$/)
    .transform((val) => Math.max(1, parseInt(val)))
    .default("1"),

  limit: z
    .string()
    .regex(/^\d+$/)
    .transform((val) => Math.min(100, Math.max(1, parseInt(val))))
    .default("20"),
});

export const userParamsSchema = z.object({
  userId: z
    .string({ message: "User ID gereklidir" })
    .uuid("Geçerli user ID giriniz"),
});

export const updateUserSchema = z.object({
  firstName: z
    .string()
    .min(2, "Ad en az 2 karakter olmalıdır")
    .max(50, "Ad en fazla 50 karakter olabilir")
    .trim()
    .optional(),

  lastName: z
    .string()
    .min(2, "Soyad en az 2 karakter olmalıdır")
    .max(50, "Soyad en fazla 50 karakter olabilir")
    .trim()
    .optional(),

  username: z
    .string()
    .min(3, "Kullanıcı adı en az 3 karakter olmalıdır")
    .max(50, "Kullanıcı adı en fazla 50 karakter olabilir")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir"
    )
    .toLowerCase()
    .trim()
    .optional(),

  bio: z
    .string()
    .max(255, "Bio en fazla 255 karakter olabilir")
    .trim()
    .optional(),

  profileImage: z
    .string()
    .url("Geçerli bir URL giriniz")
    .optional()
    .or(z.literal("")),

  email: z.string().email("Geçerli bir email adresi giriniz").optional(),

  isActive: z.boolean().optional(),

  emailVerified: z.boolean().optional(),
});

export const banUserSchema = z.object({
  reason: z
    .string({ message: "Ban sebebi gereklidir" })
    .min(5, "Ban sebebi en az 5 karakter olmalıdır")
    .max(500, "Ban sebebi en fazla 500 karakter olabilir"),

  duration: z
    .number()
    .int("Süre tam sayı olmalıdır")
    .min(1, "En az 1 gün olmalıdır")
    .max(3650, "En fazla 10 yıl olabilir")
    .optional(), 
});

export type UserSearchDto = z.infer<typeof userSearchSchema>;
export type UserParamsDto = z.infer<typeof userParamsSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type BanUserDto = z.infer<typeof banUserSchema>;
