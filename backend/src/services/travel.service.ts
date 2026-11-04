import { Types } from "mongoose";
import {
  type SavedTravelSelection,
  type TravelCategory,
  type TravelOption,
  type TravelProvider,
  type TravelSearchFilters,
  type TravelSearchInput,
} from "../integrations/travel/contracts.js";
import { travelProviders } from "../integrations/travel/providerRegistry.js";
import {
  Trip,
  type TripDocument,
  type TripSelectionDocument,
} from "../models/Trip.js";
import { AppError } from "../utils/AppError.js";
import { isValidTripId } from "./trip.service.js";

export interface TripRecommendation {
  style: "budget_explorer" | "balanced_experience" | "premium_experience";
  title: string;
  options: TravelOption[];
  knownSampleAmount: number;
  remainingBudgetBeforeUnpricedCosts: number;
  withinBudgetForPricedItems: boolean;
  complete: false;
  explanation: string;
  limitations: string[];
}

class ProviderTimeoutError extends AppError {
  constructor() {
    super(503, "Travel search provider timed out.");
  }
}

export async function executeProviderSearch(
  provider: TravelProvider,
  input: TravelSearchInput,
  filters: TravelSearchFilters = {},
  timeoutMs = 5_000,
): Promise<TravelOption[]> {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      provider.search(input, filters, controller.signal),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          controller.abort();
          reject(new ProviderTimeoutError());
        }, timeoutMs);
      }),
    ]);
  } catch (error) {
    if (error instanceof ProviderTimeoutError) {
      throw error;
    }
    throw new AppError(503, "Travel search provider is unavailable.");
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

function getOwnedTrip(userId: string, tripId: string) {
  if (!isValidTripId(tripId)) {
    throw new AppError(400, "Trip ID must be a valid MongoDB ObjectId.");
  }
  return Trip.findOne({
    _id: new Types.ObjectId(tripId),
    userId: new Types.ObjectId(userId),
  });
}

function getTripSearchInput(trip: TripDocument): TravelSearchInput {
  return {
    origin: trip.origin,
    destination: trip.destination,
    departureDate: trip.departureDate.toISOString().slice(0, 10),
    returnDate: trip.returnDate.toISOString().slice(0, 10),
    adults: trip.travellers.adults,
    children: trip.travellers.children,
  };
}

async function searchRegisteredProviders(
  category: TravelCategory,
  input: TravelSearchInput,
  filters: TravelSearchFilters,
): Promise<{
  results: TravelOption[];
  dataMode: "live" | "demo" | "mixed";
  providerErrors: Array<{ provider: string; message: string }>;
}> {
  const providers = travelProviders[category];
  if (providers.length === 0) {
    throw new AppError(503, "No travel search provider is configured.");
  }
  type ProviderSearchResponse =
    | { provider: TravelProvider; results: TravelOption[] }
    | { provider: TravelProvider; error: string };
  const responses: ProviderSearchResponse[] = await Promise.all(
    providers.map(async (provider): Promise<ProviderSearchResponse> => {
      try {
        return {
          provider,
          results: await executeProviderSearch(provider, input, filters),
        };
      } catch (error) {
        return {
          provider,
          error:
            error instanceof AppError
              ? error.message
              : "Travel search provider is unavailable.",
        };
      }
    }),
  );
  const results = responses.flatMap((response) =>
    "results" in response ? response.results : [],
  );
  const providerErrors = responses.flatMap((response) =>
    "error" in response
      ? [{ provider: response.provider.id, message: response.error }]
      : [],
  );
  if (providerErrors.length === providers.length) {
    throw new AppError(503, "All travel search providers are unavailable.");
  }
  const modes = new Set(
    results.length
      ? results.map((result) => result.dataMode)
      : responses.flatMap((response) =>
          "results" in response ? [response.provider.dataMode] : [],
        ),
  );
  const dataMode =
    modes.size > 1
      ? "mixed"
      : results[0]?.dataMode ?? providers[0].dataMode;
  return { results, dataMode, providerErrors };
}

function matchesFilters(
  option: TravelOption,
  filters: TravelSearchFilters,
): boolean {
  if (
    filters.maxBudget !== undefined &&
    (!option.price || option.price.amount > filters.maxBudget)
  ) {
    return false;
  }
  if (
    filters.accommodationType &&
    option.attributes.accommodationType !== filters.accommodationType
  ) {
    return false;
  }
  if (
    filters.minimumRating !== undefined &&
    (option.rating === null || option.rating < filters.minimumRating)
  ) {
    return false;
  }
  if (filters.amenities?.length) {
    const amenities = String(option.attributes.amenities ?? "")
      .split(",")
      .map((amenity) => amenity.trim().toLocaleLowerCase());
    if (
      !filters.amenities.every((amenity) =>
        amenities.includes(amenity.toLocaleLowerCase()),
      )
    ) {
      return false;
    }
  }
  if (
    filters.directOnly &&
    Number(option.attributes.stops ?? Number.POSITIVE_INFINITY) !== 0
  ) {
    return false;
  }
  if (
    filters.airline &&
    String(option.attributes.airline ?? "")
      .toLocaleLowerCase()
      .indexOf(filters.airline.toLocaleLowerCase()) === -1
  ) {
    return false;
  }
  if (
    filters.cabinClass &&
    option.attributes.cabinClass !== filters.cabinClass
  ) {
    return false;
  }
  if (
    filters.trainClass &&
    !String(option.attributes.classes ?? "")
      .toLocaleLowerCase()
      .includes(filters.trainClass.toLocaleLowerCase())
  ) {
    return false;
  }
  if (
    filters.placeType &&
    String(option.attributes.type ?? "")
      .toLocaleLowerCase()
      .indexOf(filters.placeType.toLocaleLowerCase()) === -1
  ) {
    return false;
  }
  if (filters.departurePeriod) {
    const departure = String(option.attributes.departure ?? "");
    const hour = Number(departure.slice(0, 2));
    const periods = {
      morning: hour >= 5 && hour < 12,
      afternoon: hour >= 12 && hour < 17,
      evening: hour >= 17 && hour < 21,
      night: hour < 5 || hour >= 21,
    };
    if (!periods[filters.departurePeriod]) {
      return false;
    }
  }
  return true;
}

export async function searchTravelOptions(
  userId: string,
  tripId: string,
  category: TravelCategory,
  filters: TravelSearchFilters,
): Promise<{
  results: TravelOption[];
  dataMode: "demo" | "live" | "mixed";
  providerErrors: Array<{ provider: string; message: string }>;
  message: string;
}> {
  const trip = await getOwnedTrip(userId, tripId);
  if (!trip) {
    throw new AppError(404, "Trip not found.");
  }
  const response = await searchRegisteredProviders(
    category,
    getTripSearchInput(trip),
    filters,
  );
  return {
    ...response,
    results: response.results.filter((option) =>
      matchesFilters(option, filters),
    ),
    message:
      response.dataMode === "demo"
        ? "Demo catalogue only: no provider is connected; prices are illustrative, availability is unknown, and booking is unavailable."
        : response.dataMode === "mixed"
          ? "Results include both live and demo sources. Check each option's source and conditions."
          : "Results are returned by registered travel providers. Review each option's source and conditions.",
  };
}

function toSavedSelection(
  category: TravelCategory,
  option: TravelOption,
): SavedTravelSelection {
  return {
    id: `${category}:${option.id}`,
    category,
    optionId: option.id,
    name: option.name,
    provider: option.provider,
    dataMode: option.dataMode,
    price: option.price,
    priceDisclosure: option.priceDisclosure,
    savedAt: new Date().toISOString(),
  };
}

function serializeSelection(
  selection: TripSelectionDocument,
): SavedTravelSelection {
  return {
    id: selection.id,
    category: selection.category,
    optionId: selection.optionId,
    name: selection.name,
    provider: selection.provider,
    dataMode: selection.dataMode,
    price: selection.price ?? null,
    priceDisclosure: selection.priceDisclosure,
    savedAt: new Date(selection.savedAt).toISOString(),
  };
}

export async function saveTravelSelection(
  userId: string,
  tripId: string,
  category: TravelCategory,
  optionId: string,
) {
  const trip = await getOwnedTrip(userId, tripId);
  if (!trip) {
    throw new AppError(404, "Trip not found.");
  }
  const option = await resolveRegisteredOption(
    category,
    optionId,
    getTripSearchInput(trip),
  );
  const selection = toSavedSelection(category, option);
  if (category !== "destinations") {
    trip.selections = trip.selections.filter(
      (saved) =>
        category === "flights" || category === "trains"
          ? saved.category !== "flights" && saved.category !== "trains"
          : saved.category !== category,
    );
  }

  if (!trip.selections.some((saved) => saved.id === selection.id)) {
    trip.selections.push({
      ...selection,
      savedAt: new Date(selection.savedAt),
    });
  }
  await trip.save();
  return trip.selections.map(serializeSelection);
}

async function resolveProviderOption(
  provider: TravelProvider,
  optionId: string,
  input: TravelSearchInput,
): Promise<TravelOption | undefined> {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      provider.resolveOption(optionId, input, controller.signal),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          controller.abort();
          reject(new ProviderTimeoutError());
        }, 5_000);
      }),
    ]);
  } catch (error) {
    if (error instanceof ProviderTimeoutError) {
      throw error;
    }
    throw new AppError(503, "Travel selection provider is unavailable.");
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

async function resolveRegisteredOption(
  category: TravelCategory,
  optionId: string,
  input: TravelSearchInput,
): Promise<TravelOption> {
  const providers = travelProviders[category];
  if (providers.length === 0) {
    throw new AppError(503, "No travel selection provider is configured.");
  }
  let providerFailure: AppError | undefined;
  for (const provider of providers) {
    try {
      const option = await resolveProviderOption(provider, optionId, input);
      if (option) {
        return option;
      }
    } catch (error) {
      providerFailure =
        error instanceof AppError
          ? error
          : new AppError(503, "Travel selection provider is unavailable.");
    }
  }
  if (providerFailure) {
    throw providerFailure;
  }
  throw new AppError(400, "That option is not available for this trip.");
}

export async function removeTravelSelection(
  userId: string,
  tripId: string,
  category: TravelCategory,
  optionId: string,
) {
  const trip = await getOwnedTrip(userId, tripId);
  if (!trip) {
    throw new AppError(404, "Trip not found.");
  }
  const selectionId = `${category}:${optionId}`;
  const originalCount = trip.selections.length;
  trip.selections = trip.selections.filter(
    (selection) => selection.id !== selectionId,
  );
  if (trip.selections.length === originalCount) {
    throw new AppError(404, "Saved selection not found.");
  }
  await trip.save();
  return trip.selections.map(serializeSelection);
}

function totalOptionAmount(
  option: TravelOption,
  travellerCount: number,
): number | undefined {
  if (
    !option.price ||
    !Number.isFinite(option.price.amount) ||
    option.price.amount < 0
  ) {
    return undefined;
  }
  const amount =
    option.price.scope === "per_person"
      ? option.price.amount * travellerCount
      : option.price.amount;
  return Number.isFinite(amount) ? amount : undefined;
}

export async function getTripRecommendations(
  userId: string,
  tripId: string,
): Promise<TripRecommendation[]> {
  const trip = await getOwnedTrip(userId, tripId);
  if (!trip) {
    throw new AppError(404, "Trip not found.");
  }
  const searchInput = getTripSearchInput(trip);
  const [hotelSearch, flightSearch, trainSearch] = await Promise.all([
    searchRegisteredProviders("hotels", searchInput, {}),
    searchRegisteredProviders("flights", searchInput, {}),
    searchRegisteredProviders("trains", searchInput, {}),
  ]);
  if (
    hotelSearch.providerErrors.length ||
    flightSearch.providerErrors.length ||
    trainSearch.providerErrors.length
  ) {
    throw new AppError(
      503,
      "Recommendations are unavailable because some providers did not respond.",
    );
  }
  const hotels = hotelSearch.results;
  const flights = flightSearch.results;
  const trains = trainSearch.results;
  const transportOptions = [...flights, ...trains];
  const travellerCount = trip.travellers.adults + trip.travellers.children;
  const combinations = hotels.flatMap((hotel) =>
    transportOptions.flatMap((transport) => {
      const options = [hotel, transport];
      const amounts = options.map((option) =>
        totalOptionAmount(option, travellerCount),
      );
      const pricedAmounts = amounts.filter(
        (amount): amount is number => amount !== undefined,
      );
      if (pricedAmounts.length !== options.length) {
        return [];
      }
      const amount = pricedAmounts.reduce((total, item) => total + item, 0);
      if (!Number.isFinite(amount)) {
        return [];
      }
      return {
        options,
        amount,
      };
    }),
  );
  if (combinations.length === 0) {
    return [];
  }
  const combinationKey = (combination: (typeof combinations)[number]) =>
    combination.options.map((option) => option.id).join(":");
  const byAmount = (
    first: (typeof combinations)[number],
    second: (typeof combinations)[number],
  ) =>
    first.amount - second.amount ||
    combinationKey(first).localeCompare(combinationKey(second));
  const withinBudget = combinations.filter(
    (combination) => combination.amount <= trip.budget.amount,
  );
  const ordered = [...combinations].sort(byAmount);
  const affordable = [...withinBudget].sort(byAmount);
  const budgetPick = ordered[0];
  const balancedCandidates = affordable.length ? affordable : ordered;
  const balancedTarget = trip.budget.amount * 0.7;
  const balancedPick = [...balancedCandidates].sort(
    (first, second) =>
      Math.abs(first.amount - balancedTarget) -
        Math.abs(second.amount - balancedTarget) ||
      byAmount(first, second),
  )[0];
  const premiumPick = affordable.length
    ? affordable[affordable.length - 1]
    : ordered[0];
  const picks = [
    {
      style: "budget_explorer" as const,
      title: "Budget Explorer",
      combination: budgetPick,
      reason:
        withinBudget.length > 0
          ? "Lowest known-price combination in the catalogue that fits the trip budget."
          : "Lowest known-price combination in the catalogue; it exceeds the trip budget.",
    },
    {
      style: "balanced_experience" as const,
      title: "Balanced Experience",
      combination: balancedPick,
      reason: withinBudget.length
        ? "Known-price combination closest to 70% of the trip budget; ratings, comfort, and convenience are not scored."
        : "Known-price combination closest to 70% of the trip budget; all priced combinations exceed the budget.",
    },
    {
      style: "premium_experience" as const,
      title: "Premium Experience",
      combination: premiumPick,
      reason: withinBudget.length
        ? "Highest known-price combination within the trip budget; no quality claim is made."
        : "Lowest known-price combination available because all combinations exceed the budget; no quality claim is made.",
    },
  ];
  const limitations = [
    "All options and amounts are illustrative demo data, not live provider offers.",
    "Combinations containing an option without a valid price are excluded from ranking rather than counted as zero.",
    "Transport samples are one-way and exclude any unpriced return journey.",
    "Per-person samples are multiplied by all travellers for illustration; child fares are not represented separately.",
    "Dates, taxes, fees, availability, ratings, activities, and local transport are not verified or included.",
  ];
  return picks.map(({ style, title, combination, reason }) => ({
    style,
    title,
    options: combination.options,
    knownSampleAmount: combination.amount,
    remainingBudgetBeforeUnpricedCosts: trip.budget.amount - combination.amount,
    withinBudgetForPricedItems: combination.amount <= trip.budget.amount,
    complete: false,
    explanation: reason,
    limitations,
  }));
}

export async function getTripSelections(
  userId: string,
  tripId: string,
): Promise<SavedTravelSelection[]> {
  const trip = await getOwnedTrip(userId, tripId);
  if (!trip) {
    throw new AppError(404, "Trip not found.");
  }
  return trip.selections.map(serializeSelection);
}
