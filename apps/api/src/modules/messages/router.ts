import { Router } from 'express';
import { validateBody, validateParams, validateQuery } from '../../middlewares/validation.middleware';
import { authenticate } from '../auth/permissions/middleware';
import { messageController } from './controller';
import {
  messageParamsSchema,
  pinMessageSchema,
  reactionSchema,
  roomMessagesSchema,
  sendMessageSchema,
  updateMessageSchema
} from './dtos';

const router = Router();

router.use(authenticate);

// Room messages - GET /api/messages/room/:roomId
router.get(
  '/room/:roomId',
  validateParams(roomMessagesSchema),
  validateQuery(roomMessagesSchema.omit({ roomId: true })),
  messageController.getRoomMessages.bind(messageController)
);

// Send message - POST /api/messages
router.post(
  '/',
  validateBody(sendMessageSchema),
  messageController.sendMessage.bind(messageController)
);

// Update message - PUT /api/messages/:messageId
router.put(
  '/:messageId',
  validateParams(messageParamsSchema),
  validateBody(updateMessageSchema),
  messageController.updateMessage.bind(messageController)
);

// Delete message - DELETE /api/messages/:messageId
router.delete(
  '/:messageId',
  validateParams(messageParamsSchema),
  messageController.deleteMessage.bind(messageController)
);

// Pin/unpin message - POST /api/messages/:messageId/pin
router.post(
  '/:messageId/pin',
  validateParams(messageParamsSchema),
  validateBody(pinMessageSchema),
  messageController.togglePinMessage.bind(messageController)
);

// Add/remove reaction - POST /api/messages/:messageId/react
router.post(
  '/:messageId/react',
  validateParams(messageParamsSchema),
  validateBody(reactionSchema),
  messageController.toggleReaction.bind(messageController)
);

export { router as messageRoutes };

