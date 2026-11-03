import {
  accommodationOptions,
  tripInterests,
  tripStatuses,
  tripStyles,
} from "../models/Trip.js";
import { AppError } from "../utils/AppError.js";

export interface TripInput {
  title?: string;
  origin?: string;
  destination?: string;
  departureDate?: Date;
  returnDate?: Date;
  travellers?: {
    adults: number;
    children: number;
  };
  budget?: {
    amount: number;
    currency: "INR";
  };
  interests?: (typeof tripInterests)[number][];
  accommodation?: (typeof accommodationOptions)[number];
  tripStyle?: (typeof tripStyles)[number];
  status?: (typeof tripStatuses)[number];
}

const allowedFields = new Set([
  "title",
  "origin",
  "destination",
  "departureDate",
  "returnDate",
  "travellers",
  "budget",
  "interests",
  "accommodation",
  "tripStyle",
  "status",
]);

function getRecord(value: unknown): Record<string, unknown> {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new AppError(400, "A JSON object is required.");
  }

  return value as Record<string, unknown>;
}

function parseNonEmptyString(
  value: unknown,
  field: string,
  maxLength: number,
): string {
  if (typeof value !== "string") {
    throw new AppError(400, `${field} must be a string.`);
  }

  const parsed = value.trim();
  if (!parsed || parsed.length > maxLength) {
    throw new AppError(
      400,
      `${field} must be between 1 and ${maxLength} characters.`,
    );
  }

  return parsed;
}

function parseDate(value: unknown, field: string): Date {
  if (typeof value !== "string" || !value.trim()) {
    throw new AppError(400, `${field} must be a valid date.`);
  }

  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) {
    throw new AppError(400, `${field} must be a valid date.`);
  }
  if (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    parsed.toISOString().slice(0, 10) !== value
  ) {
    throw new AppError(400, `${field} must be a valid calendar date.`);
  }

  return parsed;
}

function parseInteger(
  value: unknown,
  field: string,
  minimum: number,
): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < minimum) {
    throw new AppError(
      400,
      `${field} must be an integer greater than or equal to ${minimum}.`,
    );
  }
  return value;
}

function rejectUnknownFields(
  value: Record<string, unknown>,
  allowed: readonly string[],
  parent: string,
): void {
  const allowedFields = new Set(allowed);
  const unsupportedField = Object.keys(value).find(
    (field) => !allowedFields.has(field),
  );
  if (unsupportedField) {
    throw new AppError(400, `Unsupported ${parent} field: ${unsupportedField}.`);
  }
}

function parseStringEnum<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  field: string,
): T[number] {
  if (typeof value !== "string" || !allowed.includes(value)) {
    throw new AppError(400, `${field} contains an unsupported value.`);
  }
  return value;
}

export function parseTripInput(
  value: unknown,
  partial = false,
): TripInput {
  const body = getRecord(value);
  const keys = Object.keys(body);

  for (const key of keys) {
    if (key === "userId" || key === "owner" || key === "ownerId") {
      throw new AppError(400, "Trip ownership is assigned by the server.");
    }
    if (!allowedFields.has(key)) {
      throw new AppError(400, `Unsupported trip field: ${key}.`);
    }
  }
  if (partial && keys.length === 0) {
    throw new AppError(400, "At least one trip field is required.");
  }

  const result: TripInput = {};

  if ("title" in body) {
    result.title = parseNonEmptyString(body.title, "title", 120);
  }
  if ("origin" in body) {
    result.origin = parseNonEmptyString(body.origin, "origin", 120);
  }
  if ("destination" in body) {
    result.destination = parseNonEmptyString(
      body.destination,
      "destination",
      120,
    );
  }
  if ("departureDate" in body) {
    result.departureDate = parseDate(body.departureDate, "departureDate");
  }
  if ("returnDate" in body) {
    result.returnDate = parseDate(body.returnDate, "returnDate");
  }
  if ("travellers" in body) {
    const travellers = getRecord(body.travellers);
    rejectUnknownFields(travellers, ["adults", "children"], "travellers");
    result.travellers = {
      adults: parseInteger(travellers.adults, "travellers.adults", 1),
      children: parseInteger(travellers.children, "travellers.children", 0),
    };
  }
  if ("budget" in body) {
    const budget = getRecord(body.budget);
    rejectUnknownFields(budget, ["amount", "currency"], "budget");
    if (
      typeof budget.amount !== "number" ||
      !Number.isFinite(budget.amount) ||
      budget.amount <= 0
    ) {
      throw new AppError(400, "budget.amount must be greater than zero.");
    }
    if (budget.currency !== undefined && budget.currency !== "INR") {
      throw new AppError(400, "budget.currency must be INR.");
    }
    result.budget = {
      amount: budget.amount,
      currency: "INR",
    };
  }
  if ("interests" in body) {
    if (!Array.isArray(body.interests)) {
      throw new AppError(400, "interests must be an array.");
    }
    result.interests = body.interests.map((interest) =>
      parseStringEnum(interest, tripInterests, "interests"),
    );
    if (new Set(result.interests).size !== result.interests.length) {
      throw new AppError(400, "interests must not contain duplicates.");
    }
  }
  if ("accommodation" in body) {
    result.accommodation = parseStringEnum(
      body.accommodation,
      accommodationOptions,
      "accommodation",
    );
  }
  if ("tripStyle" in body) {
    result.tripStyle = parseStringEnum(body.tripStyle, tripStyles, "tripStyle");
  }
  if ("status" in body) {
    result.status = parseStringEnum(body.status, tripStatuses, "status");
  }

  if (!partial) {
    const requiredFields: (keyof TripInput)[] = [
      "origin",
      "destination",
      "departureDate",
      "returnDate",
      "travellers",
      "budget",
    ];
    for (const field of requiredFields) {
      if (result[field] === undefined) {
        throw new AppError(400, `${field} is required.`);
      }
    }
    if (result.returnDate! < result.departureDate!) {
      throw new AppError(400, "Return date must be on or after departure.");
    }
  } else if (
    result.departureDate &&
    result.returnDate &&
    result.returnDate < result.departureDate
  ) {
    throw new AppError(400, "Return date must be on or after departure.");
  }

  if (
    result.origin &&
    result.destination &&
    result.origin.localeCompare(result.destination, undefined, {
      sensitivity: "accent",
    }) === 0
  ) {
    throw new AppError(400, "Origin and destination must be different.");
  }

  return result;
}
