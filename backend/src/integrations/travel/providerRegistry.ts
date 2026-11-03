import type { TravelCategory, TravelProvider } from "./contracts.js";
import { demoProviders } from "./providers/demoProviders.js";

export const travelProviders: Record<
  TravelCategory,
  readonly TravelProvider[]
> = {
  hotels: [demoProviders.hotels],
  flights: [demoProviders.flights],
  trains: [demoProviders.trains],
  destinations: [demoProviders.destinations],
};
