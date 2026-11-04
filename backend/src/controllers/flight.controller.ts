import type { RequestHandler } from "express";
import { searchOneWayFlights } from "../services/flightSearch.service.js";
import { getIgnavUsageSummary } from "../services/ignavUsage.service.js";
import { AppError } from "../utils/AppError.js";
import { parseOneWayFlightSearchInput } from "../validators/flight.js";

export const getFlightUsage: RequestHandler = async (_request, response) => {
  const usage = await getIgnavUsageSummary();
  response.status(200).json({
    success: true,
    data: { usage },
  });
};

export const searchFlights: RequestHandler = async (request, response) => {
  if (!request.authUser) {
    throw new AppError(401, "Authentication is required.");
  }

  const search = parseOneWayFlightSearchInput(request.body);
  const result = await searchOneWayFlights(request.authUser.id, search);
  response.status(200).json({
    success: true,
    data: result,
  });
};
