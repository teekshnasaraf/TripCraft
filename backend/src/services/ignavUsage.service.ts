import { createHash, randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { config } from "../config/env.js";
import {
  IgnavFlightCache,
  IgnavUsageOperation,
  IgnavUsageState,
  IgnavUserRateLimit,
  type IgnavUsageStateDocument,
} from "../models/IgnavUsage.js";
import { AppError } from "../utils/AppError.js";

const usageStateId = "ignav";

export interface IgnavManagerSettings {
  freeAllowance: number;
  internalLimit: number;
  initialUsed: number;
  cacheTtlMs: number;
  userRateLimitPerMinute: number;
  requestTimeoutMs: number;
  liveSearchEnabled: boolean;
}

export interface IgnavRequestMetadata {
  origin?: string;
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  market?: string;
  adults?: number;
  children?: number;
  infants?: number;
  cabinClass?: string;
}

export interface IgnavUsageSummary {
  provider: "ignav";
  confirmedBillableRequestsUsed: number;
  reservedRequests: number;
  estimatedRemainingInternalBudget: number;
  internalHardLimit: number;
  freeAllowance: number;
  cacheHitCount: number;
  cacheMissCount: number;
  blockedRequestCount: number;
  liveIntegrationEnabled: boolean;
  lastSuccessfulProviderRequestAt: string | null;
  balanceIsProviderVerified: false;
}

export interface IgnavProviderResponse<T> {
  status: number;
  body: T;
  cacheResult?: boolean;
}

export interface RunIgnavOperationOptions<T> {
  userId: string;
  operation: string;
  parameters: Record<string, unknown>;
  metadata?: IgnavRequestMetadata;
  billable?: boolean;
  settings?: IgnavManagerSettings;
  execute: (signal: AbortSignal) => Promise<IgnavProviderResponse<T>>;
}

function getSettings(
  settings: IgnavManagerSettings = config.ignav,
): IgnavManagerSettings {
  return settings;
}

function ensureDatabaseAvailable(): void {
  if (mongoose.connection.readyState !== 1) {
    throw new AppError(503, "Flight usage ledger is unavailable.");
  }
}

function toServiceUnavailable(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  return new AppError(503, "Flight usage ledger is unavailable.");
}

async function getOrCreateUsageState(
  settings: IgnavManagerSettings,
): Promise<IgnavUsageStateDocument> {
  ensureDatabaseAvailable();
  try {
    const state = await IgnavUsageState.findOneAndUpdate(
      { _id: usageStateId },
      {
        $setOnInsert: {
          confirmedUsed: settings.initialUsed,
          reserved: 0,
          cacheHits: 0,
          cacheMisses: 0,
          blockedRequests: 0,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
    if (!state) {
      throw new Error("Usage state was not returned.");
    }
    return state;
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      try {
        const existing = await IgnavUsageState.findById(usageStateId).lean();
        if (existing) {
          return existing;
        }
      } catch {
        throw new AppError(503, "Flight usage ledger is unavailable.");
      }
    }
    throw toServiceUnavailable(error);
  }
}

async function incrementUsageState(
  increments: Partial<
    Pick<
      IgnavUsageStateDocument,
      "confirmedUsed" | "reserved" | "cacheHits" | "cacheMisses" | "blockedRequests"
    >
  >,
  lastSuccessfulRequestAt?: Date,
): Promise<void> {
  ensureDatabaseAvailable();
  try {
    const update: {
      $inc?: Record<string, number>;
      $set?: Record<string, Date>;
    } = {};
    const incrementsToApply: Record<string, number> = {};
    for (const [field, amount] of Object.entries(increments)) {
      if (amount !== undefined && amount !== 0) {
        incrementsToApply[field] = amount;
      }
    }
    if (Object.keys(incrementsToApply).length > 0) {
      update.$inc = incrementsToApply;
    }
    if (lastSuccessfulRequestAt) {
      update.$set = { lastSuccessfulRequestAt };
    }
    if (!update.$inc && !update.$set) {
      return;
    }
    const result = await IgnavUsageState.updateOne(
      { _id: usageStateId },
      update,
    );
    if (result.matchedCount !== 1) {
      throw new Error("Usage state disappeared.");
    }
  } catch (error) {
    throw toServiceUnavailable(error);
  }
}

async function recordBlockedRequest(
  settings: IgnavManagerSettings,
): Promise<void> {
  await getOrCreateUsageState(settings);
  await incrementUsageState({ blockedRequests: 1 });
}

function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }
  if (value !== null && typeof value === "object") {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, child]) => child !== undefined)
        .sort(([first], [second]) => first.localeCompare(second))
        .map(([key, child]) => [key, stableValue(child)]),
    );
  }
  if (
    value === null ||
    typeof value === "string" ||
    (typeof value === "number" && Number.isFinite(value)) ||
    typeof value === "boolean"
  ) {
    return value;
  }
  throw new AppError(400, "Flight search parameters are invalid.");
}

function safeMetadata(
  metadata: IgnavRequestMetadata | undefined,
): Record<string, string | number | boolean | null> {
  if (!metadata) {
    return {};
  }
  const allowedFields = [
    "origin",
    "destination",
    "departureDate",
    "returnDate",
    "market",
    "adults",
    "children",
    "infants",
    "cabinClass",
  ] as const;
  const result: Record<string, string | number | boolean | null> = {};
  for (const field of allowedFields) {
    const value = metadata[field];
    if (value === undefined) {
      continue;
    }
    if (
      typeof value === "string" &&
      value.length <= 120 &&
      /^[\p{L}\p{N} _-]*$/u.test(value)
    ) {
      result[field] = value;
    } else if (typeof value === "number" && Number.isSafeInteger(value)) {
      result[field] = value;
    } else {
      throw new AppError(400, "Flight request metadata is invalid.");
    }
  }
  return result;
}

async function consumeUserRateLimit(
  userId: string,
  settings: IgnavManagerSettings,
): Promise<boolean> {
  const now = new Date();
  const windowStart = new Date(Math.floor(now.getTime() / 60_000) * 60_000);
  const expiresAt = new Date(windowStart.getTime() + 2 * 60_000);
  const id = `${hashValue(userId)}:${windowStart.toISOString()}`;
  try {
    const result = await IgnavUserRateLimit.findOneAndUpdate(
      { _id: id, count: { $lt: settings.userRateLimitPerMinute } },
      {
        $inc: { count: 1 },
        $setOnInsert: { expiresAt },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return Boolean(result);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return false;
    }
    throw toServiceUnavailable(error);
  }
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

async function incrementBlockedAndThrow(
  settings: IgnavManagerSettings,
  statusCode: number,
  message: string,
): Promise<never> {
  await recordBlockedRequest(settings);
  throw new AppError(statusCode, message);
}

type CacheClaim<T> =
  | { kind: "owner"; lockId: string; cacheKey: string }
  | { kind: "hit"; result: T };

async function wait(milliseconds: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function markCacheAmbiguous(
  cacheKey: string,
  lockId: string,
  settings: IgnavManagerSettings,
): Promise<void> {
  const expiresAt = new Date(Date.now() + settings.cacheTtlMs);
  try {
    await IgnavFlightCache.updateOne(
      { _id: cacheKey, lockId, status: "pending" },
      { $set: { status: "ambiguous", expiresAt } },
    );
    await IgnavUsageOperation.updateOne(
      { _id: lockId, status: "reserved" },
      { $set: { status: "ambiguous", resolvedAt: new Date() } },
    );
  } catch (error) {
    throw toServiceUnavailable(error);
  }
}

async function claimCache<T>(
  cacheKey: string,
  settings: IgnavManagerSettings,
): Promise<CacheClaim<T>> {
  const lockId = randomUUID();
  const waitUntil = Date.now() + settings.requestTimeoutMs + 2_000;

  while (true) {
    let existing;
    try {
      existing = await IgnavFlightCache.findById(cacheKey).lean();
    } catch (error) {
      throw toServiceUnavailable(error);
    }

    if (existing?.expiresAt && existing.expiresAt.getTime() <= Date.now()) {
      try {
        await IgnavFlightCache.deleteOne({
          _id: cacheKey,
          expiresAt: { $lte: new Date() },
        });
      } catch (error) {
        throw toServiceUnavailable(error);
      }
      continue;
    }

    if (existing?.status === "completed") {
      await incrementUsageState({ cacheHits: 1 });
      return { kind: "hit", result: existing.result as T };
    }

    if (existing?.status === "ambiguous") {
      await incrementBlockedAndThrow(
        settings,
        503,
        "An identical flight request has an unresolved provider outcome.",
      );
    }

    if (existing?.status === "pending") {
      if (Date.now() >= waitUntil) {
        const staleBefore = new Date(
          Date.now() - settings.requestTimeoutMs - 2_000,
        );
        if (existing.createdAt <= staleBefore) {
          await markCacheAmbiguous(cacheKey, existing.lockId, settings);
        }
        await incrementBlockedAndThrow(
          settings,
          503,
          "An identical flight request is still in progress.",
        );
      }
      await wait(25);
      continue;
    }

    try {
      await IgnavFlightCache.create({
        _id: cacheKey,
        status: "pending",
        lockId,
        createdAt: new Date(),
      });
      await incrementUsageState({ cacheMisses: 1 });
      return { kind: "owner", lockId, cacheKey };
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        continue;
      }
      throw toServiceUnavailable(error);
    }
  }
}

async function reserveCapacity(
  reservationId: string,
  operation: string,
  metadata: Record<string, string | number | boolean | null>,
  billable: boolean,
  settings: IgnavManagerSettings,
): Promise<boolean> {
  if (billable) {
    try {
      const state = await IgnavUsageState.findOneAndUpdate(
        {
          _id: usageStateId,
          $expr: {
            $lt: [
              { $add: ["$confirmedUsed", "$reserved"] },
              settings.internalLimit,
            ],
          },
        },
        { $inc: { reserved: 1 } },
        { new: true },
      );
      if (!state) {
        return false;
      }
    } catch (error) {
      throw toServiceUnavailable(error);
    }
  }

  try {
    await IgnavUsageOperation.create({
      _id: reservationId,
      provider: "ignav",
      operation,
      status: "reserved",
      billable,
      metadata,
    });
    return true;
  } catch (error) {
    if (billable) {
      try {
        await incrementUsageState({ reserved: -1 });
      } catch {
        throw new AppError(
          503,
          "Flight usage ledger is unavailable; capacity remains reserved.",
        );
      }
    }
    throw toServiceUnavailable(error);
  }
}

async function releaseCacheClaim(
  cacheKey: string,
  lockId: string,
): Promise<void> {
  try {
    await IgnavFlightCache.deleteOne({
      _id: cacheKey,
      lockId,
      status: "pending",
    });
  } catch (error) {
    throw toServiceUnavailable(error);
  }
}

async function settleFailedOperation(
  reservationId: string,
  statusCode: number,
  billable: boolean,
): Promise<void> {
  try {
    const operationUpdate = await IgnavUsageOperation.updateOne(
      { _id: reservationId, status: "reserved" },
      {
        $set: {
          status: "failed",
          requestStatus: statusCode,
          resolvedAt: new Date(),
        },
      },
    );
    if (operationUpdate.modifiedCount !== 1) {
      throw new Error("Usage operation could not be reconciled.");
    }
    if (billable) {
      await incrementUsageState({ reserved: -1 });
    }
  } catch (error) {
    throw toServiceUnavailable(error);
  }
}

async function settleSuccessfulOperation(
  reservationId: string,
  billable: boolean,
): Promise<void> {
  const now = new Date();
  try {
    const operationUpdate = await IgnavUsageOperation.updateOne(
      { _id: reservationId, status: "reserved" },
      {
        $set: {
          status: "succeeded",
          requestStatus: 200,
          resolvedAt: now,
        },
      },
    );
    if (operationUpdate.modifiedCount !== 1) {
      throw new Error("Usage operation could not be reconciled.");
    }
    await incrementUsageState(
      billable ? { reserved: -1, confirmedUsed: 1 } : {},
      billable ? now : undefined,
    );
  } catch (error) {
    throw toServiceUnavailable(error);
  }
}

async function cacheSuccessfulResult<T>(
  cacheKey: string,
  lockId: string,
  result: T,
  settings: IgnavManagerSettings,
): Promise<void> {
  try {
    const update = await IgnavFlightCache.updateOne(
      { _id: cacheKey, lockId, status: "pending" },
      {
        $set: {
          status: "completed",
          result,
          expiresAt: new Date(Date.now() + settings.cacheTtlMs),
        },
      },
    );
    if (update.modifiedCount !== 1) {
      throw new Error("Flight cache reservation could not be completed.");
    }
  } catch (error) {
    throw toServiceUnavailable(error);
  }
}

export async function runIgnavOperation<T>(
  options: RunIgnavOperationOptions<T>,
): Promise<T> {
  const settings = getSettings(options.settings);
  await getOrCreateUsageState(settings);

  if (!settings.liveSearchEnabled) {
    await incrementBlockedAndThrow(
      settings,
      503,
      "Live Ignav requests are disabled.",
    );
  }

  if (!/^[a-z][a-z0-9_]{0,79}$/.test(options.operation)) {
    throw new AppError(400, "Flight provider operation is invalid.");
  }

  let parameters: unknown;
  try {
    parameters = stableValue(options.parameters);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(400, "Flight search parameters are invalid.");
  }
  const metadata = safeMetadata(options.metadata);

  let withinUserLimit: boolean;
  try {
    withinUserLimit = await consumeUserRateLimit(options.userId, settings);
  } catch (error) {
    throw toServiceUnavailable(error);
  }
  if (!withinUserLimit) {
    await incrementBlockedAndThrow(
      settings,
      429,
      "Flight search rate limit exceeded. Try again next minute.",
    );
  }

  const cacheKey = hashValue(
    JSON.stringify({
      provider: "ignav",
      operation: options.operation,
      parameters,
    }),
  );
  const claim = await claimCache<T>(cacheKey, settings);
  if (claim.kind === "hit") {
    return claim.result;
  }

  const billable = options.billable ?? true;
  try {
    await getOrCreateUsageState(settings);
    const reserved = await reserveCapacity(
      claim.lockId,
      options.operation,
      metadata,
      billable,
      settings,
    );
    if (!reserved) {
      await releaseCacheClaim(claim.cacheKey, claim.lockId);
      await incrementBlockedAndThrow(
        settings,
        429,
        "Ignav internal request limit reached.",
      );
    }
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 429) {
      throw error;
    }
    try {
      await releaseCacheClaim(claim.cacheKey, claim.lockId);
    } catch {
      throw new AppError(
        503,
        "Flight usage ledger is unavailable; request remains blocked.",
      );
    }
    throw toServiceUnavailable(error);
  }

  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let providerResponse: IgnavProviderResponse<T>;
  try {
    providerResponse = await Promise.race([
      options.execute(controller.signal),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          controller.abort();
          reject(new Error("provider_timeout"));
        }, settings.requestTimeoutMs);
      }),
    ]);
  } catch {
    if (timeout) {
      clearTimeout(timeout);
    }
    try {
      await IgnavUsageOperation.updateOne(
        { _id: claim.lockId, status: "reserved" },
        { $set: { status: "ambiguous", resolvedAt: new Date() } },
      );
      await IgnavFlightCache.updateOne(
        { _id: claim.cacheKey, lockId: claim.lockId, status: "pending" },
        {
          $set: {
            status: "ambiguous",
            expiresAt: new Date(Date.now() + settings.cacheTtlMs),
          },
        },
      );
    } catch {
      throw new AppError(
        503,
        "Ignav request outcome is uncertain; usage remains reserved.",
      );
    }
    throw new AppError(
      503,
      "Ignav request outcome is uncertain; usage remains reserved.",
    );
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }

  if (providerResponse.status !== 200) {
    await settleFailedOperation(
      claim.lockId,
      providerResponse.status,
      billable,
    );
    await releaseCacheClaim(claim.cacheKey, claim.lockId);
    throw new AppError(
      502,
      `Ignav request failed with HTTP ${providerResponse.status}.`,
    );
  }

  await settleSuccessfulOperation(claim.lockId, billable);
  if (providerResponse.cacheResult === false) {
    await releaseCacheClaim(claim.cacheKey, claim.lockId);
  } else {
    await cacheSuccessfulResult(
      claim.cacheKey,
      claim.lockId,
      providerResponse.body,
      settings,
    );
  }
  return providerResponse.body;
}

export async function getIgnavUsageSummary(): Promise<IgnavUsageSummary> {
  const settings = getSettings();
  const state = await getOrCreateUsageState(settings);
  return {
    provider: "ignav",
    confirmedBillableRequestsUsed: state.confirmedUsed,
    reservedRequests: state.reserved,
    estimatedRemainingInternalBudget: Math.max(
      0,
      settings.internalLimit - state.confirmedUsed - state.reserved,
    ),
    internalHardLimit: settings.internalLimit,
    freeAllowance: settings.freeAllowance,
    cacheHitCount: state.cacheHits,
    cacheMissCount: state.cacheMisses,
    blockedRequestCount: state.blockedRequests,
    liveIntegrationEnabled: settings.liveSearchEnabled,
    lastSuccessfulProviderRequestAt:
      state.lastSuccessfulRequestAt?.toISOString() ?? null,
    balanceIsProviderVerified: false,
  };
}
