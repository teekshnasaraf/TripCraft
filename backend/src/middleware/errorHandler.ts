import type { ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import { AppError } from "../utils/AppError.js";

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  next,
) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  const errorName = error instanceof Error ? error.name : "UnknownError";
  console.error(`Request failed (${errorName}).`);

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    response.status(400).json({
      success: false,
      message: "Request validation failed.",
    });
    return;
  }

  if (error instanceof mongoose.Error.CastError) {
    response.status(400).json({
      success: false,
      message: "Request contains an invalid identifier or value.",
    });
    return;
  }

  if (isDuplicateKeyError(error)) {
    response.status(409).json({
      success: false,
      message: "A record with the supplied unique value already exists.",
    });
    return;
  }

  if (
    error instanceof SyntaxError &&
    "status" in error &&
    error.status === 400
  ) {
    response.status(400).json({
      success: false,
      message: "Request body must contain valid JSON.",
    });
    return;
  }

  if (
    error instanceof Error &&
    (error.name === "MongoServerSelectionError" ||
      error.name === "MongoNetworkError" ||
      error.name === "MongooseServerSelectionError")
  ) {
    response.status(503).json({
      success: false,
      message: "Database service is unavailable. Please try again later.",
    });
    return;
  }

  response.status(500).json({
    success: false,
    message: "An unexpected server error occurred.",
  });
};

function isDuplicateKeyError(
  error: unknown,
): error is { code: number } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}
