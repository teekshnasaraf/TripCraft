import { Router } from "express";
import {
  currentUser,
  login,
  register,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/authenticate.js";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", authenticate, currentUser);
