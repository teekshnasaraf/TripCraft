import type { RequestHandler } from "express";
import {
  createTrip as createTripService,
  deleteTrip as deleteTripService,
  getTrip as getTripService,
  isValidTripId,
  listTrips as listTripsService,
  updateTrip as updateTripService,
} from "../services/trip.service.js";
import { AppError } from "../utils/AppError.js";
import { parseTripInput } from "../validators/trip.js";

function getUserId(request: Parameters<RequestHandler>[0]): string {
  if (!request.authUser) {
    throw new AppError(401, "Authentication is required.");
  }
  return request.authUser.id;
}

function getTripId(value: string | string[] | undefined): string {
  if (typeof value !== "string" || !isValidTripId(value)) {
    throw new AppError(400, "Trip ID must be a valid MongoDB ObjectId.");
  }
  return value;
}

function parsePageParameter(value: unknown, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }

  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    throw new AppError(400, "Pagination values must be positive integers.");
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new AppError(400, "Pagination values must be safe integers.");
  }
  return parsed;
}

export const createTrip: RequestHandler = async (request, response) => {
  const input = parseTripInput(request.body);
  const trip = await createTripService(getUserId(request), input);

  response.status(201).json({
    success: true,
    message: "Trip created successfully.",
    data: { trip },
  });
};

export const listTrips: RequestHandler = async (request, response) => {
  const page = parsePageParameter(request.query.page, 1);
  const limit = parsePageParameter(request.query.limit, 20);
  if (limit > 100) {
    throw new AppError(400, "Page size cannot exceed 100.");
  }

  const result = await listTripsService(getUserId(request), page, limit);
  response.status(200).json({
    success: true,
    data: result,
  });
};

export const getTrip: RequestHandler = async (request, response) => {
  const trip = await getTripService(
    getUserId(request),
    getTripId(request.params.id),
  );
  response.status(200).json({
    success: true,
    data: { trip },
  });
};

export const updateTrip: RequestHandler = async (request, response) => {
  const input = parseTripInput(request.body, true);
  const trip = await updateTripService(
    getUserId(request),
    getTripId(request.params.id),
    input,
  );
  response.status(200).json({
    success: true,
    message: "Trip updated successfully.",
    data: { trip },
  });
};

export const deleteTrip: RequestHandler = async (request, response) => {
  await deleteTripService(
    getUserId(request),
    getTripId(request.params.id),
  );
  response.status(200).json({
    success: true,
    message: "Trip deleted successfully.",
  });
};
