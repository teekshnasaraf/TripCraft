import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { after, before, beforeEach, test } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import type { Express } from "express";
import {
  IgnavFlightCache,
  IgnavUsageOperation,
  IgnavUsageState,
  IgnavUserRateLimit,
} from "../src/models/IgnavUsage.js";
import { User } from "../src/models/User.js";
import { parseOneWayFlightSearchInput } from "../src/validators/flight.js";
import type {
  IgnavFetchTransport,
  IgnavHttpResponse,
} from "../src/integrations/ignav/flight.types.js";
import type { IgnavManagerSettings } from "../src/services/ignavUsage.service.js";
import type { FlightSearchDependencies } from "../src/services/flightSearch.service.js";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = randomBytes(32).toString("hex");
process.env.JWT_EXPIRES_IN = "15m";

const testApiKey = "test-only-ignav-key";
const futureDate = new Date();
futureDate.setUTCDate(futureDate.getUTCDate() + 30);
const departureDate = futureDate.toISOString().slice(0, 10);

let app: Express;
let mongoServer: MongoMemoryServer;
let searchOneWayFlights: typeof import("../src/services/flightSearch.service.js")["searchOneWayFlights"];

function providerResponse(
  status: number,
  body: unknown,
): IgnavHttpResponse {
  return {
    status,
    json: async () => body,
  };
}

function fareResponse(
  origin = "HYD",
  destination = "BOM",
  date = departureDate,
  itineraries: unknown[] = [
    {
      ignav_id: "opaque-account-scoped-id",
      price: { amount: 4500, currency: "INR", status: "verified" },
      outbound: {
        carrier: "IndiGo",
        duration_minutes: 120,
        segments: [
          {
            marketing_carrier_code: "6E",
            flight_number: "1234",
            operating_carrier_name: "IndiGo",
            departure_airport: origin,
            departure_time_local: `${date}T09:30:00`,
            departure_timezone: "Asia/Kolkata",
            departure_time_utc: `${date}T04:00:00Z`,
            arrival_airport: destination,
            arrival_time_local: `${date}T11:30:00`,
            arrival_timezone: "Asia/Kolkata",
            arrival_time_utc: `${date}T06:00:00Z`,
            duration_minutes: 120,
            aircraft: null,
          },
        ],
      },
      inbound: null,
      cabin_class: "economy",
      bags: { checked: 15, carry_on: 7 },
      baggage_pricing: null,
      has_mixed_carriers: false,
    },
  ],
) {
  return {
    origin,
    destination,
    departure_date: date,
    return_date: null,
    itineraries,
    observed_at: new Date().toISOString(),
  };
}

function createTransport(
  respond: (
    input: string,
    init: RequestInit,
  ) => Promise<IgnavHttpResponse>,
): IgnavFetchTransport {
  return respond;
}

function liveDependencies(
  transport: IgnavFetchTransport,
  settings: Partial<IgnavManagerSettings> = {},
): FlightSearchDependencies {
  return {
    mode: "live",
    transport,
    apiKey: () => testApiKey,
    settings: {
      freeAllowance: 1_000,
      internalLimit: 800,
      initialUsed: 2,
      cacheTtlMs: 30 * 60_000,
      userRateLimitPerMinute: 100,
      requestTimeoutMs: 1_000,
      liveSearchEnabled: true,
      ...settings,
    },
  };
}

function searchInput(overrides: Record<string, unknown> = {}) {
  return parseOneWayFlightSearchInput({
    origin: "HYD",
    destination: "BOM",
    departureDate,
    market: "IN",
    adults: 1,
    cabinClass: "economy",
    ...overrides,
  });
}

async function registerAccount(): Promise<{ token: string; id: string }> {
  const response = await request(app)
    .post("/api/auth/register")
    .send({
      name: "Flight Test",
      email: `${randomUUID()}@example.test`,
      password: randomBytes(18).toString("base64url"),
    });
  assert.equal(response.status, 201);
  return {
    token: response.body.data.token as string,
    id: response.body.data.user.id as string,
  };
}

function authorization(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function waitFor(
  predicate: () => boolean,
  timeoutMs = 2_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate() && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.equal(predicate(), true, "condition did not become true in time");
}

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  ({ app } = await import("../src/app.js"));
  ({ searchOneWayFlights } =
    await import("../src/services/flightSearch.service.js"));
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    IgnavFlightCache.deleteMany({}),
    IgnavUsageOperation.deleteMany({}),
    IgnavUsageState.deleteMany({}),
    IgnavUserRateLimit.deleteMany({}),
  ]);
});

after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

test("requires authentication and marks development mock results honestly", async () => {
  const anonymous = await request(app)
    .post("/api/flights/search")
    .send({ origin: "HYD", destination: "BOM", departureDate });
  assert.equal(anonymous.status, 401);

  const account = await registerAccount();
  const response = await request(app)
    .post("/api/flights/search")
    .set(authorization(account.token))
    .send({ origin: "hyd", destination: "bom", departureDate });

  assert.equal(response.status, 200, JSON.stringify(response.body));
  assert.equal(response.body.data.dataMode, "mock");
  assert.equal(response.body.data.dataSource, "mock");
  assert.deepEqual(response.body.data.itineraries, []);
  assert.equal(response.body.data.search.market, "IN");
  assert.equal(response.body.data.search.cabinClass, "economy");
  assert.equal(JSON.stringify(response.body).includes(testApiKey), false);
});

test("validates airport codes, route, date, one-way scope, passenger counts and cabin", async () => {
  const account = await registerAccount();
  const cases: Array<{ body: Record<string, unknown>; message: string }> = [
    {
      body: { origin: "Delhi", destination: "BOM", departureDate },
      message: "airport code",
    },
    {
      body: { origin: "HYD", destination: "HYD", departureDate },
      message: "different",
    },
    {
      body: { origin: "HYD", destination: "BOM", departureDate: "2026-02-30" },
      message: "valid YYYY-MM-DD",
    },
    {
      body: { origin: "HYD", destination: "BOM", departureDate: "2000-01-01" },
      message: "past",
    },
    {
      body: {
        origin: "HYD",
        destination: "BOM",
        departureDate,
        returnDate: departureDate,
      },
      message: "Unsupported flight search field",
    },
    {
      body: {
        origin: "HYD",
        destination: "BOM",
        departureDate,
        adults: 0,
      },
      message: "adults",
    },
    {
      body: {
        origin: "HYD",
        destination: "BOM",
        departureDate,
        children: -1,
      },
      message: "children",
    },
    {
      body: {
        origin: "HYD",
        destination: "BOM",
        departureDate,
        cabinClass: "sleeper",
      },
      message: "cabin class",
    },
  ];

  for (const { body, message } of cases) {
    const response = await request(app)
      .post("/api/flights/search")
      .set(authorization(account.token))
      .send(body);
    assert.equal(response.status, 400, JSON.stringify(body));
    assert.match(response.body.message, new RegExp(message, "i"));
  }
});

test("maps documented Ignav fare fields and accounts one successful live search", async () => {
  const account = await registerAccount();
  let callCount = 0;
  const transport = createTransport(async (url, init) => {
    callCount += 1;
    assert.equal(url, "https://ignav.com/api/fares/one-way");
    assert.equal(init.method, "POST");
    assert.equal(new Headers(init.headers).get("X-Api-Key"), testApiKey);
    assert.equal(init.redirect, "error");
    assert.deepEqual(JSON.parse(String(init.body)), {
      origin: "HYD",
      destination: "BOM",
      departure_date: departureDate,
      market: "IN",
      adults: 1,
      children: 0,
      infants_in_seat: 0,
      infants_on_lap: 0,
      cabin_class: "economy",
    });
    return providerResponse(200, fareResponse());
  });

  const result = await searchOneWayFlights(
    account.id,
    searchInput(),
    liveDependencies(transport),
  );
  assert.equal(callCount, 1);
  assert.equal(JSON.stringify(result).includes(testApiKey), false);
  assert.equal(result.dataMode, "live");
  assert.equal(result.dataSource, "ignav");
  assert.equal(result.itineraries.length, 1);
  assert.deepEqual(result.itineraries[0], {
    provider: "Ignav",
    dataSource: "ignav",
    dataMode: "live",
    ignavId: "opaque-account-scoped-id",
    airlineName: "IndiGo",
    airlineCodes: ["6E"],
    flightNumbers: ["1234"],
    segments: [
      {
        marketingCarrierCode: "6E",
        flightNumber: "1234",
        operatingCarrierName: "IndiGo",
        departureAirport: "HYD",
        departureTimeLocal: `${departureDate}T09:30:00`,
        departureTimezone: "Asia/Kolkata",
        departureTimeUtc: `${departureDate}T04:00:00Z`,
        arrivalAirport: "BOM",
        arrivalTimeLocal: `${departureDate}T11:30:00`,
        arrivalTimezone: "Asia/Kolkata",
        arrivalTimeUtc: `${departureDate}T06:00:00Z`,
        durationMinutes: 120,
        aircraft: null,
      },
    ],
    originAirport: "HYD",
    destinationAirport: "BOM",
    departureTimeLocal: `${departureDate}T09:30:00`,
    departureTimeUtc: `${departureDate}T04:00:00Z`,
    arrivalTimeLocal: `${departureDate}T11:30:00`,
    arrivalTimeUtc: `${departureDate}T06:00:00Z`,
    durationMinutes: 120,
    stops: 0,
    cabinClass: "economy",
    price: {
      total: 4500,
      currency: "INR",
      status: "verified",
      verified: true,
      base: null,
      taxes: null,
      additionalCharges: null,
    },
    baggage: { checked: 15, carryOn: 7 },
    availability: "unknown",
    fareConditions: null,
    observedAt: result.observedAt,
  });

  const usage = await IgnavUsageState.findById("ignav").lean();
  assert.equal(usage?.confirmedUsed, 3);
  assert.equal(usage?.reserved, 0);
  const operation = await IgnavUsageOperation.findOne({
    provider: "ignav",
  }).lean();
  assert.equal(operation?.status, "succeeded");
  assert.equal(operation?.billable, true);
});

test("caches identical searches and coalesces concurrent live requests", async () => {
  let callCount = 0;
  let releaseResponse: ((response: IgnavHttpResponse) => void) | undefined;
  const transport = createTransport(
    () =>
      new Promise<IgnavHttpResponse>((resolve) => {
        callCount += 1;
        releaseResponse = resolve;
      }),
  );
  const dependencies = liveDependencies(transport);
  const input = searchInput();
  const firstSearch = searchOneWayFlights("same-user", input, dependencies);
  await waitFor(() => callCount === 1);
  const secondSearch = searchOneWayFlights("same-user", input, dependencies);
  releaseResponse?.(providerResponse(200, fareResponse()));

  const [first, second] = await Promise.all([firstSearch, secondSearch]);
  assert.equal(callCount, 1);
  assert.deepEqual(first, second);

  const cached = await searchOneWayFlights("same-user", input, dependencies);
  assert.deepEqual(cached, first);
  assert.equal(callCount, 1);
  const usage = await IgnavUsageState.findById("ignav").lean();
  assert.equal(usage?.confirmedUsed, 3);
  assert.ok((usage?.cacheHits ?? 0) >= 1);
});

test("does not share cache entries for different route dates or cabin classes", async () => {
  let callCount = 0;
  const transport = createTransport(async (url, init) => {
    callCount += 1;
    const requestBody = JSON.parse(String(init.body)) as {
      origin: string;
      destination: string;
      departure_date: string;
    };
    return providerResponse(
      200,
      fareResponse(
        requestBody.origin,
        requestBody.destination,
        requestBody.departure_date,
      ),
    );
  });
  const dependencies = liveDependencies(transport);
  const first = searchInput();
  const nextDate = new Date(`${departureDate}T00:00:00.000Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);

  await searchOneWayFlights("same-user", first, dependencies);
  await searchOneWayFlights(
    "same-user",
    searchInput({ departureDate: nextDate.toISOString().slice(0, 10) }),
    dependencies,
  );
  await searchOneWayFlights(
    "same-user",
    searchInput({ cabinClass: "business" }),
    dependencies,
  );

  assert.equal(callCount, 3);
  const usage = await IgnavUsageState.findById("ignav").lean();
  assert.equal(usage?.confirmedUsed, 5);
});

test("keeps explicitly labelled mock cache entries separate from live results", async () => {
  let liveCallCount = 0;
  const dependencies = liveDependencies(
    createTransport(async () => {
      liveCallCount += 1;
      return providerResponse(200, fareResponse());
    }),
  );
  const input = searchInput();
  const mock = await searchOneWayFlights("mode-isolation-user", input, {
    ...dependencies,
    mode: "mock",
  });
  const live = await searchOneWayFlights(
    "mode-isolation-user",
    input,
    dependencies,
  );

  assert.equal(mock.dataMode, "mock");
  assert.equal(live.dataMode, "live");
  assert.equal(liveCallCount, 1);
  const usage = await IgnavUsageState.findById("ignav").lean();
  assert.equal(usage?.confirmedUsed, 3);
});

test("treats a valid empty itinerary response as a successful search", async () => {
  const transport = createTransport(async () =>
    providerResponse(200, fareResponse("HYD", "BOM", departureDate, [])),
  );
  const result = await searchOneWayFlights(
    "empty-results-user",
    searchInput(),
    liveDependencies(transport),
  );

  assert.equal(result.dataMode, "live");
  assert.deepEqual(result.itineraries, []);
  assert.notEqual(result.observedAt, null);
  const usage = await IgnavUsageState.findById("ignav").lean();
  assert.equal(usage?.confirmedUsed, 3);
});

test("does not count definitive provider 4xx or 5xx responses as successful usage", async () => {
  for (const status of [400, 500]) {
    const transport = createTransport(async () =>
      providerResponse(status, { message: "provider error body is not returned" }),
    );
    await assert.rejects(
      searchOneWayFlights(
        `failed-${status}`,
        searchInput(),
        liveDependencies(transport),
      ),
      (error: unknown) =>
        error instanceof Error &&
        error.message === `Ignav request failed with HTTP ${status}.`,
    );
  }

  const usage = await IgnavUsageState.findById("ignav").lean();
  assert.equal(usage?.confirmedUsed, 2);
  assert.equal(usage?.reserved, 0);
  assert.equal(
    await IgnavUsageOperation.countDocuments({ status: "failed" }),
    2,
  );
});

test("retains a reservation after an ambiguous timeout and blocks a duplicate", async () => {
  let callCount = 0;
  const transport = createTransport(
    (_url, init) =>
      new Promise<IgnavHttpResponse>((_resolve, reject) => {
        callCount += 1;
        init.signal?.addEventListener("abort", () => reject(new Error("aborted")));
      }),
  );
  const dependencies = liveDependencies(transport, { requestTimeoutMs: 30 });

  await assert.rejects(
    searchOneWayFlights("timeout-user", searchInput(), dependencies),
    /outcome is uncertain/,
  );
  await assert.rejects(
    searchOneWayFlights("timeout-user", searchInput(), dependencies),
    /unresolved provider outcome/,
  );

  const usage = await IgnavUsageState.findById("ignav").lean();
  assert.equal(usage?.confirmedUsed, 2);
  assert.equal(usage?.reserved, 1);
  assert.equal(callCount, 1);
  assert.equal(
    await IgnavUsageOperation.countDocuments({ status: "ambiguous" }),
    1,
  );
});

test("does not cache malformed HTTP 200 responses and returns a safe error", async () => {
  let callCount = 0;
  const transport = createTransport(async () => {
    callCount += 1;
    return providerResponse(200, { itineraries: "not-an-array" });
  });
  const dependencies = liveDependencies(transport);

  await assert.rejects(
    searchOneWayFlights("malformed-user", searchInput(), dependencies),
    /invalid fare search response/,
  );
  await assert.rejects(
    searchOneWayFlights("malformed-user", searchInput(), dependencies),
    /invalid fare search response/,
  );

  assert.equal(callCount, 2);
  const usage = await IgnavUsageState.findById("ignav").lean();
  assert.equal(usage?.confirmedUsed, 4);
  assert.equal(await IgnavFlightCache.countDocuments({ status: "completed" }), 0);
});

test("blocks requests when the live switch is disabled, capacity is exhausted, or the key is missing", async () => {
  let callCount = 0;
  const transport = createTransport(async () => {
    callCount += 1;
    return providerResponse(200, fareResponse());
  });

  await assert.rejects(
    searchOneWayFlights(
      "disabled-user",
      searchInput(),
      liveDependencies(transport, { liveSearchEnabled: false }),
    ),
    /disabled/,
  );
  await assert.rejects(
    searchOneWayFlights(
      "limit-user",
      searchInput(),
      liveDependencies(transport, { internalLimit: 2 }),
    ),
    /internal request limit/,
  );
  await assert.rejects(
    searchOneWayFlights("missing-key-user", searchInput(), {
      ...liveDependencies(transport),
      apiKey: () => undefined,
    }),
    /not configured/,
  );

  assert.equal(callCount, 0);
  const usage = await IgnavUsageState.findById("ignav").lean();
  assert.equal(usage?.confirmedUsed, 2);
  assert.equal(usage?.reserved, 0);
});
