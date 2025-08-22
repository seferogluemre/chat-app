import { z } from 'zod';

export const inviteMembersSchema = z.object({
  roomId: z.string().uuid(),
  userIds: z.array(z.string().uuid()).min(1).max(10),
  message: z.string().max(200).optional()
});

export const kickMemberSchema = z.object({
  reason: z.string().max(500).optional()
});

export const banMemberSchema = z.object({
  reason: z.string().min(5).max(500),
  duration: z.number().int().min(1).max(365).optional()
});

export const memberParamsSchema = z.object({
  roomId: z.string().uuid(),
  userId: z.string().uuid()
});