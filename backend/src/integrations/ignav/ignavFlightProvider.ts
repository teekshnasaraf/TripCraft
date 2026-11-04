import { config } from "../../config/env.js";
import type { OneWayFlightSearchInput } from "../../validators/flight.js";
import type {
  FlightSearchItinerary,
  FlightSearchResponse,
  IgnavFetchTransport,
  IgnavHttpResponse,
  IgnavFlightSegment,
} from "./flight.types.js";

const ignavOneWaySearchUrl = "https://ignav.com/api/fares/one-way";

export interface IgnavFlightProviderOptions {
  transport?: IgnavFetchTransport;
  apiKey?: () => string | undefined;
  isEnabled?: () => boolean;
}

export interface IgnavFlightProviderResult {
  status: number;
  body: FlightSearchResponse | null;
  cacheResult?: boolean;
}

interface ProviderFareResponse {
  itineraries: FlightSearchItinerary[];
  observedAt: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isNullableInteger(value: unknown): value is number | null {
  return value === null || (Number.isSafeInteger(value) && Number(value) >= 0);
}

function isAirportCode(value: unknown): value is string {
  return typeof value === "string" && /^[A-Z]{3}$/.test(value);
}

function parseSegment(value: unknown): IgnavFlightSegment | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isNullableString(value.marketing_carrier_code) ||
    !isNullableString(value.flight_number) ||
    !isNullableString(value.operating_carrier_name) ||
    !isNullableString(value.departure_timezone) ||
    !isNullableString(value.departure_time_utc) ||
    !isNullableString(value.arrival_timezone) ||
    !isNullableString(value.arrival_time_utc) ||
    !isNullableString(value.aircraft) ||
    !isAirportCode(value.departure_airport) ||
    !isAirportCode(value.arrival_airport) ||
    typeof value.departure_time_local !== "string" ||
    typeof value.arrival_time_local !== "string" ||
    !Number.isSafeInteger(value.duration_minutes) ||
    Number(value.duration_minutes) < 0
  ) {
    return null;
  }

  return {
    marketingCarrierCode: value.marketing_carrier_code,
    flightNumber: value.flight_number,
    operatingCarrierName: value.operating_carrier_name,
    departureAirport: value.departure_airport,
    departureTimeLocal: value.departure_time_local,
    departureTimezone: value.departure_timezone,
    departureTimeUtc: value.departure_time_utc,
    arrivalAirport: value.arrival_airport,
    arrivalTimeLocal: value.arrival_time_local,
    arrivalTimezone: value.arrival_timezone,
    arrivalTimeUtc: value.arrival_time_utc,
    durationMinutes: Number(value.duration_minutes),
    aircraft: value.aircraft,
  };
}

function parseItinerary(
  value: unknown,
  observedAt: string | null,
): FlightSearchItinerary | null {
  if (!isRecord(value) || !isRecord(value.price) || !isRecord(value.outbound)) {
    return null;
  }
  const { price, outbound } = value;
  if (
    typeof value.ignav_id !== "string" ||
    value.ignav_id.length === 0 ||
    (value.inbound !== undefined && value.inbound !== null) ||
    typeof price.amount !== "number" ||
    !Number.isFinite(price.amount) ||
    typeof price.currency !== "string" ||
    !/^[A-Z]{3}$/.test(price.currency) ||
    (price.status !== "verified" && price.status !== "unverified") ||
    !Array.isArray(outbound.segments) ||
    !(outbound.carrier === undefined || isNullableString(outbound.carrier)) ||
    !(
      outbound.duration_minutes === undefined ||
      isNullableInteger(outbound.duration_minutes)
    )
  ) {
    return null;
  }

  const segments = outbound.segments.map(parseSegment);
  if (segments.some((segment) => segment === null)) {
    return null;
  }
  const parsedSegments = segments.filter(
    (segment): segment is IgnavFlightSegment => segment !== null,
  );
  const bags = value.bags;
  let baggage: FlightSearchItinerary["baggage"] = null;
  if (bags !== undefined && bags !== null) {
    if (
      !isRecord(bags) ||
      (bags.checked !== undefined && !isNullableInteger(bags.checked)) ||
      (bags.carry_on !== undefined && !isNullableInteger(bags.carry_on))
    ) {
      return null;
    }
    baggage = {
      checked: typeof bags.checked === "number" ? bags.checked : null,
      carryOn: typeof bags.carry_on === "number" ? bags.carry_on : null,
    };
  }

  const airlineCodes = [
    ...new Set(
      parsedSegments
        .map((segment) => segment.marketingCarrierCode)
        .filter((code): code is string => code !== null),
    ),
  ];
  const flightNumbers = parsedSegments
    .map((segment) => segment.flightNumber)
    .filter((number): number is string => number !== null);
  const firstSegment = parsedSegments[0];
  const lastSegment = parsedSegments.at(-1);
  const priceStatus = price.status;

  return {
    provider: "Ignav",
    dataSource: "ignav",
    dataMode: "live",
    ignavId: value.ignav_id,
    airlineName:
      typeof outbound.carrier === "string" ? outbound.carrier : null,
    airlineCodes,
    flightNumbers,
    segments: parsedSegments,
    originAirport: firstSegment?.departureAirport ?? null,
    destinationAirport: lastSegment?.arrivalAirport ?? null,
    departureTimeLocal: firstSegment?.departureTimeLocal ?? null,
    departureTimeUtc: firstSegment?.departureTimeUtc ?? null,
    arrivalTimeLocal: lastSegment?.arrivalTimeLocal ?? null,
    arrivalTimeUtc: lastSegment?.arrivalTimeUtc ?? null,
    durationMinutes:
      typeof outbound.duration_minutes === "number"
        ? outbound.duration_minutes
        : null,
    stops:
      parsedSegments.length > 0 ? Math.max(0, parsedSegments.length - 1) : null,
    cabinClass: isNullableString(value.cabin_class)
      ? value.cabin_class
      : null,
    price: {
      total: price.amount,
      currency: price.currency,
      status: priceStatus,
      verified: priceStatus === "verified",
      base: null,
      taxes: null,
      additionalCharges: null,
    },
    baggage,
    availability: "unknown",
    fareConditions: null,
    observedAt,
  };
}

function parseFareResponse(
  value: unknown,
  search: OneWayFlightSearchInput,
): ProviderFareResponse | null {
  const observedAtPattern =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
  if (
    !isRecord(value) ||
    value.origin !== search.origin ||
    value.destination !== search.destination ||
    value.departure_date !== search.departureDate ||
    !Array.isArray(value.itineraries) ||
    (value.return_date !== undefined && value.return_date !== null) ||
    !(
      value.observed_at === null ||
      (typeof value.observed_at === "string" &&
        observedAtPattern.test(value.observed_at) &&
        !Number.isNaN(Date.parse(value.observed_at)))
    )
  ) {
    return null;
  }

  const observedAt =
    typeof value.observed_at === "string" ? value.observed_at : null;
  const itineraries = value.itineraries.map((item) =>
    parseItinerary(item, observedAt),
  );
  if (itineraries.some((itinerary) => itinerary === null)) {
    return null;
  }
  return {
    itineraries: itineraries.filter(
      (itinerary): itinerary is FlightSearchItinerary =>
        itinerary !== null,
    ),
    observedAt,
  };
}

function toApiRequest(search: OneWayFlightSearchInput) {
  return {
    origin: search.origin,
    destination: search.destination,
    departure_date: search.departureDate,
    market: search.market,
    adults: search.adults,
    children: search.children,
    infants_in_seat: search.infantsInSeat,
    infants_on_lap: search.infantsOnLap,
    cabin_class: search.cabinClass,
  };
}

export class IgnavFlightProvider {
  private readonly transport: IgnavFetchTransport;
  private readonly apiKey: () => string | undefined;
  private readonly isEnabled: () => boolean;

  constructor(options: IgnavFlightProviderOptions = {}) {
    this.transport =
      options.transport ??
      (async (input, init) => fetch(input, init));
    this.apiKey = options.apiKey ?? (() => process.env.IGNAV_API_KEY);
    this.isEnabled =
      options.isEnabled ?? (() => config.ignav.liveSearchEnabled);
  }

  assertReady(): void {
    if (!this.isEnabled()) {
      throw new Error("Live Ignav requests are disabled.");
    }
    if (!this.apiKey()?.trim()) {
      throw new Error("Ignav API key is not configured.");
    }
  }

  async searchOneWay(
    search: OneWayFlightSearchInput,
    signal: AbortSignal,
  ): Promise<IgnavFlightProviderResult> {
    this.assertReady();
    const apiKey = this.apiKey()?.trim();
    if (!apiKey) {
      throw new Error("Ignav API key is not configured.");
    }
    const response = await this.transport(ignavOneWaySearchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify(toApiRequest(search)),
      signal,
      redirect: "error",
    });

    if (response.status !== 200) {
      return { status: response.status, body: null };
    }

    let responseBody: unknown;
    try {
      responseBody = await response.json();
    } catch {
      return { status: 200, body: null, cacheResult: false };
    }

    const fareResponse = parseFareResponse(responseBody, search);
    if (!fareResponse) {
      return { status: 200, body: null, cacheResult: false };
    }

    return {
      status: 200,
      body: {
        provider: "Ignav",
        dataSource: "ignav",
        dataMode: "live",
        search,
        itineraries: fareResponse.itineraries,
        observedAt: fareResponse.observedAt,
      },
    };
  }
}
