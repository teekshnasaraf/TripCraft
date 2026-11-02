import { Router } from "express";
import mongoose from "mongoose";
import { config } from "../config/env.js";

export const healthRouter = Router();

healthRouter.get("/health", (_request, response) => {
  response.status(200).json({
    status: "ok",
    service: "TripCraft API",
    database: {
      configured: Boolean(config.mongodbUri),
      connected: mongoose.connection.readyState === 1,
    },
  });
});
