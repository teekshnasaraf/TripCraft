import type { RequestHandler } from "express";
import { getAuthenticatedUser, verifyAccessToken } from "../services/auth.service.js";
import { AppError } from "../utils/AppError.js";

export const authenticate: RequestHandler = async (
  request,
  _response,
  next,
) => {
  const authorization = request.get("authorization");
  const match = authorization?.match(/^Bearer ([^\s]+)$/i);

  if (!match) {
    next(new AppError(401, "Authentication is required."));
    return;
  }

  try {
    const userId = verifyAccessToken(match[1]);
    request.authUser = await getAuthenticatedUser(userId);
    next();
  } catch (error) {
    next(error);
  }
};
