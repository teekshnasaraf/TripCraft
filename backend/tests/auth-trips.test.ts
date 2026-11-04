import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { after, before, beforeEach, test } from "node:test";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import type { Express } from "express";
import { Trip } from "../src/models/Trip.js";
import { User } from "../src/models/User.js";
import { getDemoOptions } from "../src/integrations/travel/providers/demoCatalog.js";
import { executeProviderSearch } from "../src/services/travel.service.js";
import { travelProviders } from "../src/integrations/travel/providerRegistry.js";
import {
  IgnavFlightCache,
  IgnavUsageOperation,
  IgnavUsageState,
  IgnavUserRateLimit,
} from "../src/models/IgnavUsage.js";
import {
  getIgnavUsageSummary,
  runIgnavOperation,
  type IgnavManagerSettings,
} from "../src/services/ignavUsage.service.js";
import { AppError } from "../src/utils/AppError.js";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = randomBytes(32).toString("hex");
process.env.JWT_EXPIRES_IN = "15m";

let app: Express;
let mongoServer: MongoMemoryServer;

interface ApiUser {
  id: string;
  name: string;
  email: string;
}

interface RegisteredAccount {
  email: string;
  password: string;
  token: string;
  user: ApiUser;
}

async function registerAccount(): Promise<RegisteredAccount> {
  const credentials = {
    name: `Test ${randomUUID()}`,
    email: `${randomUUID()}@example.test`,
    password: randomBytes(18).toString("base64url"),
  };
  const response = await request(app)
    .post("/api/auth/register")
    .send(credentials);

  assert.equal(response.status, 201);
  return {
    ...credentials,
    token: response.body.data.token as string,
    user: response.body.data.user as ApiUser,
  };
}

function authorization(token: string) {
  return { Authorization: `Bearer ${token}` };
}

const departureDate = new Date();
departureDate.setUTCDate(departureDate.getUTCDate() + 30);
const returnDate = new Date(departureDate);
returnDate.setUTCDate(returnDate.getUTCDate() + 4);

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const validTrip = {
  origin: "Delhi",
  destination: "Jaipur",
  departureDate: dateOnly(departureDate),
  returnDate: dateOnly(returnDate),
  travellers: { adults: 2, children: 1 },
  budget: { amount: 45000, currency: "INR" },
  interests: ["culture", "food"],
  accommodation: "standard",
  tripStyle: "balanced_experience",
};

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  ({ app } = await import("../src/app.js"));
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Trip.deleteMany({}),
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

function ignavSettings(
  overrides: Partial<IgnavManagerSettings> = {},
): IgnavManagerSettings {
  return {
    freeAllowance: 1_000,
    internalLimit: 800,
    initialUsed: 2,
    cacheTtlMs: 30 * 60_000,
    userRateLimitPerMinute: 100,
    requestTimeoutMs: 1_000,
    liveSearchEnabled: true,
    ...overrides,
  };
}

function runMockFareSearch(
  parameters: Record<string, unknown>,
  execute: (signal: AbortSignal) => Promise<{
    status: number;
    body: unknown;
  }>,
  options: {
    userId?: string;
    settings?: Partial<IgnavManagerSettings>;
  } = {},
) {
  return runIgnavOperation({
    userId: options.userId ?? "test-user",
    operation: "fare_search",
    parameters,
    metadata: {
      origin: "HYD",
      destination: "BOM",
      departureDate: "2026-12-10",
      market: "IN",
      adults: 1,
      cabinClass: "economy",
    },
    settings: ignavSettings(options.settings),
    execute,
  });
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

test("keeps every registered travel source in explicit demo mode", () => {
  const providers = Object.values(travelProviders).flat();
  assert.equal(providers.length, 4);
  for (const provider of providers) {
    assert.equal(provider.dataMode, "demo");
    assert.ok(provider.id.startsWith("tripcraft-demo-"));
  }
});

test("registers, hashes passwords, logs in, and returns a safe current-user profile", async () => {
  const account = await registerAccount();
  assert.equal(account.user.email, account.email.toLowerCase());
  assert.equal("passwordHash" in account.user, false);

  const storedUser = await User.findById(account.user.id).select(
    "+passwordHash",
  );
  assert.ok(storedUser);
  assert.notEqual(storedUser.passwordHash, account.password);
  assert.equal(await bcrypt.compare(account.password, storedUser.passwordHash), true);

  const loginResponse = await request(app)
    .post("/api/auth/login")
    .send({ email: account.email.toUpperCase(), password: account.password });
  assert.equal(loginResponse.status, 200);
  assert.equal(loginResponse.body.data.user.id, account.user.id);
  assert.equal(typeof loginResponse.body.data.token, "string");

  const currentUserResponse = await request(app)
    .get("/api/auth/me")
    .set(authorization(account.token));
  assert.equal(currentUserResponse.status, 200);
  assert.deepEqual(currentUserResponse.body.data.user, account.user);
});

test("rejects duplicate registrations and invalid credentials without disclosing which failed", async () => {
  const account = await registerAccount();
  const duplicate = await request(app)
    .post("/api/auth/register")
    .send({
      name: "Duplicate",
      email: account.email,
      password: randomBytes(18).toString("base64url"),
    });
  assert.equal(duplicate.status, 409);

  const missingUser = await request(app)
    .post("/api/auth/login")
    .send({
      email: `${randomUUID()}@example.test`,
      password: randomBytes(18).toString("base64url"),
    });
  const wrongPassword = await request(app)
    .post("/api/auth/login")
    .send({ email: account.email, password: randomBytes(18).toString("base64url") });

  assert.equal(missingUser.status, 401);
  assert.equal(wrongPassword.status, 401);
  assert.equal(missingUser.body.message, wrongPassword.body.message);
});

test("rejects missing, invalid, and expired access tokens and invalid registration data", async () => {
  const noToken = await request(app).get("/api/auth/me");
  assert.equal(noToken.status, 401);

  const invalidToken = await request(app)
    .get("/api/auth/me")
    .set(authorization("not-a-valid-token"));
  assert.equal(invalidToken.status, 401);

  const expiredToken = jwt.sign(
    { sub: randomBytes(12).toString("hex") },
    process.env.JWT_SECRET as string,
    { expiresIn: "-1s" },
  );
  const expired = await request(app)
    .get("/api/auth/me")
    .set(authorization(expiredToken));
  assert.equal(expired.status, 401);

  const invalidRegistration = await request(app)
    .post("/api/auth/register")
    .send({ name: "", email: "not-an-email", password: "short" });
  assert.equal(invalidRegistration.status, 400);
});

test("creates, lists, reads, updates, and deletes only the authenticated user's trips", async () => {
  const owner = await registerAccount();
  const otherUser = await registerAccount();
  const created = await request(app)
    .post("/api/trips")
    .set(authorization(owner.token))
    .send(validTrip);

  assert.equal(created.status, 201);
  assert.equal(created.body.data.trip.destination, validTrip.destination);
  assert.equal("userId" in created.body.data.trip, false);

  const tripId = created.body.data.trip.id as string;
  const ownerList = await request(app)
    .get("/api/trips")
    .set(authorization(owner.token));
  assert.equal(ownerList.status, 200);
  assert.equal(ownerList.body.data.total, 1);
  assert.deepEqual(ownerList.body.data.summary, { upcoming: 1, completed: 0 });
  assert.equal(ownerList.body.data.trips[0].id, tripId);

  const otherList = await request(app)
    .get("/api/trips")
    .set(authorization(otherUser.token));
  assert.equal(otherList.status, 200);
  assert.equal(otherList.body.data.total, 0);

  const ownTrip = await request(app)
    .get(`/api/trips/${tripId}`)
    .set(authorization(owner.token));
  assert.equal(ownTrip.status, 200);

  const planned = await request(app)
    .patch(`/api/trips/${tripId}`)
    .set(authorization(owner.token))
    .send({ status: "planned" });
  assert.equal(planned.status, 200);
  assert.equal(planned.body.data.trip.status, "planned");

  const invalidDepartureDate = new Date(`${validTrip.returnDate}T00:00:00.000Z`);
  invalidDepartureDate.setUTCDate(invalidDepartureDate.getUTCDate() + 1);
  const invalidDateUpdate = await request(app)
    .patch(`/api/trips/${tripId}`)
    .set(authorization(owner.token))
    .send({ departureDate: dateOnly(invalidDepartureDate) });
  assert.equal(invalidDateUpdate.status, 400);

  const identicalDestinationUpdate = await request(app)
    .patch(`/api/trips/${tripId}`)
    .set(authorization(owner.token))
    .send({ destination: "Delhi" });
  assert.equal(identicalDestinationUpdate.status, 400);

  const inaccessible = await request(app)
    .get(`/api/trips/${tripId}`)
    .set(authorization(otherUser.token));
  assert.equal(inaccessible.status, 404);

  const inaccessibleUpdate = await request(app)
    .patch(`/api/trips/${tripId}`)
    .set(authorization(otherUser.token))
    .send({ status: "cancelled" });
  assert.equal(inaccessibleUpdate.status, 404);

  const inaccessibleDelete = await request(app)
    .delete(`/api/trips/${tripId}`)
    .set(authorization(otherUser.token));
  assert.equal(inaccessibleDelete.status, 404);

  const deleted = await request(app)
    .delete(`/api/trips/${tripId}`)
    .set(authorization(owner.token));
  assert.equal(deleted.status, 200);
  assert.equal(
    (
      await request(app)
        .get(`/api/trips/${tripId}`)
        .set(authorization(owner.token))
    ).status,
    404,
  );
});

test("validates trip payloads, nested fields, dates, ownership, and identifiers", async () => {
  const account = await registerAccount();
  const invalidReturnDate = new Date(departureDate);
  invalidReturnDate.setUTCDate(invalidReturnDate.getUTCDate() - 1);

  const invalidTrip = await request(app)
    .post("/api/trips")
    .set(authorization(account.token))
    .send({ ...validTrip, returnDate: dateOnly(invalidReturnDate) });
  assert.equal(invalidTrip.status, 400);

  const injectedOwner = await request(app)
    .post("/api/trips")
    .set(authorization(account.token))
    .send({ ...validTrip, userId: randomBytes(12).toString("hex") });
  assert.equal(injectedOwner.status, 400);

  const injectedNestedField = await request(app)
    .post("/api/trips")
    .set(authorization(account.token))
    .send({
      ...validTrip,
      travellers: { adults: 1, children: 0, ownerId: "unexpected" },
    });
  assert.equal(injectedNestedField.status, 400);

  const invalidIdentifier = await request(app)
    .get("/api/trips/not-an-object-id")
    .set(authorization(account.token));
  assert.equal(invalidIdentifier.status, 400);

  const noAuth = await request(app).post("/api/trips").send(validTrip);
  assert.equal(noAuth.status, 401);

  const invalidPagination = await request(app)
    .get("/api/trips?page=0")
    .set(authorization(account.token));
  assert.equal(invalidPagination.status, 400);

  const malformedJson = await request(app)
    .post("/api/auth/register")
    .set("Content-Type", "application/json")
    .send('{"name":');
  assert.equal(malformedJson.status, 400);
});

test("searches clearly labeled demo options and enforces owner-scoped selection persistence", async () => {
  const owner = await registerAccount();
  const otherUser = await registerAccount();
  const created = await request(app)
    .post("/api/trips")
    .set(authorization(owner.token))
    .send(validTrip);
  const tripId = created.body.data.trip.id as string;

  const hotels = await request(app)
    .post(`/api/trips/${tripId}/search/hotels`)
    .set(authorization(owner.token))
    .send({});
  assert.equal(hotels.status, 200);
  assert.equal(hotels.body.data.dataMode, "demo");
  assert.equal(hotels.body.data.results.length, 2);
  assert.equal(hotels.body.data.results[0].category, "hotels");
  assert.equal(hotels.body.data.results[0].provider, "TripCraft demo catalogue");
  assert.equal(hotels.body.data.results[0].dataMode, "demo");
  assert.equal(hotels.body.data.results[0].price.currency, "INR");
  assert.equal(hotels.body.data.results[0].price.includesTaxes, false);
  assert.equal(hotels.body.data.results[0].rating, null);
  assert.equal(hotels.body.data.results[0].availability, "unknown");
  assert.equal(hotels.body.data.results[0].bookingUrl, null);
  assert.equal(typeof hotels.body.data.results[0].retrievedAt, "string");
  const hotelPriceLimit = await request(app)
    .post(`/api/trips/${tripId}/search/hotels`)
    .set(authorization(owner.token))
    .send({ maxBudget: 10_000 });
  assert.deepEqual(
    hotelPriceLimit.body.data.results.map(
      (option: { id: string }) => option.id,
    ),
    ["demo-hotel-jaipur-budget"],
  );
  const hotelAmenityFilter = await request(app)
    .post(`/api/trips/${tripId}/search/hotels`)
    .set(authorization(owner.token))
    .send({ amenities: ["Restaurant"], accommodationType: "standard" });
  assert.equal(hotelAmenityFilter.body.data.results.length, 1);
  assert.equal(
    hotelAmenityFilter.body.data.results[0].id,
    "demo-hotel-jaipur-standard",
  );
  const multipleRooms = await request(app)
    .post(`/api/trips/${tripId}/search/hotels`)
    .set(authorization(owner.token))
    .send({ rooms: 2 });
  assert.equal(multipleRooms.status, 200);
  assert.equal(
    multipleRooms.body.data.results[0].attributes.requestedRooms,
    2,
  );

  const directFlights = await request(app)
    .post(`/api/trips/${tripId}/search/flights`)
    .set(authorization(owner.token))
    .send({ directOnly: true });
  assert.equal(directFlights.status, 200);
  assert.equal(directFlights.body.data.results.length, 1);
  assert.equal(directFlights.body.data.results[0].attributes.stops, 0);
  assert.equal(directFlights.body.data.results[0].price.scope, "per_person");
  const airlineFilter = await request(app)
    .post(`/api/trips/${tripId}/search/flights`)
    .set(authorization(owner.token))
    .send({ airline: "Sample", departurePeriod: "afternoon", maxBudget: 6_500 });
  assert.equal(airlineFilter.body.data.results.length, 1);
  assert.equal(
    airlineFilter.body.data.results[0].attributes.airline,
    "Sample carrier",
  );
  const unavailableCabin = await request(app)
    .post(`/api/trips/${tripId}/search/flights`)
    .set(authorization(owner.token))
    .send({ cabinClass: "business" });
  assert.equal(unavailableCabin.status, 200);
  assert.equal(unavailableCabin.body.data.results.length, 0);

  const trains = await request(app)
    .post(`/api/trips/${tripId}/search/trains`)
    .set(authorization(owner.token))
    .send({ trainClass: "sleeper" });
  assert.equal(trains.status, 200);
  assert.equal(trains.body.data.results.length, 1);
  assert.equal(trains.body.data.results[0].price.scope, "per_person");
  assert.equal(trains.body.data.results[0].price.includesTaxes, true);
  const trainPriceLimit = await request(app)
    .post(`/api/trips/${tripId}/search/trains`)
    .set(authorization(owner.token))
    .send({ maxBudget: 1_000, departurePeriod: "morning" });
  assert.equal(trainPriceLimit.body.data.results.length, 1);
  const places = await request(app)
    .post(`/api/trips/${tripId}/search/destinations`)
    .set(authorization(owner.token))
    .send({ placeType: "attraction" });
  assert.equal(places.status, 200);
  assert.equal(places.body.data.dataMode, "demo");
  assert.equal(places.body.data.results[0].price, null);
  assert.equal(places.body.data.results[0].attributes.coordinates, null);
  const minimumRating = await request(app)
    .post(`/api/trips/${tripId}/search/hotels`)
    .set(authorization(owner.token))
    .send({ minimumRating: 4 });
  assert.equal(minimumRating.status, 200);
  assert.equal(minimumRating.body.data.results.length, 0);

  const invalidFilter = await request(app)
    .post(`/api/trips/${tripId}/search/hotels`)
    .set(authorization(owner.token))
    .send({ directOnly: true });
  assert.equal(invalidFilter.status, 400);
  const invalidBudget = await request(app)
    .post(`/api/trips/${tripId}/search/flights`)
    .set(authorization(owner.token))
    .send({ maxBudget: 0 });
  assert.equal(invalidBudget.status, 400);

  const inaccessibleSearch = await request(app)
    .post(`/api/trips/${tripId}/search/hotels`)
    .set(authorization(otherUser.token))
    .send({});
  assert.equal(inaccessibleSearch.status, 404);

  const savedHotel = await request(app)
    .post(`/api/trips/${tripId}/selections`)
    .set(authorization(owner.token))
    .send({ category: "hotels", optionId: "demo-hotel-jaipur-standard" });
  assert.equal(savedHotel.status, 200);
  assert.equal(savedHotel.body.data.selections.length, 1);
  assert.equal(savedHotel.body.data.selections[0].dataMode, "demo");
  assert.equal("userId" in savedHotel.body.data.selections[0], false);
  const duplicateHotel = await request(app)
    .post(`/api/trips/${tripId}/selections`)
    .set(authorization(owner.token))
    .send({ category: "hotels", optionId: "demo-hotel-jaipur-standard" });
  assert.equal(duplicateHotel.status, 200);
  assert.equal(duplicateHotel.body.data.selections.length, 1);

  await request(app)
    .post(`/api/trips/${tripId}/selections`)
    .set(authorization(owner.token))
    .send({ category: "flights", optionId: "demo-flight-delhi-jaipur" })
    .expect(200);
  const savedTrain = await request(app)
    .post(`/api/trips/${tripId}/selections`)
    .set(authorization(owner.token))
    .send({ category: "trains", optionId: "demo-train-delhi-jaipur" });
  assert.equal(savedTrain.status, 200);
  assert.deepEqual(
    savedTrain.body.data.selections.map(
      (selection: { category: string }) => selection.category,
    ),
    ["hotels", "trains"],
  );

  const invalidOption = await request(app)
    .post(`/api/trips/${tripId}/selections`)
    .set(authorization(owner.token))
    .send({
      category: "hotels",
      optionId: "demo-hotel-jaipur-standard",
      price: { amount: 1 },
    });
  assert.equal(invalidOption.status, 400);

  const trip = await request(app)
    .get(`/api/trips/${tripId}`)
    .set(authorization(owner.token));
  assert.equal(trip.status, 200);
  assert.deepEqual(
    trip.body.data.trip.selections.map(
      (selection: { category: string }) => selection.category,
    ),
    ["hotels", "trains"],
  );

  const savedPlace = await request(app)
    .post(`/api/trips/${tripId}/selections`)
    .set(authorization(owner.token))
    .send({
      category: "destinations",
      optionId: "demo-place-jaipur-hawa-mahal",
    });
  assert.equal(savedPlace.status, 200, JSON.stringify(savedPlace.body));
  assert.equal(savedPlace.body.data.selections.length, 3);
  assert.equal(
    savedPlace.body.data.selections.find(
      (selection: { category: string }) =>
        selection.category === "destinations",
    ).price,
    null,
  );

  const recommendations = await request(app)
    .get(`/api/trips/${tripId}/recommendations`)
    .set(authorization(owner.token));
  assert.equal(recommendations.status, 200);
  assert.equal(recommendations.body.data.recommendations.length, 3);
  for (const recommendation of recommendations.body.data.recommendations) {
    assert.equal(recommendation.complete, false);
    assert.ok(
      !recommendation.options.some(
        (option: { category: string }) => option.category === "flights",
      ) ||
        !recommendation.options.some(
          (option: { category: string }) => option.category === "trains",
        ),
    );
    assert.equal(recommendation.options.length, 2);
  }
  assert.equal(
    recommendations.body.data.recommendations[0].knownSampleAmount,
    9_600,
  );
  assert.equal(
    recommendations.body.data.recommendations[0]
      .remainingBudgetBeforeUnpricedCosts,
    35_400,
  );
  assert.equal(
    recommendations.body.data.recommendations[0].withinBudgetForPricedItems,
    true,
  );
  assert.equal(
    recommendations.body.data.recommendations[1].knownSampleAmount,
    27_600,
  );
  assert.match(
    recommendations.body.data.recommendations[1].explanation,
    /closest to 70% of the trip budget/,
  );
  assert.equal(
    recommendations.body.data.recommendations[2].knownSampleAmount,
    37_200,
  );
  assert.equal(
    recommendations.body.data.recommendations[1].style,
    "balanced_experience",
  );
  assert.equal(
    recommendations.body.data.recommendations[2].style,
    "premium_experience",
  );

  const removed = await request(app)
    .delete(
      `/api/trips/${tripId}/selections/trains/demo-train-delhi-jaipur`,
    )
    .set(authorization(owner.token));
  assert.equal(removed.status, 200);
  assert.deepEqual(
    removed.body.data.selections.map(
      (selection: { category: string }) => selection.category,
    ),
    ["hotels", "destinations"],
  );

  const inaccessibleSelection = await request(app)
    .post(`/api/trips/${tripId}/selections`)
    .set(authorization(otherUser.token))
    .send({ category: "hotels", optionId: "demo-hotel-jaipur-standard" });
  assert.equal(inaccessibleSelection.status, 404);
});

test("maps provider timeouts to an explicit service-unavailable error", async () => {
  await assert.rejects(
    executeProviderSearch(
      {
        id: "test-timeout",
        category: "hotels",
        dataMode: "demo",
        search: () => new Promise(() => {}),
        resolveOption: async () => undefined,
      },
      {
        origin: "Delhi",
        destination: "Jaipur",
        departureDate: "2030-07-01",
        returnDate: "2030-07-05",
        adults: 1,
        children: 0,
      },
      {},
      1,
    ),
    (error: unknown) => {
      assert.equal(
        error instanceof Error ? error.message : "",
        "Travel search provider timed out.",
      );
      return true;
    },
  );
});

test("does not treat an unpriced offer as within a maximum budget", async () => {
  const account = await registerAccount();
  const created = await request(app)
    .post("/api/trips")
    .set(authorization(account.token))
    .send(validTrip);
  const tripId = created.body.data.trip.id as string;
  const previousProviders = travelProviders.hotels;
  const unpricedOption = {
    ...getDemoOptions("hotels")[0],
    price: null,
    retrievedAt: new Date().toISOString(),
  };
  travelProviders.hotels = [
    {
      id: "test-unpriced-hotels",
      category: "hotels",
      dataMode: "demo",
      search: async () => [unpricedOption],
      resolveOption: async () => undefined,
    },
  ];

  try {
    const response = await request(app)
      .post(`/api/trips/${tripId}/search/hotels`)
      .set(authorization(account.token))
      .send({ maxBudget: 10_000 });
    assert.equal(response.status, 200);
    assert.equal(response.body.data.results.length, 0);
  } finally {
    travelProviders.hotels = previousProviders;
  }
});

test("excludes unknown-price options from recommendation combinations", async () => {
  const account = await registerAccount();
  const created = await request(app)
    .post("/api/trips")
    .set(authorization(account.token))
    .send(validTrip);
  const tripId = created.body.data.trip.id as string;
  const previousHotels = travelProviders.hotels;
  const demoHotels = previousHotels[0];
  travelProviders.hotels = [
    {
      ...demoHotels,
      search: async (input, filters, signal) =>
        (await demoHotels.search(input, filters, signal)).map((option) => ({
          ...option,
          price: null,
        })),
    },
  ];

  try {
    const response = await request(app)
      .get(`/api/trips/${tripId}/recommendations`)
      .set(authorization(account.token));
    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data.recommendations, []);
  } finally {
    travelProviders.hotels = previousHotels;
  }
});

test("maps provider failures to an explicit service-unavailable error", async () => {
  await assert.rejects(
    executeProviderSearch(
      {
        id: "test-failure",
        category: "hotels",
        dataMode: "demo",
        search: async () => {
          throw new Error("provider internals must not leak");
        },
        resolveOption: async () => undefined,
      },
      {
        origin: "Delhi",
        destination: "Jaipur",
        departureDate: "2030-07-01",
        returnDate: "2030-07-05",
        adults: 1,
        children: 0,
      },
    ),
    (error: unknown) => {
      assert.equal(
        error instanceof Error ? error.message : "",
        "Travel search provider is unavailable.",
      );
      return true;
    },
  );
});

test("blocks disabled Ignav calls without invoking the provider", async () => {
  let providerCalls = 0;
  await assert.rejects(
    runMockFareSearch(
      { origin: "HYD", destination: "BOM", date: "disabled" },
      async () => {
        providerCalls += 1;
        return { status: 200, body: { itineraries: [] } };
      },
      { settings: { liveSearchEnabled: false } },
    ),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 503 &&
      error.message === "Live Ignav requests are disabled.",
  );
  assert.equal(providerCalls, 0);
  assert.equal((await IgnavUsageState.findById("ignav"))?.blockedRequests, 1);
});

test("reserves before a mock provider call and caches successful billable results", async () => {
  let providerCalls = 0;
  const parameters = {
    origin: "HYD",
    destination: "BOM",
    departure_date: "2026-12-10",
    market: "IN",
    adults: 1,
    cabin_class: "economy",
  };
  const result = {
    itineraries: [
      { carrier: "Mock airline", price: { amount: 100, currency: "INR" } },
    ],
  };

  const first = await runMockFareSearch(parameters, async () => {
    providerCalls += 1;
    const state = await IgnavUsageState.findById("ignav");
    const operation = await IgnavUsageOperation.findOne({
      status: "reserved",
    });
    assert.equal(state?.confirmedUsed, 2);
    assert.equal(state?.reserved, 1);
    assert.ok(operation);
    assert.equal(operation.billable, true);
    assert.equal(operation.metadata.origin, "HYD");
    return { status: 200, body: result };
  });
  const second = await runMockFareSearch(
    {
      cabin_class: "economy",
      adults: 1,
      market: "IN",
      departure_date: "2026-12-10",
      destination: "BOM",
      origin: "HYD",
    },
    async () => {
      providerCalls += 1;
      return { status: 200, body: { unexpected: true } };
    },
  );

  assert.deepEqual(first, result);
  assert.deepEqual(second, result);
  assert.equal(providerCalls, 1);
  const state = await IgnavUsageState.findById("ignav");
  assert.equal(state?.confirmedUsed, 3);
  assert.equal(state?.reserved, 0);
  assert.equal(state?.cacheMisses, 1);
  assert.equal(state?.cacheHits, 1);
  assert.ok(state?.lastSuccessfulRequestAt);
  assert.equal(
    await IgnavUsageOperation.countDocuments({ status: "succeeded" }),
    1,
  );
});

test("keeps cached results isolated by material search parameters", async () => {
  let providerCalls = 0;
  const search = (market: string) =>
    runMockFareSearch(
      { origin: "HYD", destination: "BOM", date: "cache-isolation", market },
      async () => {
        providerCalls += 1;
        return { status: 200, body: { market } };
      },
    );

  assert.deepEqual(await search("IN"), { market: "IN" });
  assert.deepEqual(await search("GB"), { market: "GB" });
  assert.deepEqual(await search("IN"), { market: "IN" });
  assert.equal(providerCalls, 2);
  const state = await IgnavUsageState.findById("ignav");
  assert.equal(state?.confirmedUsed, 4);
  assert.equal(state?.cacheMisses, 2);
  assert.equal(state?.cacheHits, 1);
});

test("does not count definitive 4xx and 5xx responses as successful usage", async () => {
  for (const status of [429, 503]) {
    await assert.rejects(
      runMockFareSearch(
        { origin: "HYD", destination: "BOM", date: `status-${status}` },
        async () => ({ status, body: { error: "mock provider error" } }),
      ),
      (error: unknown) =>
        error instanceof AppError && error.statusCode === 502,
    );
    const operation = await IgnavUsageOperation.findOne({
      requestStatus: status,
    });
    assert.equal(operation?.status, "failed");
  }
  const state = await IgnavUsageState.findById("ignav");
  assert.equal(state?.confirmedUsed, 2);
  assert.equal(state?.reserved, 0);
});

test("keeps timeout reservations and blocks duplicate calls after an ambiguous outcome", async () => {
  let providerCalls = 0;
  const parameters = { origin: "HYD", destination: "BOM", date: "timeout" };
  await assert.rejects(
    runMockFareSearch(
      parameters,
      async (signal) => {
        providerCalls += 1;
        return new Promise((_resolve, reject) => {
          signal.addEventListener(
            "abort",
            () => reject(new Error("mock timeout")),
            { once: true },
          );
        });
      },
      { settings: { requestTimeoutMs: 20 } },
    ),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 503 &&
      /outcome is uncertain/.test(error.message),
  );

  await assert.rejects(
    runMockFareSearch(parameters, async () => {
      providerCalls += 1;
      return { status: 200, body: {} };
    }),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 503 &&
      /unresolved provider outcome/.test(error.message),
  );
  const state = await IgnavUsageState.findById("ignav");
  assert.equal(state?.confirmedUsed, 2);
  assert.equal(state?.reserved, 1);
  assert.equal(state?.blockedRequests, 1);
  assert.equal(providerCalls, 1);
  assert.equal(
    await IgnavUsageOperation.countDocuments({ status: "ambiguous" }),
    1,
  );
});

test("atomically prevents concurrent billable requests exceeding the hard limit", async () => {
  let providerCalls = 0;
  let releaseProvider: (() => void) | undefined;
  const gate = new Promise<void>((resolve) => {
    releaseProvider = resolve;
  });
  await getIgnavUsageSummary();

  const requests = [0, 1, 2].map((index) =>
    runMockFareSearch(
      {
        origin: "HYD",
        destination: "BOM",
        date: `concurrent-${index}`,
      },
      async () => {
        providerCalls += 1;
        await gate;
        return { status: 200, body: { index } };
      },
      { settings: { internalLimit: 4 } },
    ),
  );
  const settledRequests = Promise.allSettled(requests);
  await waitFor(() => providerCalls === 2);
  releaseProvider?.();
  const results = await settledRequests;

  assert.equal(providerCalls, 2);
  assert.equal(
    results.filter((result) => result.status === "fulfilled").length,
    2,
  );
  const blocked = results.find(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );
  assert.ok(blocked);
  assert.ok(blocked.reason instanceof AppError);
  assert.equal(blocked.reason.statusCode, 429);
  const state = await IgnavUsageState.findById("ignav");
  assert.equal(state?.confirmedUsed, 4);
  assert.equal(state?.reserved, 0);
});

test("coalesces concurrent identical searches into one provider request", async () => {
  let providerCalls = 0;
  let releaseProvider: (() => void) | undefined;
  const gate = new Promise<void>((resolve) => {
    releaseProvider = resolve;
  });
  await getIgnavUsageSummary();
  const parameters = {
    origin: "MAA",
    destination: "DEL",
    date: "same-search",
  };

  const first = runMockFareSearch(parameters, async () => {
    providerCalls += 1;
    await gate;
    return { status: 200, body: { itineraries: ["mock"] } };
  });
  await waitFor(() => providerCalls === 1);
  const second = runMockFareSearch(parameters, async () => {
    providerCalls += 1;
    return { status: 200, body: { itineraries: ["unexpected"] } };
  });
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(providerCalls, 1);
  releaseProvider?.();

  const [firstResult, secondResult] = await Promise.all([first, second]);
  assert.deepEqual(firstResult, { itineraries: ["mock"] });
  assert.deepEqual(secondResult, firstResult);
  assert.equal(providerCalls, 1);
});

test("does not serve expired cache entries as fresh results", async () => {
  let providerCalls = 0;
  const parameters = { origin: "HYD", destination: "BOM", date: "expires" };
  await runMockFareSearch(parameters, async () => {
    providerCalls += 1;
    return { status: 200, body: { version: 1 } };
  });
  await IgnavFlightCache.updateMany(
    { status: "completed" },
    { $set: { expiresAt: new Date(Date.now() - 1_000) } },
  );
  const refreshed = await runMockFareSearch(parameters, async () => {
    providerCalls += 1;
    return { status: 200, body: { version: 2 } };
  });

  assert.deepEqual(refreshed, { version: 2 });
  assert.equal(providerCalls, 2);
  assert.equal((await IgnavUsageState.findById("ignav"))?.confirmedUsed, 4);
});

test("blocks a request at the hard limit before calling a provider", async () => {
  let providerCalls = 0;
  await assert.rejects(
    runMockFareSearch(
      { origin: "HYD", destination: "BOM", date: "at-limit" },
      async () => {
        providerCalls += 1;
        return { status: 200, body: {} };
      },
      { settings: { internalLimit: 2 } },
    ),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 429 &&
      /internal request limit reached/.test(error.message),
  );
  assert.equal(providerCalls, 0);
  assert.equal((await IgnavUsageState.findById("ignav"))?.blockedRequests, 1);
});

test("enforces the per-user request limit", async () => {
  let providerCalls = 0;
  const settings = { userRateLimitPerMinute: 1 };
  const invoke = (date: string) =>
    runMockFareSearch(
      { origin: "HYD", destination: "BOM", date },
      async () => {
        providerCalls += 1;
        return { status: 200, body: { date } };
      },
      { userId: "rate-limited-user", settings },
    );

  await invoke("within-limit");
  await assert.rejects(
    invoke("over-limit"),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 429 &&
      /rate limit exceeded/.test(error.message),
  );
  assert.equal(providerCalls, 1);
  assert.equal((await IgnavUsageState.findById("ignav"))?.blockedRequests, 1);
});

test("restricts the usage endpoint to authenticated configured administrators", async () => {
  const unauthenticated = await request(app).get("/api/flights/usage");
  assert.equal(unauthenticated.status, 401);

  const account = await registerAccount();
  const previousAllowlist = process.env.IGNAV_USAGE_ADMIN_EMAILS;
  try {
    process.env.IGNAV_USAGE_ADMIN_EMAILS = "";
    const forbidden = await request(app)
      .get("/api/flights/usage")
      .set(authorization(account.token));
    assert.equal(forbidden.status, 403);

    process.env.IGNAV_USAGE_ADMIN_EMAILS = account.email;
    const allowed = await request(app)
      .get("/api/flights/usage")
      .set(authorization(account.token));
    assert.equal(allowed.status, 200);
    assert.equal(allowed.body.data.usage.provider, "ignav");
    assert.equal(
      allowed.body.data.usage.balanceIsProviderVerified,
      false,
    );
    assert.equal(JSON.stringify(allowed.body).includes("IGNAV_API_KEY"), false);
    assert.equal(JSON.stringify(allowed.body).includes("X-Api-Key"), false);
  } finally {
    if (previousAllowlist === undefined) {
      delete process.env.IGNAV_USAGE_ADMIN_EMAILS;
    } else {
      process.env.IGNAV_USAGE_ADMIN_EMAILS = previousAllowlist;
    }
  }
});

test("does not return or log provider error details", async () => {
  const secretSentinel = "test-only-never-a-real-provider-key";
  const loggedMessages: string[] = [];
  const originalConsoleError = console.error;
  console.error = (...values: unknown[]) => {
    loggedMessages.push(values.map(String).join(" "));
  };
  try {
    await assert.rejects(
      runMockFareSearch(
        { origin: "HYD", destination: "BOM", date: "error-redaction" },
        async () => {
          throw new Error(secretSentinel);
        },
      ),
      (error: unknown) =>
        error instanceof AppError &&
        !error.message.includes(secretSentinel),
    );
  } finally {
    console.error = originalConsoleError;
  }
  assert.equal(loggedMessages.join("\n").includes(secretSentinel), false);
});

test("keeps usage accounting across a fresh backend process", async () => {
  await runMockFareSearch(
    { origin: "HYD", destination: "BOM", date: "persistence" },
    async () => ({ status: 200, body: { itineraries: ["persisted"] } }),
  );
  await IgnavFlightCache.deleteMany({});
  await IgnavUserRateLimit.deleteMany({});

  const summary = await getIgnavUsageSummary();
  assert.equal(summary.confirmedBillableRequestsUsed, 3);
  assert.equal(summary.reservedRequests, 0);
  assert.equal(summary.estimatedRemainingInternalBudget, 797);
  assert.equal(summary.balanceIsProviderVerified, false);

  const childEnvironment: NodeJS.ProcessEnv = {
    NODE_ENV: "test",
    MONGODB_URI: mongoServer.getUri(),
    IGNAV_API_KEY: "",
    PATH: process.env.PATH,
    SystemRoot: process.env.SystemRoot,
  };
  const childResult = execFileSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--input-type=module",
      "-e",
      [
        'import mongoose from "mongoose";',
        'import { getIgnavUsageSummary } from "./src/services/ignavUsage.service.ts";',
        "await mongoose.connect(process.env.MONGODB_URI);",
        "const summary = await getIgnavUsageSummary();",
        'console.log(JSON.stringify({ used: summary.confirmedBillableRequestsUsed, remaining: summary.estimatedRemainingInternalBudget }));',
        "await mongoose.disconnect();",
      ].join(" "),
    ],
    { cwd: process.cwd(), env: childEnvironment, encoding: "utf8" },
  );
  assert.deepEqual(JSON.parse(childResult.trim()), { used: 3, remaining: 797 });
});

test("fails closed without an available usage ledger before calling a provider", async () => {
  let providerCalls = 0;
  const mongoUri = mongoServer.getUri();
  await mongoose.disconnect();
  try {
    await assert.rejects(
      runMockFareSearch(
        { origin: "HYD", destination: "BOM", date: "ledger-down" },
        async () => {
          providerCalls += 1;
          return { status: 200, body: {} };
        },
      ),
      (error: unknown) =>
        error instanceof AppError &&
        error.statusCode === 503 &&
        /ledger is unavailable/.test(error.message),
    );
    assert.equal(providerCalls, 0);
  } finally {
    await mongoose.connect(mongoUri);
  }
});

test("returns service unavailable for database-backed requests when MongoDB is disconnected", async () => {
  await mongoose.disconnect();
  const response = await request(app)
    .post("/api/auth/register")
    .send({
      name: "Unavailable",
      email: `${randomUUID()}@example.test`,
      password: randomBytes(18).toString("base64url"),
    });
  assert.equal(response.status, 503);
});
