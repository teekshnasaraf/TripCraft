import { Router } from "express";
import {
  createTrip,
  deleteTrip,
  getTrip,
  listTrips,
  updateTrip,
} from "../controllers/trip.controller.js";
import { authenticate } from "../middleware/authenticate.js";

export const tripRouter = Router();

tripRouter.use(authenticate);
tripRouter.post("/", createTrip);
tripRouter.get("/", listTrips);
tripRouter.get("/:id", getTrip);
tripRouter.patch("/:id", updateTrip);
tripRouter.delete("/:id", deleteTrip);
