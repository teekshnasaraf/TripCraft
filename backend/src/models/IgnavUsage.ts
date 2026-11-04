import { model, Schema } from "mongoose";

export type IgnavOperationStatus =
  | "reserved"
  | "succeeded"
  | "failed"
  | "ambiguous";

export interface IgnavUsageStateDocument {
  _id: string;
  confirmedUsed: number;
  reserved: number;
  cacheHits: number;
  cacheMisses: number;
  blockedRequests: number;
  lastSuccessfulRequestAt?: Date;
}

export interface IgnavUsageOperationDocument {
  _id: string;
  provider: "ignav";
  operation: string;
  status: IgnavOperationStatus;
  billable: boolean;
  requestStatus?: number;
  metadata: Record<string, string | number | boolean | null>;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface IgnavFlightCacheDocument {
  _id: string;
  status: "pending" | "completed" | "ambiguous";
  lockId: string;
  result?: unknown;
  createdAt: Date;
  expiresAt?: Date;
}

export interface IgnavUserRateLimitDocument {
  _id: string;
  count: number;
  expiresAt: Date;
}

const usageStateSchema = new Schema<IgnavUsageStateDocument>(
  {
    _id: { type: String, required: true },
    confirmedUsed: { type: Number, required: true, min: 0, default: 0 },
    reserved: { type: Number, required: true, min: 0, default: 0 },
    cacheHits: { type: Number, required: true, min: 0, default: 0 },
    cacheMisses: { type: Number, required: true, min: 0, default: 0 },
    blockedRequests: { type: Number, required: true, min: 0, default: 0 },
    lastSuccessfulRequestAt: { type: Date },
  },
  { versionKey: false },
);

const usageOperationSchema = new Schema<IgnavUsageOperationDocument>(
  {
    _id: { type: String, required: true },
    provider: { type: String, enum: ["ignav"], required: true },
    operation: { type: String, required: true, maxlength: 80 },
    status: {
      type: String,
      enum: ["reserved", "succeeded", "failed", "ambiguous"],
      required: true,
    },
    billable: { type: Boolean, required: true },
    requestStatus: { type: Number, min: 100, max: 599 },
    metadata: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    createdAt: { type: Date, required: true, default: Date.now },
    resolvedAt: { type: Date },
  },
  { versionKey: false },
);

usageOperationSchema.index({ createdAt: -1 });
usageOperationSchema.index({ status: 1, createdAt: 1 });

const flightCacheSchema = new Schema<IgnavFlightCacheDocument>(
  {
    _id: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "completed", "ambiguous"],
      required: true,
    },
    lockId: { type: String, required: true },
    result: { type: Schema.Types.Mixed },
    createdAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date },
  },
  { versionKey: false },
);

flightCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const userRateLimitSchema = new Schema<IgnavUserRateLimitDocument>(
  {
    _id: { type: String, required: true },
    count: { type: Number, required: true, min: 1 },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false },
);

userRateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const IgnavUsageState = model<IgnavUsageStateDocument>(
  "IgnavUsageState",
  usageStateSchema,
);
export const IgnavUsageOperation = model<IgnavUsageOperationDocument>(
  "IgnavUsageOperation",
  usageOperationSchema,
);
export const IgnavFlightCache = model<IgnavFlightCacheDocument>(
  "IgnavFlightCache",
  flightCacheSchema,
);
export const IgnavUserRateLimit = model<IgnavUserRateLimitDocument>(
  "IgnavUserRateLimit",
  userRateLimitSchema,
);
