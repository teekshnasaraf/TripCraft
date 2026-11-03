import assert from "node:assert/strict";
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
  await Promise.all([User.deleteMany({}), Trip.deleteMany({})]);
});

after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
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
