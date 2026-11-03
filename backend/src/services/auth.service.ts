import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { config } from "../config/env.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";

const bcryptRounds = 12;

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthResult {
  user: AuthenticatedUser;
  token: string;
}

function toSafeUser(user: {
  _id: { toString(): string };
  name: string;
  email: string;
}): AuthenticatedUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
}

function getJwtSecret(): string {
  const secret = config.jwtSecret;

  if (
    !secret ||
    secret.startsWith("replace_with_") ||
    Buffer.byteLength(secret, "utf8") < 32
  ) {
    throw new AppError(
      503,
      "Authentication is not configured. Set a strong JWT_SECRET before using account services.",
    );
  }

  return secret;
}

function getJwtExpiresIn(): SignOptions["expiresIn"] {
  const match = /^([1-9]\d*)(s|m|h|d)$/.exec(config.jwtExpiresIn);

  if (!match) {
    throw new AppError(
      503,
      "Authentication is not configured. JWT_EXPIRES_IN must be a positive duration such as 15m.",
    );
  }

  return `${match[1]}${match[2]}` as NonNullable<SignOptions["expiresIn"]>;
}

export function assertAuthConfiguration(): void {
  getJwtSecret();
  getJwtExpiresIn();
}

export function createAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, getJwtSecret(), {
    algorithm: "HS256",
    expiresIn: getJwtExpiresIn(),
  });
}

export function verifyAccessToken(token: string): string {
  const secret = getJwtSecret();

  try {
    const payload = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    });

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      !/^[a-f\d]{24}$/i.test(payload.sub)
    ) {
      throw new Error("Invalid token subject");
    }

    return payload.sub;
  } catch {
    throw new AppError(401, "Invalid or expired authentication token.");
  }
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  assertAuthConfiguration();

  const email = input.email.trim().toLowerCase();
  const existingUser = await User.findOne({ email }).select("_id");

  if (existingUser) {
    throw new AppError(409, "An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(input.password, bcryptRounds);

  try {
    const user = await User.create({
      name: input.name.trim(),
      email,
      passwordHash,
    });

    const safeUser = toSafeUser(user);
    return {
      user: safeUser,
      token: createAccessToken(safeUser.id),
    };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new AppError(409, "An account with this email already exists.");
    }

    throw error;
  }
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  assertAuthConfiguration();

  const email = input.email.trim().toLowerCase();
  const user = await User.findOne({ email }).select("+passwordHash");
  const passwordMatches = user
    ? await bcrypt.compare(input.password, user.passwordHash)
    : false;

  if (!user || !passwordMatches) {
    throw new AppError(401, "Invalid email or password.");
  }

  const safeUser = toSafeUser(user);
  return {
    user: safeUser,
    token: createAccessToken(safeUser.id),
  };
}

export async function getAuthenticatedUser(
  userId: string,
): Promise<AuthenticatedUser> {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(401, "Invalid or expired authentication token.");
  }

  return toSafeUser(user);
}
