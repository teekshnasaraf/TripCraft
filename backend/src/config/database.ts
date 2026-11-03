import mongoose from "mongoose";
import { config } from "./env.js";

export async function connectDatabase(): Promise<void> {
  if (!config.mongodbUri) {
    console.warn(
      "MongoDB is not configured. Database-backed API calls will return 503.",
    );
    return;
  }

  if (
    config.mongodbUri.includes("<db_username>") ||
    config.mongodbUri.includes("<db_password>") ||
    config.mongodbUri.includes("<cluster-host>")
  ) {
    console.warn(
      "MongoDB URI still contains placeholders. Atlas connection was not attempted; database-backed API calls will return 503.",
    );
    return;
  }

  try {
    await mongoose.connect(config.mongodbUri);
    console.info("Connected to MongoDB.");
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(
      `MongoDB connection failed (${errorName}). Database-backed API calls will return 503.`,
    );
  }
}
