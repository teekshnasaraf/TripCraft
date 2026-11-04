import { config } from "../config/env.js";
import { IgnavFlightProvider } from "../integrations/ignav/ignavFlightProvider.js";
import type {
  FlightSearchResponse,
  IgnavFetchTransport,
} from "../integrations/ignav/flight.types.js";
import type { OneWayFlightSearchInput } from "../validators/flight.js";
import { AppError } from "../utils/AppError.js";
import {
  runIgnavOperation,
  type IgnavManagerSettings,
} from "./ignavUsage.service.js";

export interface FlightSearchDependencies {
  mode?: "live" | "mock";
  transport?: IgnavFetchTransport;
  apiKey?: () => string | undefined;
  settings?: IgnavManagerSettings;
}

function mockSearchResponse(
  search: OneWayFlightSearchInput,
): FlightSearchResponse {
  return {
    provider: "TripCraft mock",
    dataSource: "mock",
    dataMode: "mock",
    search,
    itineraries: [],
    observedAt: null,
  };
}

export async function searchOneWayFlights(
  userId: string,
  search: OneWayFlightSearchInput,
  dependencies: FlightSearchDependencies = {},
): Promise<FlightSearchResponse> {
  const settings = dependencies.settings ?? config.ignav;
  const mode =
    dependencies.mode ??
    (settings.liveSearchEnabled || config.nodeEnv === "production"
      ? "live"
      : "mock");

  const provider = new IgnavFlightProvider({
    transport: dependencies.transport,
    apiKey: dependencies.apiKey,
    isEnabled: () => mode === "live" && settings.liveSearchEnabled,
  });
  if (mode === "live" && settings.liveSearchEnabled) {
    try {
      provider.assertReady();
    } catch (error) {
      throw new AppError(
        503,
        error instanceof Error &&
          error.message === "Ignav API key is not configured."
          ? "Ignav flight search is not configured."
          : "Live flight search is disabled.",
      );
    }
  }

  const operationSettings =
    mode === "mock"
      ? { ...settings, liveSearchEnabled: true }
      : settings;
  const result = await runIgnavOperation<FlightSearchResponse | null>({
    userId,
    operation: "fare_search",
    parameters: { mode, search },
    metadata: {
      origin: search.origin,
      destination: search.destination,
      departureDate: search.departureDate,
      market: search.market,
      adults: search.adults,
      children: search.children,
      infants: search.infantsInSeat + search.infantsOnLap,
      cabinClass: search.cabinClass,
    },
    billable: mode === "live",
    settings: operationSettings,
    execute:
      mode === "live"
        ? (signal) => provider.searchOneWay(search, signal)
        : async () => ({ status: 200, body: mockSearchResponse(search) }),
  });

  if (!result) {
    throw new AppError(502, "Ignav returned an invalid fare search response.");
  }
  return result;
}
