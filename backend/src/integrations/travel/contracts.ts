export const travelCategories = [
  "hotels",
  "flights",
  "trains",
  "destinations",
] as const;

export type TravelCategory = (typeof travelCategories)[number];
export type TravelMode = "live" | "demo";

export interface TravelSearchInput {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  adults: number;
  children: number;
}

export interface TravelOption {
  id: string;
  category: TravelCategory;
  name: string;
  provider: string;
  dataMode: TravelMode;
  destination: string;
  price: {
    amount: number;
    currency: "INR";
    scope: "per_stay" | "per_person" | "per_journey";
    includesTaxes: boolean;
  } | null;
  priceDisclosure: string;
  availability: "unknown" | "available" | "unavailable" | "limited";
  rating: number | null;
  reviewCount: number | null;
  bookingUrl: string | null;
  retrievedAt: string;
  attributes: Record<string, string | number | boolean | null>;
}

export interface TravelProvider {
  readonly id: string;
  readonly category: TravelCategory;
  readonly dataMode: TravelMode;
  search(
    input: TravelSearchInput,
    filters: TravelSearchFilters,
    signal?: AbortSignal,
  ): Promise<TravelOption[]>;
  resolveOption(
    optionId: string,
    input: TravelSearchInput,
    signal?: AbortSignal,
  ): Promise<TravelOption | undefined>;
}

export interface SavedTravelSelection {
  id: string;
  category: TravelCategory;
  optionId: string;
  name: string;
  provider: string;
  dataMode: TravelMode;
  price: TravelOption["price"];
  priceDisclosure: string;
  savedAt: string;
}

export interface TravelSearchFilters {
  maxBudget?: number;
  minimumRating?: number;
  rooms?: number;
  accommodationType?: string;
  amenities?: string[];
  directOnly?: boolean;
  airline?: string;
  cabinClass?: "economy" | "premium_economy" | "business" | "first";
  departurePeriod?: "morning" | "afternoon" | "evening" | "night";
  trainClass?: string;
  placeType?: string;
}
