import { Router } from "express";
import {
  validateBody,
  validateParams,
} from "../../middlewares/validation.middleware";
import { authenticate } from "../auth/permissions/middleware";
import { membershipController } from "./controller";
import {
  inviteMembersSchema,
  kickMemberSchema,
  memberParamsSchema,
} from "./dtos";

const router = Router();
router.use(authenticate);

router.post(
  "/invite",
  validateBody(inviteMembersSchema),
  membershipController.inviteMembers.bind(membershipController)
);

router.delete(
  "/:roomId/:userId",
  validateParams(memberParamsSchema),
  validateBody(kickMemberSchema),
  membershipController.kickMember.bind(membershipController)
);

router.delete(
  "/:roomId/leave",
  membershipController.leaveRoom.bind(membershipController)
);

export { router as membershipRoutes };

