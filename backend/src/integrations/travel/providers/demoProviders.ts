import type {
  TravelCategory,
  TravelOption,
  TravelProvider,
  TravelSearchFilters,
  TravelSearchInput,
} from "../contracts.js";
import { getDemoOption, getDemoOptions } from "./demoCatalog.js";

function createDemoProvider(category: TravelCategory): TravelProvider {
  return {
    id: `tripcraft-demo-${category}`,
    category,
    dataMode: "demo",
    async search(
      input: TravelSearchInput,
      _filters: TravelSearchFilters,
      _signal?: AbortSignal,
    ): Promise<TravelOption[]> {
      const options = getDemoOptions(category);
      return options
        .filter(
          (option) =>
            option.destination.toLocaleLowerCase() ===
            input.destination.trim().toLocaleLowerCase(),
        )
        .filter((option) => {
          if (category !== "flights" && category !== "trains") {
            return true;
          }
          return (
            option.attributes.origin?.toString().toLocaleLowerCase() ===
            input.origin.trim().toLocaleLowerCase()
          );
        })
        .map((option) => ({
          ...option,
          attributes:
            category === "hotels"
              ? { ...option.attributes, requestedRooms: _filters.rooms ?? 1 }
              : option.attributes,
          retrievedAt: new Date().toISOString(),
        }));
    },
    async resolveOption(
      optionId: string,
      input: TravelSearchInput,
      _signal?: AbortSignal,
    ): Promise<TravelOption | undefined> {
      const option = getDemoOption(category, optionId);
      if (
        !option ||
        option.destination.toLocaleLowerCase() !==
          input.destination.trim().toLocaleLowerCase() ||
        ((category === "flights" || category === "trains") &&
          option.attributes.origin?.toString().toLocaleLowerCase() !==
            input.origin.trim().toLocaleLowerCase())
      ) {
        return undefined;
      }
      return { ...option, retrievedAt: new Date().toISOString() };
    },
  };
}

export const demoProviders: Record<TravelCategory, TravelProvider> = {
  hotels: createDemoProvider("hotels"),
  flights: createDemoProvider("flights"),
  trains: createDemoProvider("trains"),
  destinations: createDemoProvider("destinations"),
};
