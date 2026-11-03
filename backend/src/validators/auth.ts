import { AppError } from "../utils/AppError.js";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

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

function getString(
  body: Record<string, unknown>,
  field: string,
): string {
  const value = body[field];

  if (typeof value !== "string") {
    throw new AppError(400, `${field} must be a string.`);
  }

  return value;
}

function validateEmail(email: string): string {
  const normalized = email.trim().toLowerCase();

  if (
    normalized.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
  ) {
    throw new AppError(400, "Enter a valid email address.");
  }

  return normalized;
}

export function parseRegisterInput(value: unknown): RegisterInput {
  const body = getRecord(value);
  const name = getString(body, "name").trim();
  const email = validateEmail(getString(body, "email"));
  const password = getString(body, "password");

  if (!name || name.length > 100) {
    throw new AppError(400, "Name must be between 1 and 100 characters.");
  }
  if (password.length < 8) {
    throw new AppError(400, "Password must be at least 8 characters long.");
  }
  if (Buffer.byteLength(password, "utf8") > 72) {
    throw new AppError(400, "Password must not exceed 72 UTF-8 bytes.");
  }

  return { name, email, password };
}

export function parseLoginInput(value: unknown): LoginInput {
  const body = getRecord(value);
  const email = validateEmail(getString(body, "email"));
  const password = getString(body, "password");

  if (!password) {
    throw new AppError(400, "Password is required.");
  }

  return { email, password };
}
