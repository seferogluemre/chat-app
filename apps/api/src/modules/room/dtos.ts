import { z } from "zod";

export const createRoomSchema = z.object({
  name: z
    .string()
    .min(2, "Oda adı en az 2 karakter olmalıdır")
    .max(100, "Oda adı en fazla 100 karakter olabilir")
    .trim(),

  description: z
    .string()
    .max(500, "Açıklama en fazla 500 karakter olabilir")
    .trim()
    .optional(),

  isPrivate: z.boolean().default(false),

  maxMembers: z
    .number()
    .int("Üye sayısı tam sayı olmalıdır")
    .min(2, "En az 2 üye olmalıdır")
    .max(1000, "En fazla 1000 üye olabilir")
    .optional(),

  roomImage: z
    .string()
    .url("Geçerli bir URL giriniz")
    .optional()
    .or(z.literal("")),

  memberIds: z
    .array(z.string().uuid("Geçerli kullanıcı ID giriniz"))
    .max(50, "En fazla 50 üye davet edilebilir")
    .optional(),
});

export const updateRoomSchema = z.object({
  name: z
    .string()
    .min(2, 'Oda adı en az 2 karakter olmalıdır')
    .max(100, 'Oda adı en fazla 100 karakter olabilir')
    .trim()
    .optional(),
  
  description: z
    .string()
    .max(500, 'Açıklama en fazla 500 karakter olabilir')
    .trim()
    .optional()
    .or(z.literal('')),
  
  isPrivate: z
    .boolean()
    .optional(),
  
  maxMembers: z
    .number()
    .int('Üye sayısı tam sayı olmalıdır')
    .min(2, 'En az 2 üye olmalıdır')
    .max(1000, 'En fazla 1000 üye olabilir')
    .optional()
    .nullable(),
  
  roomImage: z
    .string()
    .url('Geçerli bir URL giriniz')
    .optional()
    .or(z.literal('')),

  memberIds: z
    .array(z.string().uuid('Geçerli kullanıcı ID giriniz'))
    .max(50, 'En fazla 50 üye davet edilebilir')
    .optional()
});

export const createDMSchema = z.object({
  participantId: z
    .string({ message: "Katılımcı ID gereklidir" })
    .uuid("Geçerli kullanıcı ID giriniz"),
});

export const roomSearchSchema = z.object({
  query: z
    .string()
    .min(1, "Arama terimi en az 1 karakter olmalıdır")
    .max(100, "Arama terimi en fazla 100 karakter olabilir")
    .trim()
    .optional(),

  isPrivate: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),

  isArchived: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),

  createdById: z.string().uuid("Geçerli kullanıcı ID giriniz").optional(),

  minMembers: z
    .string()
    .regex(/^\d+$/, "Sayı giriniz")
    .transform((val) => parseInt(val))
    .optional(),

  maxMembers: z
    .string()
    .regex(/^\d+$/, "Sayı giriniz")
    .transform((val) => parseInt(val))
    .optional(),

  sortBy: z
    .enum(["name", "memberCount", "createdAt", "lastMessageAt"])
    .default("createdAt"),

  sortOrder: z.enum(["asc", "desc"]).default("desc"),

  page: z
    .string()
    .regex(/^\d+$/, "Sayfa numarası sayı olmalıdır")
    .transform((val) => Math.max(1, parseInt(val)))
    .default(1),

  limit: z
    .string()
    .regex(/^\d+$/, "Limit sayı olmalıdır")
    .transform((val) => Math.min(100, Math.max(1, parseInt(val))))
    .default(20),
});

export const roomParamsSchema = z.object({
  roomId: z
    .string({ message: "Oda ID gereklidir" })
    .uuid("Geçerli oda ID giriniz"),
});

export const inviteMembersSchema = z.object({
  memberIds: z
    .array(z.string().uuid("Geçerli kullanıcı ID giriniz"))
    .min(1, "En az 1 kullanıcı seçmelisiniz")
    .max(50, "En fazla 50 kullanıcı davet edilebilir"),
});

export const removeMemberSchema = z.object({
  memberId: z
    .string({ message: "Üye ID gereklidir" })
    .uuid("Geçerli kullanıcı ID giriniz"),
});

export const archiveRoomSchema = z.object({
  archived: z.boolean().default(true),
});

export type CreateRoomDto = z.infer<typeof createRoomSchema>;
export type UpdateRoomDto = z.infer<typeof updateRoomSchema>;
export type CreateDMDto = z.infer<typeof createDMSchema>;
export type RoomSearchDto = z.infer<typeof roomSearchSchema>;
export type RoomParamsDto = z.infer<typeof roomParamsSchema>;
export type InviteMembersDto = z.infer<typeof inviteMembersSchema>;
export type RemoveMemberDto = z.infer<typeof removeMemberSchema>;
export type ArchiveRoomDto = z.infer<typeof archiveRoomSchema>;