import {
  travelCategories,
  type TravelCategory,
  type TravelSearchFilters,
} from "../integrations/travel/contracts.js";
import { AppError } from "../utils/AppError.js";

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

export function parseTravelCategory(value: unknown): TravelCategory {
  if (
    typeof value !== "string" ||
    !travelCategories.includes(value as TravelCategory)
  ) {
    throw new AppError(400, "Unsupported travel search category.");
  }
  return value as TravelCategory;
}

export function parseTravelSearchFilters(
  category: TravelCategory,
  value: unknown,
): TravelSearchFilters {
  const body = getRecord(value);
  const allowedByCategory: Record<TravelCategory, readonly string[]> = {
    hotels: [
      "maxBudget",
      "minimumRating",
      "rooms",
      "accommodationType",
      "amenities",
    ],
    flights: [
      "maxBudget",
      "directOnly",
      "airline",
      "cabinClass",
      "departurePeriod",
    ],
    trains: ["maxBudget", "trainClass", "departurePeriod"],
    destinations: ["placeType"],
  };
  const allowed = new Set(allowedByCategory[category]);
  const unsupported = Object.keys(body).find((key) => !allowed.has(key));
  if (unsupported) {
    throw new AppError(400, `Unsupported search filter: ${unsupported}.`);
  }

  const filters: TravelSearchFilters = {};
  if ("maxBudget" in body) {
    if (
      typeof body.maxBudget !== "number" ||
      !Number.isFinite(body.maxBudget) ||
      body.maxBudget <= 0
    ) {
      throw new AppError(400, "maxBudget must be a positive number.");
    }
    filters.maxBudget = body.maxBudget;
  }
  if ("accommodationType" in body) {
    if (
      typeof body.accommodationType !== "string" ||
      !["budget", "standard", "premium", "luxury"].includes(
        body.accommodationType,
      )
    ) {
      throw new AppError(400, "Unsupported accommodation type.");
    }
    filters.accommodationType = body.accommodationType;
  }
  if ("minimumRating" in body) {
    if (
      typeof body.minimumRating !== "number" ||
      !Number.isFinite(body.minimumRating) ||
      body.minimumRating < 0 ||
      body.minimumRating > 5
    ) {
      throw new AppError(400, "minimumRating must be between 0 and 5.");
    }
    filters.minimumRating = body.minimumRating;
  }
  if ("rooms" in body) {
    if (
      typeof body.rooms !== "number" ||
      !Number.isInteger(body.rooms) ||
      body.rooms < 1 ||
      body.rooms > 10
    ) {
      throw new AppError(400, "rooms must be an integer between 1 and 10.");
    }
    filters.rooms = body.rooms;
  }
  if ("amenities" in body) {
    if (
      !Array.isArray(body.amenities) ||
      body.amenities.length > 20 ||
      body.amenities.some(
        (amenity) =>
          typeof amenity !== "string" ||
          amenity.length < 1 ||
          amenity.length > 40,
      )
    ) {
      throw new AppError(400, "amenities must be a list of short strings.");
    }
    filters.amenities = body.amenities;
  }
  if ("directOnly" in body) {
    if (typeof body.directOnly !== "boolean") {
      throw new AppError(400, "directOnly must be a boolean.");
    }
    filters.directOnly = body.directOnly;
  }
  if ("airline" in body) {
    if (typeof body.airline !== "string" || body.airline.length > 80) {
      throw new AppError(400, "airline must be a short string.");
    }
    filters.airline = body.airline;
  }
  if ("cabinClass" in body) {
    if (
      typeof body.cabinClass !== "string" ||
      !["economy", "premium_economy", "business", "first"].includes(
        body.cabinClass,
      )
    ) {
      throw new AppError(400, "Unsupported cabin class.");
    }
    filters.cabinClass = body.cabinClass as NonNullable<
      TravelSearchFilters["cabinClass"]
    >;
  }
  if ("departurePeriod" in body) {
    if (
      typeof body.departurePeriod !== "string" ||
      !["morning", "afternoon", "evening", "night"].includes(
        body.departurePeriod,
      )
    ) {
      throw new AppError(400, "Unsupported departure period.");
    }
    filters.departurePeriod = body.departurePeriod as NonNullable<
      TravelSearchFilters["departurePeriod"]
    >;
  }
  if ("trainClass" in body) {
    if (typeof body.trainClass !== "string" || body.trainClass.length > 80) {
      throw new AppError(400, "trainClass must be a short string.");
    }
    filters.trainClass = body.trainClass;
  }
  if ("placeType" in body) {
    if (typeof body.placeType !== "string" || body.placeType.length > 80) {
      throw new AppError(400, "placeType must be a short string.");
    }
    filters.placeType = body.placeType;
  }
  return filters;
}

export function parseSelectionInput(
  value: unknown,
): { category: TravelCategory; optionId: string } {
  const body = getRecord(value);
  const unsupported = Object.keys(body).find(
    (key) => key !== "category" && key !== "optionId",
  );
  if (unsupported) {
    throw new AppError(400, `Unsupported selection field: ${unsupported}.`);
  }
  if (
    typeof body.optionId !== "string" ||
    !/^[a-z0-9-]{1,100}$/.test(body.optionId)
  ) {
    throw new AppError(400, "optionId is invalid.");
  }
  return {
    category: parseTravelCategory(body.category),
    optionId: body.optionId,
  };
}
