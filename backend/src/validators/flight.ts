import { AppError } from "../utils/AppError.js";

export type FlightCabinClass =
  | "economy"
  | "premium_economy"
  | "business"
  | "first";

export interface OneWayFlightSearchInput {
  origin: string;
  destination: string;
  departureDate: string;
  market: string;
  adults: number;
  children: number;
  infantsInSeat: number;
  infantsOnLap: number;
  cabinClass: FlightCabinClass;
}

const allowedFields = new Set([
  "origin",
  "destination",
  "departureDate",
  "market",
  "adults",
  "children",
  "infantsInSeat",
  "infantsOnLap",
  "cabinClass",
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

function parseAirportCode(value: unknown, field: string): string {
  if (typeof value !== "string" || !/^[a-z]{3}$/i.test(value.trim())) {
    throw new AppError(400, `${field} must be a three-letter airport code.`);
  }
  return value.trim().toUpperCase();
}

function parseDate(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)) ||
    new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) !== value
  ) {
    throw new AppError(400, "departureDate must be a valid YYYY-MM-DD date.");
  }
  if (value < new Date().toISOString().slice(0, 10)) {
    throw new AppError(400, "departureDate cannot be in the past.");
  }
  return value;
}

function parsePassengerCount(
  body: Record<string, unknown>,
  field: string,
  fallback: number,
  minimum: number,
): number {
  const value = body[field] === undefined ? fallback : body[field];
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < minimum
  ) {
    throw new AppError(
      400,
      `${field} must be a safe integer of at least ${minimum}.`,
    );
  }
  return value;
}

export function parseOneWayFlightSearchInput(
  value: unknown,
): OneWayFlightSearchInput {
  const body = getRecord(value);
  const unsupportedField = Object.keys(body).find(
    (field) => !allowedFields.has(field),
  );
  if (unsupportedField) {
    throw new AppError(
      400,
      `Unsupported flight search field: ${unsupportedField}.`,
    );
  }

  const origin = parseAirportCode(body.origin, "origin");
  const destination = parseAirportCode(body.destination, "destination");
  if (origin === destination) {
    throw new AppError(400, "origin and destination must be different.");
  }

  const marketValue = body.market ?? "IN";
  if (
    typeof marketValue !== "string" ||
    !/^[a-z]{2}$/i.test(marketValue.trim())
  ) {
    throw new AppError(400, "market must be a two-letter country code.");
  }

  const cabinClassValue = body.cabinClass ?? "economy";
  if (
    typeof cabinClassValue !== "string" ||
    !["economy", "premium_economy", "business", "first"].includes(
      cabinClassValue,
    )
  ) {
    throw new AppError(400, "Unsupported cabin class.");
  }

  return {
    origin,
    destination,
    departureDate: parseDate(body.departureDate),
    market: marketValue.trim().toUpperCase(),
    adults: parsePassengerCount(body, "adults", 1, 1),
    children: parsePassengerCount(body, "children", 0, 0),
    infantsInSeat: parsePassengerCount(body, "infantsInSeat", 0, 0),
    infantsOnLap: parsePassengerCount(body, "infantsOnLap", 0, 0),
    cabinClass: cabinClassValue as FlightCabinClass,
  };
}
