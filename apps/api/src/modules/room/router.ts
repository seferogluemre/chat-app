import { Router } from 'express';
import { validateBody, validateParams, validateQuery } from '../../middlewares/validation.middleware';
import { authenticate, requirePermission, requireRoomMembership } from '../auth/permissions/middleware';
import { roomController } from './controller';
import {
  archiveRoomSchema,
  createDMSchema,
  createRoomSchema,
  roomParamsSchema,
  roomSearchSchema,
  updateRoomSchema
} from './dtos';

const router = Router();

router.use(authenticate);

router.get(
  '/', 
  roomController.getUserRooms.bind(roomController)
);

router.get(
  '/public', 
  validateQuery(roomSearchSchema),
  roomController.getPublicRooms.bind(roomController)
);

router.get(
  '/search', 
  validateQuery(roomSearchSchema),
  roomController.searchRooms.bind(roomController)
);

router.post(
  '/',
  requirePermission('rooms:create'),
  validateBody(createRoomSchema),
  roomController.createRoom.bind(roomController)
);

router.post(
  '/dm',
  validateBody(createDMSchema),
  roomController.createDMRoom.bind(roomController)
);

router.get(
  '/:roomId',
  validateParams(roomParamsSchema),
  roomController.getRoomById.bind(roomController)
);

router.put(
  '/:roomId',
  validateParams(roomParamsSchema),
  validateBody(updateRoomSchema),
  requireRoomMembership(),
  roomController.updateRoom.bind(roomController)
);

router.delete(
  '/:roomId',
  validateParams(roomParamsSchema),
  requireRoomMembership(),
  roomController.deleteRoom.bind(roomController)
);

router.post(
  '/:roomId/archive',
  validateParams(roomParamsSchema),
  validateBody(archiveRoomSchema),
  requireRoomMembership(),
  roomController.toggleArchiveRoom.bind(roomController)
);

router.get(
  '/:roomId/members',
  validateParams(roomParamsSchema),
  requireRoomMembership(),
  roomController.getRoomMembers.bind(roomController)
);

export { router as roomRoutes };

