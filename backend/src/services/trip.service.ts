import { Types } from "mongoose";
import { Trip, type TripDocument } from "../models/Trip.js";
import type { SavedTravelSelection } from "../integrations/travel/contracts.js";
import { AppError } from "../utils/AppError.js";
import type { TripInput } from "../validators/trip.js";

export interface TripResponse {
  id: string;
  title: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  travellers: {
    adults: number;
    children: number;
  };
  budget: {
    amount: number;
    currency: "INR";
  };
  interests: string[];
  accommodation: string;
  tripStyle: string;
  status: string;
  selections: SavedTravelSelection[];
  createdAt: string;
  updatedAt: string;
}

export function toTripResponse(trip: TripDocument): TripResponse {
  return {
    id: trip._id.toString(),
    title: trip.title,
    origin: trip.origin,
    destination: trip.destination,
    departureDate: trip.departureDate.toISOString(),
    returnDate: trip.returnDate.toISOString(),
    travellers: trip.travellers,
    budget: trip.budget,
    interests: trip.interests,
    accommodation: trip.accommodation,
    tripStyle: trip.tripStyle,
    status: trip.status,
    selections: trip.selections.map((selection) => ({
      id: selection.id,
      category: selection.category,
      optionId: selection.optionId,
      name: selection.name,
      provider: selection.provider,
      dataMode: selection.dataMode,
      price: selection.price ?? null,
      priceDisclosure: selection.priceDisclosure,
      savedAt: new Date(selection.savedAt).toISOString(),
    })),
    createdAt: trip.createdAt.toISOString(),
    updatedAt: trip.updatedAt.toISOString(),
  };
}

export function isValidTripId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id) && Types.ObjectId.isValid(id);
}

export async function createTrip(
  userId: string,
  input: TripInput,
): Promise<TripResponse> {
  const trip = await Trip.create({
    ...input,
    userId: new Types.ObjectId(userId),
    title: input.title ?? `Trip to ${input.destination}`,
  });
  return toTripResponse(trip);
}

export async function listTrips(
  userId: string,
  page: number,
  limit: number,
): Promise<{
  trips: TripResponse[];
  page: number;
  limit: number;
  total: number;
  summary: { upcoming: number; completed: number };
}> {
  const query = { userId: new Types.ObjectId(userId) };
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const [trips, total, upcoming, completed] = await Promise.all([
    Trip.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Trip.countDocuments(query),
    Trip.countDocuments({
      ...query,
      departureDate: { $gte: today },
      status: { $in: ["draft", "planned"] },
    }),
    Trip.countDocuments({ ...query, status: "completed" }),
  ]);

  return {
    trips: trips.map(toTripResponse),
    page,
    limit,
    total,
    summary: { upcoming, completed },
  };
}

export async function getTrip(
  userId: string,
  tripId: string,
): Promise<TripResponse> {
  const trip = await Trip.findOne({
    _id: new Types.ObjectId(tripId),
    userId: new Types.ObjectId(userId),
  });

  if (!trip) {
    throw new AppError(404, "Trip not found.");
  }

  return toTripResponse(trip);
}

export async function updateTrip(
  userId: string,
  tripId: string,
  input: TripInput,
): Promise<TripResponse> {
  const trip = await Trip.findOne({
    _id: new Types.ObjectId(tripId),
    userId: new Types.ObjectId(userId),
  });

  if (!trip) {
    throw new AppError(404, "Trip not found.");
  }

  const departureDate = input.departureDate ?? trip.departureDate;
  const returnDate = input.returnDate ?? trip.returnDate;
  if (returnDate < departureDate) {
    throw new AppError(400, "Return date must be on or after departure.");
  }
  const origin = input.origin ?? trip.origin;
  const destination = input.destination ?? trip.destination;
  if (
    origin.localeCompare(destination, undefined, { sensitivity: "accent" }) ===
    0
  ) {
    throw new AppError(400, "Origin and destination must be different.");
  }

  trip.set(input);
  await trip.save();
  return toTripResponse(trip);
}

export async function deleteTrip(
  userId: string,
  tripId: string,
): Promise<void> {
  const result = await Trip.deleteOne({
    _id: new Types.ObjectId(tripId),
    userId: new Types.ObjectId(userId),
  });

  if (result.deletedCount === 0) {
    throw new AppError(404, "Trip not found.");
  }
}
