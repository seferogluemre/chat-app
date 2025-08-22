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

router.get(
  '/room/:roomId',
  validateParams(roomMessagesSchema),
  validateQuery(roomMessagesSchema.omit({ roomId: true })),
  messageController.getRoomMessages.bind(messageController)
);

router.post(
  '/',
  validateBody(sendMessageSchema),
  messageController.sendMessage.bind(messageController)
);

router.put(
  '/:messageId',
  validateParams(messageParamsSchema),
  validateBody(updateMessageSchema),
  messageController.updateMessage.bind(messageController)
);

router.delete(
  '/:messageId',
  validateParams(messageParamsSchema),
  messageController.deleteMessage.bind(messageController)
);

router.post(
  '/:messageId/pin',
  validateParams(messageParamsSchema),
  validateBody(pinMessageSchema),
  messageController.togglePinMessage.bind(messageController)
);

router.post(
  '/:messageId/react',
  validateParams(messageParamsSchema),
  validateBody(reactionSchema),
  messageController.toggleReaction.bind(messageController)
);

export { router as messageRoutes };

