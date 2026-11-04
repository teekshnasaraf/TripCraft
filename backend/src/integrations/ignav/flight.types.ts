import type { OneWayFlightSearchInput } from "../../validators/flight.js";

export interface IgnavFlightSegment {
  marketingCarrierCode: string | null;
  flightNumber: string | null;
  operatingCarrierName: string | null;
  departureAirport: string;
  departureTimeLocal: string;
  departureTimezone: string | null;
  departureTimeUtc: string | null;
  arrivalAirport: string;
  arrivalTimeLocal: string;
  arrivalTimezone: string | null;
  arrivalTimeUtc: string | null;
  durationMinutes: number;
  aircraft: string | null;
}

export interface FlightSearchItinerary {
  provider: "Ignav" | "TripCraft mock";
  dataSource: "ignav" | "mock";
  dataMode: "live" | "mock";
  ignavId: string | null;
  airlineName: string | null;
  airlineCodes: string[];
  flightNumbers: string[];
  segments: IgnavFlightSegment[];
  originAirport: string | null;
  destinationAirport: string | null;
  departureTimeLocal: string | null;
  departureTimeUtc: string | null;
  arrivalTimeLocal: string | null;
  arrivalTimeUtc: string | null;
  durationMinutes: number | null;
  stops: number | null;
  cabinClass: string | null;
  price: {
    total: number;
    currency: string;
    status: "verified" | "unverified";
    verified: boolean;
    base: null;
    taxes: null;
    additionalCharges: null;
  };
  baggage: {
    checked: number | null;
    carryOn: number | null;
  } | null;
  availability: "unknown";
  fareConditions: null;
  observedAt: string | null;
}

export interface FlightSearchResponse {
  provider: "Ignav" | "TripCraft mock";
  dataSource: "ignav" | "mock";
  dataMode: "live" | "mock";
  search: OneWayFlightSearchInput;
  itineraries: FlightSearchItinerary[];
  observedAt: string | null;
}

export interface IgnavHttpResponse {
  status: number;
  json(): Promise<unknown>;
}

export type IgnavFetchTransport = (
  input: string,
  init: RequestInit,
) => Promise<IgnavHttpResponse>;
