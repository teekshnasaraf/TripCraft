import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

dotenv.config({
  path: fileURLToPath(new URL("../../.env", import.meta.url)),
});

const port = Number(process.env.PORT ?? 5000);

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

const nodeEnv = process.env.NODE_ENV ?? "development";

if (!["development", "test", "production"].includes(nodeEnv)) {
  throw new Error("NODE_ENV must be development, test, or production.");
}

export const config = {
  port,
  nodeEnv,
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
  mongodbUri: process.env.MONGODB_URI?.trim() || undefined,
  jwtSecret: process.env.JWT_SECRET?.trim() || undefined,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN?.trim() || "15m",
} as const;
