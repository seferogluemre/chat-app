import { z } from 'zod';

export const sendMessageSchema = z.object({
  roomId: z
    .string({ message: 'Room ID gereklidir' })
    .uuid('Geçerli room ID giriniz'),
  
  content: z
    .string({ message: 'Mesaj içeriği gereklidir' })
    .min(1, 'Mesaj boş olamaz')
    .max(4000, 'Mesaj en fazla 4000 karakter olabilir')
    .trim(),
  
  replyToId: z
    .string()
    .uuid('Geçerli mesaj ID giriniz')
    .optional(),
  
  attachments: z
    .array(
      z.object({
        url: z.string().url('Geçerli URL giriniz'),
        type: z.enum(['image', 'file', 'video']),
        name: z.string().max(255, 'Dosya adı en fazla 255 karakter olabilir'),
        size: z.number().int().max(50 * 1024 * 1024) 
      })
    )
    .max(5, 'En fazla 5 dosya eklenebilir')
    .optional()
});

export const updateMessageSchema = z.object({
  content: z
    .string({ message: 'Mesaj içeriği gereklidir' })
    .min(1, 'Mesaj boş olamaz')
    .max(4000, 'Mesaj en fazla 4000 karakter olabilir')
    .trim()
});

export const messageParamsSchema = z.object({
  messageId: z
    .string({ message: 'Message ID gereklidir' })
    .uuid('Geçerli message ID giriniz')
});

export const roomMessagesSchema = z.object({
  roomId: z
    .string({ message: 'Room ID gereklidir' })
    .uuid('Geçerli room ID giriniz'),
  
  search: z
    .string()
    .min(1, 'Arama terimi en az 1 karakter olmalıdır')
    .max(100, 'Arama terimi en fazla 100 karakter olabilir')
    .trim()
    .optional(),
  
  senderId: z
    .string()
    .uuid('Geçerli user ID giriniz')
    .optional(),
  
  isPinned: z
    .enum(['true', 'false'])
    .transform(val => val === 'true')
    .optional(),
  
  after: z
    .string()
    .datetime('Geçerli tarih formatı giriniz')
    .transform(val => new Date(val))
    .optional(),
  
  before: z
    .string()
    .datetime('Geçerli tarih formatı giriniz')
    .transform(val => new Date(val))
    .optional(),
  
  replyToId: z
    .string()
    .uuid('Geçerli message ID giriniz')
    .optional(),
  
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc'),
  
  page: z
    .string()
    .regex(/^\d+$/)
    .transform(val => Math.max(1, parseInt(val)))
    .default('1'),
  
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform(val => Math.min(100, Math.max(1, parseInt(val))))
    .default('50')
});

export const pinMessageSchema = z.object({
  pinned: z
    .boolean()
    .default(true)
});

export const reactionSchema = z.object({
  emoji: z
    .string({ message: 'Emoji gereklidir' })
    .min(1, 'Emoji boş olamaz')
    .max(10, 'Emoji en fazla 10 karakter olabilir')
    .regex(/^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]$/u, 'Geçerli emoji giriniz'),
  
  action: z
    .enum(['add', 'remove'])
    .default('add')
});

export type SendMessageDto = z.infer<typeof sendMessageSchema>;
export type UpdateMessageDto = z.infer<typeof updateMessageSchema>;
export type MessageParamsDto = z.infer<typeof messageParamsSchema>;
export type RoomMessagesDto = z.infer<typeof roomMessagesSchema>;
export type PinMessageDto = z.infer<typeof pinMessageSchema>;
export type ReactionDto = z.infer<typeof reactionSchema>;