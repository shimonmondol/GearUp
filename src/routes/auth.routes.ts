import { Router } from "express";
import * as authController from "../controllers/auth.controller.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import { registerSchema, loginSchema } from "../validations/auth.validation.ts";

const router = Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);

export default router;
