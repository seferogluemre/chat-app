import { validateBody } from "@/middlewares/validation.middleware";
import { Router } from "express";
import { authenticate } from "../permissions/middleware";
import { authController } from "./controller";
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from "./dtos";

const router = Router();

router.post(
  "/register",
  validateBody(registerSchema),
  authController.register.bind(authController)
);
router.post(
  "/login",
  validateBody(loginSchema),
  authController.login.bind(authController)
);
router.get("/verify", authController.verifyToken.bind(authController));

router.use(authenticate);

router.post("/logout", authController.logout.bind(authController));
router.get("/me", authController.getProfile.bind(authController));
router.put(
  "/profile",
  validateBody(updateProfileSchema),
  authController.updateProfile.bind(authController)
);
router.post(
  "/change-password",
  validateBody(changePasswordSchema),
  authController.changePassword.bind(authController)
);
router.get("/sessions", authController.getSessions.bind(authController));

router.delete(
  "/sessions/:sessionId",
  authController.revokeSession.bind(authController)
);

router.delete(
  "/sessions",
  authController.revokeAllSessions.bind(authController)
);

export { router as authRoutes };

