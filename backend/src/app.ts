import cors from "cors";
import express from "express";
import { config } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { healthRouter } from "./routes/health.routes.js";

export const app = express();

app.use(
  cors({
    origin: config.clientUrl,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use("/api", healthRouter);
app.use(notFound);
app.use(errorHandler);
