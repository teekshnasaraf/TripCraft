import { app } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { config } from "./config/env.js";

async function startServer(): Promise<void> {
  await connectDatabase();

  app.listen(config.port, () => {
    console.info(`TripCraft API listening on port ${config.port}.`);
  });
}

startServer().catch((error: unknown) => {
  console.error("Failed to start TripCraft API:", error);
  process.exitCode = 1;
});
