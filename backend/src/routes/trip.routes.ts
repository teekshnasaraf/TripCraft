import { Router } from "express";
import {
  createTrip,
  deleteTrip,
  getTripRecommendations,
  getTrip,
  listTrips,
  removeTravelSelection,
  saveTravelSelection,
  searchTravelOptions,
  updateTrip,
} from "../controllers/trip.controller.js";
import { authenticate } from "../middleware/authenticate.js";

export const tripRouter = Router();

tripRouter.use(authenticate);
tripRouter.post("/", createTrip);
tripRouter.get("/", listTrips);
tripRouter.post("/:id/search/:category", searchTravelOptions);
tripRouter.get("/:id/recommendations", getTripRecommendations);
tripRouter.post("/:id/selections", saveTravelSelection);
tripRouter.delete(
  "/:id/selections/:category/:optionId",
  removeTravelSelection,
);
tripRouter.get("/:id", getTrip);
tripRouter.patch("/:id", updateTrip);
tripRouter.delete("/:id", deleteTrip);
