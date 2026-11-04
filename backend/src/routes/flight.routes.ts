import { Router } from "express";
import {
  getFlightUsage,
  searchFlights,
} from "../controllers/flight.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireIgnavUsageAdmin } from "../middleware/requireIgnavUsageAdmin.js";

export const flightRouter = Router();

flightRouter.use(authenticate);
flightRouter.post("/search", searchFlights);
flightRouter.get("/usage", requireIgnavUsageAdmin, getFlightUsage);
