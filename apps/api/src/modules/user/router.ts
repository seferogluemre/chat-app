import { Router } from "express";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middlewares/validation.middleware";
import {
  authenticate,
  requirePermission,
} from "../auth/permissions/middleware";
import { userController } from "./controller";
import {
  banUserSchema,
  updateUserSchema,
  userParamsSchema,
  userSearchSchema,
} from "./dtos";

const router = Router();

router.use(authenticate);

router.get(
  "/search",
  validateQuery(userSearchSchema),
  userController.searchUsers.bind(userController)
);

router.get(
  "/:userId",
  validateParams(userParamsSchema),
  userController.getUserProfile.bind(userController)
);

router.put(
  "/:userId",
  requirePermission("admin:user-management"),
  validateParams(userParamsSchema),
  validateBody(updateUserSchema),
  userController.updateUser.bind(userController)
);

router.post(
  "/:userId/ban",
  requirePermission("admin:user-management"),
  validateParams(userParamsSchema),
  validateBody(banUserSchema),
  userController.banUser.bind(userController)
);

router.delete(
  "/:userId/ban",
  requirePermission("admin:user-management"),
  validateParams(userParamsSchema),
  userController.unbanUser.bind(userController)
);

router.delete(
  "/:userId",
  requirePermission("admin:user-management"),
  validateParams(userParamsSchema),
  userController.deleteUser.bind(userController)
);

export { router as userRoutes };

