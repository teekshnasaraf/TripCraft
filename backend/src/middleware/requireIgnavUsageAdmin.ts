import type { RequestHandler } from "express";
import { config } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

export const requireIgnavUsageAdmin: RequestHandler = (
  request,
  _response,
  next,
) => {
  const email = request.authUser?.email.trim().toLowerCase();
  if (!email || !config.ignav.usageAdminEmails.includes(email)) {
    next(new AppError(403, "Flight usage statistics are restricted."));
    return;
  }
  next();
};
