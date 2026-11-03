import type { RequestHandler } from "express";
import mongoose from "mongoose";
import { AppError } from "../utils/AppError.js";

export const requireDatabase: RequestHandler = (
  _request,
  _response,
  next,
) => {
  if (mongoose.connection.readyState !== 1) {
    next(
      new AppError(
        503,
        "Database service is unavailable. Please try again later.",
      ),
    );
    return;
  }

  next();
};
