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

function readIntegerEnvironmentVariable(
  name: string,
  fallback: number,
  minimum: number,
): number {
  const rawValue = process.env[name];
  if (rawValue === undefined || rawValue.trim() === "") {
    return fallback;
  }
  if (!/^\d+$/.test(rawValue.trim())) {
    throw new Error(`${name} must be a positive integer.`);
  }
  const value = Number(rawValue);
  if (!Number.isSafeInteger(value) || value < minimum) {
    throw new Error(`${name} must be an integer of at least ${minimum}.`);
  }
  return value;
}

function readBooleanEnvironmentVariable(
  name: string,
  fallback: boolean,
): boolean {
  const rawValue = process.env[name]?.trim().toLowerCase();
  if (rawValue === undefined || rawValue === "") {
    return fallback;
  }
  if (rawValue === "true") {
    return true;
  }
  if (rawValue === "false") {
    return false;
  }
  throw new Error(`${name} must be true or false.`);
}

const ignavFreeAllowance = readIntegerEnvironmentVariable(
  "IGNAV_FREE_ALLOWANCE",
  1_000,
  1,
);
const ignavInternalLimit = readIntegerEnvironmentVariable(
  "IGNAV_INTERNAL_LIMIT",
  800,
  1,
);
const ignavInitialUsed = readIntegerEnvironmentVariable(
  "IGNAV_INITIAL_USED",
  2,
  0,
);
const ignavCacheTtlMinutes = readIntegerEnvironmentVariable(
  "IGNAV_CACHE_TTL_MINUTES",
  30,
  1,
);
const ignavUserRateLimitPerMinute = readIntegerEnvironmentVariable(
  "IGNAV_USER_RATE_LIMIT_PER_MINUTE",
  10,
  1,
);
const ignavRequestTimeoutMs = readIntegerEnvironmentVariable(
  "IGNAV_REQUEST_TIMEOUT_MS",
  30_000,
  1_000,
);

if (ignavInternalLimit > ignavFreeAllowance) {
  throw new Error("IGNAV_INTERNAL_LIMIT cannot exceed IGNAV_FREE_ALLOWANCE.");
}
if (ignavInitialUsed > ignavInternalLimit) {
  throw new Error("IGNAV_INITIAL_USED cannot exceed IGNAV_INTERNAL_LIMIT.");
}

export const config = {
  port,
  nodeEnv,
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
  mongodbUri: process.env.MONGODB_URI?.trim() || undefined,
  jwtSecret: process.env.JWT_SECRET?.trim() || undefined,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN?.trim() || "15m",
  ignav: {
    freeAllowance: ignavFreeAllowance,
    internalLimit: ignavInternalLimit,
    initialUsed: ignavInitialUsed,
    cacheTtlMs: ignavCacheTtlMinutes * 60_000,
    userRateLimitPerMinute: ignavUserRateLimitPerMinute,
    requestTimeoutMs: ignavRequestTimeoutMs,
    liveSearchEnabled: readBooleanEnvironmentVariable(
      "IGNAV_LIVE_SEARCH_ENABLED",
      false,
    ),
    get usageAdminEmails(): readonly string[] {
      return (process.env.IGNAV_USAGE_ADMIN_EMAILS ?? "")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);
    },
  },
} as const;
