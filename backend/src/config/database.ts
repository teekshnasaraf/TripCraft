import mongoose from "mongoose";
import { config } from "./env.js";

export async function connectDatabase(): Promise<void> {
  if (!config.mongodbUri) {
    console.warn(
      "MongoDB is not configured. The API will start without database connectivity.",
    );
    return;
  }

  await mongoose.connect(config.mongodbUri);
  console.info("Connected to MongoDB.");
}
