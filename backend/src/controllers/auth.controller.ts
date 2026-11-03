import type { RequestHandler } from "express";
import {
  loginUser,
  registerUser,
} from "../services/auth.service.js";
import { parseLoginInput, parseRegisterInput } from "../validators/auth.js";

export const register: RequestHandler = async (request, response) => {
  const input = parseRegisterInput(request.body);
  const result = await registerUser(input);

  response.status(201).json({
    success: true,
    message: "Registration successful.",
    data: result,
  });
};

export const login: RequestHandler = async (request, response) => {
  const input = parseLoginInput(request.body);
  const result = await loginUser(input);

  response.status(200).json({
    success: true,
    message: "Login successful.",
    data: result,
  });
};

export const currentUser: RequestHandler = async (request, response) => {
  if (!request.authUser) {
    response.status(401).json({
      success: false,
      message: "Authentication is required.",
    });
    return;
  }

  response.status(200).json({
    success: true,
    data: { user: request.authUser },
  });
};
