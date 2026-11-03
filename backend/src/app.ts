import cors from "cors";
import express from "express";
import { config } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { requireDatabase } from "./middleware/requireDatabase.js";
import { authRouter } from "./routes/auth.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { tripRouter } from "./routes/trip.routes.js";

export const app = express();

app.use(
  cors({
    origin: config.clientUrl,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use("/api", healthRouter);
app.use("/api/auth", requireDatabase, authRouter);
app.use("/api/trips", requireDatabase, tripRouter);
app.use(notFound);
app.use(errorHandler);
