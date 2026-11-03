import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bookmark,
  CalendarDays,
  Clock3,
  MapPin,
  Search,
  Trash2,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { EmptyState } from "../../../components/common/EmptyState";
import { ErrorState } from "../../../components/common/ErrorState";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { apiClient } from "../../../services/apiClient";
import { getApiErrorMessage } from "../../../services/apiError";
import { DashboardLayout } from "../../dashboard/components/DashboardLayout";

type Category = "hotels" | "flights" | "trains" | "destinations";
type Tab = "overview" | Category | "selections";

interface TravelOption {
  id: string;
  category: Category;
  name: string;
  provider: string;
  dataMode: "demo" | "live";
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

interface Selection {
  id: string;
  category: Category;
  optionId: string;
  name: string;
  provider: string;
  dataMode: "demo" | "live";
  price: TravelOption["price"];
  priceDisclosure: string;
  savedAt: string;
}

interface Trip {
  id: string;
  title: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  travellers: { adults: number; children: number };
  budget: { amount: number; currency: "INR" };
  interests: string[];
  accommodation: string;
  tripStyle: string;
  status: string;
  selections: Selection[];
}

interface Recommendation {
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

interface ApiResponse<T> {
  success: true;
  data: T;
}

const tabs: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "hotels", label: "Hotels" },
  { id: "flights", label: "Flights" },
  { id: "trains", label: "Trains" },
  { id: "destinations", label: "Destinations" },
  { id: "selections", label: "My selections" },
];

const categoryLabels: Record<Category, string> = {
  hotels: "Hotel",
  flights: "Flight",
  trains: "Train",
  destinations: "Place",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function displayDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function selectionAmount(selection: Selection, travellerCount: number): number {
  if (!selection.price) {
    return 0;
  }
  return selection.price.scope === "per_person"
    ? selection.price.amount * travellerCount
    : selection.price.amount;
}

function optionAmount(option: TravelOption, travellerCount: number): number {
  if (!option.price) {
    return 0;
  }
  return option.price.scope === "per_person"
    ? option.price.amount * travellerCount
    : option.price.amount;
}

export default function TripWorkspacePage() {
  const { tripId } = useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [sortBy, setSortBy] = useState<"price" | "duration">("price");
  const [hotelBudget, setHotelBudget] = useState("");
  const [rooms, setRooms] = useState("1");
  const [hotelType, setHotelType] = useState("");
  const [hotelAmenity, setHotelAmenity] = useState("");
  const [minimumRating, setMinimumRating] = useState("");
  const [flightBudget, setFlightBudget] = useState("");
  const [airline, setAirline] = useState("");
  const [cabinClass, setCabinClass] = useState("economy");
  const [flightDeparturePeriod, setFlightDeparturePeriod] = useState("");
  const [directOnly, setDirectOnly] = useState(false);
  const [trainBudget, setTrainBudget] = useState("");
  const [trainClass, setTrainClass] = useState("");
  const [trainDeparturePeriod, setTrainDeparturePeriod] = useState("");
  const [placeType, setPlaceType] = useState("");
  const [notice, setNotice] = useState("");

  const tripQuery = useQuery({
    queryKey: ["trip", tripId],
    enabled: Boolean(tripId),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<{ trip: Trip }>>(
        `/trips/${tripId}`,
      );
      return response.data.data.trip;
    },
  });
  const recommendationQuery = useQuery({
    queryKey: ["recommendations", tripId],
    enabled: Boolean(tripId) && activeTab === "overview",
    queryFn: async () => {
      const response = await apiClient.get<
        ApiResponse<{ recommendations: Recommendation[] }>
      >(`/trips/${tripId}/recommendations`);
      return response.data.data.recommendations;
    },
  });
  const searchMutation = useMutation({
    mutationFn: async ({
      category,
      filters,
    }: {
      category: Category;
      filters: Record<string, unknown>;
    }) => {
      const response = await apiClient.post<
        ApiResponse<{
          results: TravelOption[];
          dataMode: "demo" | "live" | "mixed";
          providerErrors: Array<{ provider: string; message: string }>;
          message: string;
        }>
      >(`/trips/${tripId}/search/${category}`, filters);
      return { ...response.data.data, category };
    },
  });
  const selectionMutation = useMutation({
    mutationFn: async ({
      category,
      optionId,
    }: {
      category: Category;
      optionId: string;
    }) => {
      await apiClient.post(`/trips/${tripId}/selections`, {
        category,
        optionId,
      });
    },
    onSuccess: async () => {
      setNotice("Selection saved. A flight and train are alternatives.");
      await queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
    },
  });
  const removeMutation = useMutation({
    mutationFn: async ({
      category,
      optionId,
    }: {
      category: Category;
      optionId: string;
    }) => {
      await apiClient.delete(
        `/trips/${tripId}/selections/${category}/${optionId}`,
      );
    },
    onSuccess: async () => {
      setNotice("Selection removed.");
      await queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
    },
  });

  const trip = tripQuery.data;
  const activeCategory =
    activeTab === "hotels" ||
    activeTab === "flights" ||
    activeTab === "trains" ||
    activeTab === "destinations"
      ? activeTab
      : undefined;
  const sortedResults = useMemo(() => {
    if (
      !activeCategory ||
      searchMutation.data === undefined ||
      searchMutation.data.category !== activeCategory
    ) {
      return [];
    }
    return [...searchMutation.data.results].sort((first, second) => {
      if (sortBy === "duration") {
        const firstDuration = Number(
          first.attributes.durationMinutes ?? Number.MAX_SAFE_INTEGER,
        );
        const secondDuration = Number(
          second.attributes.durationMinutes ?? Number.MAX_SAFE_INTEGER,
        );
        return firstDuration - secondDuration;
      }
      return (
        optionAmount(
          first,
          (trip?.travellers.adults ?? 1) + (trip?.travellers.children ?? 0),
        ) -
        optionAmount(
          second,
          (trip?.travellers.adults ?? 1) + (trip?.travellers.children ?? 0),
        )
      );
    });
  }, [
    activeCategory,
    searchMutation.data,
    sortBy,
    trip?.travellers.adults,
    trip?.travellers.children,
  ]);

  function search(category: Category, filters: Record<string, unknown>) {
    setNotice("");
    searchMutation.reset();
    searchMutation.mutate({ category, filters });
  }

  async function saveRecommendation(recommendation: Recommendation) {
    setNotice("");
    try {
      for (const option of recommendation.options) {
        await selectionMutation.mutateAsync({
          category: option.category,
          optionId: option.id,
        });
      }
      setNotice(
        `${recommendation.title} sample selections saved. Flight/train choices replace one another.`,
      );
    } catch (error) {
      setNotice(
        getApiErrorMessage(error, "Could not save this sample selection."),
      );
    }
  }

  if (tripQuery.isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-64 items-center justify-center">
          <LoadingSpinner label="Loading trip workspace" />
        </div>
      </DashboardLayout>
    );
  }
  if (tripQuery.isError || !trip) {
    return (
      <DashboardLayout>
        <ErrorState
          title="Trip workspace unavailable"
          description={getApiErrorMessage(
            tripQuery.error,
            "This trip could not be loaded.",
          )}
          onRetry={() => void tripQuery.refetch()}
        />
      </DashboardLayout>
    );
  }

  const travellerCount = trip.travellers.adults + trip.travellers.children;
  const pricedSelections = trip.selections.filter((selection) =>
    Boolean(selection.price),
  );
  const knownSampleAmount = pricedSelections.reduce(
    (total, selection) => total + selectionAmount(selection, travellerCount),
    0,
  );
  const estimatedRemaining = trip.budget.amount - knownSampleAmount;

  return (
    <DashboardLayout>
      <div className="grid gap-6">
        <Link
          to="/dashboard"
          className="inline-flex w-fit items-center gap-2 rounded-control text-small-label font-semibold text-secondary-teal hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-teal"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to dashboard
        </Link>
        <header className="grid gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-caption font-semibold uppercase tracking-wide text-secondary-teal">
                Trip planning workspace
              </p>
              <h1 className="mt-1 text-page-heading font-bold text-primary-dark">
                {trip.title}
              </h1>
              <p className="mt-2 flex items-center gap-2 text-body text-secondary-text">
                <MapPin aria-hidden="true" className="size-4 shrink-0" />
                {trip.origin} to {trip.destination}
              </p>
            </div>
            <Badge variant="warning">Demo search only</Badge>
          </div>
          <p className="rounded-control border border-warning/40 bg-warning/10 px-4 py-3 text-small-label text-warning-text">
            No live provider is connected. Sample results, prices, and
            recommendations are illustrative only; availability, dates, taxes,
            ratings, and booking are not verified.
          </p>
        </header>

        <nav
          aria-label="Trip workspace sections"
          className="flex gap-2 overflow-x-auto border-b border-border pb-2"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-current={activeTab === tab.id ? "page" : undefined}
              className={[
                "min-h-11 shrink-0 rounded-control px-3 text-small-label font-semibold transition-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-teal",
                activeTab === tab.id
                  ? "bg-primary-dark text-surface"
                  : "text-secondary-text hover:bg-mint-background hover:text-primary-dark",
              ].join(" ")}
              onClick={() => {
                setActiveTab(tab.id);
                setNotice("");
                setSortBy("price");
                searchMutation.reset();
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {notice && (
          <p
            role="status"
            className="rounded-control border border-border bg-surface px-4 py-3 text-small-label text-primary-text"
          >
            {notice}
          </p>
        )}
        {searchMutation.isError && (
          <ErrorState
            title="Search could not be completed"
            description={getApiErrorMessage(
              searchMutation.error,
              "Please retry the search.",
            )}
          />
        )}
        {(selectionMutation.isError || removeMutation.isError) && (
          <ErrorState
            title="Could not update selections"
            description={getApiErrorMessage(
              selectionMutation.error ?? removeMutation.error,
              "Please try again.",
            )}
          />
        )}

        {activeTab === "overview" && (
          <div className="grid gap-6">
            <section aria-labelledby="trip-overview-title">
              <h2
                id="trip-overview-title"
                className="text-section-heading font-bold text-primary-dark"
              >
                Overview
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Card padding="small">
                  <p className="text-caption text-secondary-text">Dates</p>
                  <p className="mt-1 inline-flex items-center gap-2 text-small-label font-semibold text-primary-text">
                    <CalendarDays aria-hidden="true" className="size-4" />
                    {displayDate(trip.departureDate)} –{" "}
                    {displayDate(trip.returnDate)}
                  </p>
                </Card>
                <Card padding="small">
                  <p className="text-caption text-secondary-text">Travellers</p>
                  <p className="mt-1 text-small-label font-semibold text-primary-text">
                    {trip.travellers.adults} adults
                    {trip.travellers.children > 0 &&
                      `, ${trip.travellers.children} children`}
                  </p>
                </Card>
                <Card padding="small">
                  <p className="text-caption text-secondary-text">
                    Total trip budget
                  </p>
                  <p className="mt-1 text-small-label font-semibold text-primary-text">
                    {formatCurrency(trip.budget.amount)}
                  </p>
                </Card>
                <Card padding="small">
                  <p className="text-caption text-secondary-text">
                    Preferences
                  </p>
                  <p className="mt-1 text-small-label font-semibold capitalize text-primary-text">
                    {trip.interests.length
                      ? trip.interests.join(", ")
                      : "None added"}
                  </p>
                </Card>
              </div>
            </section>

            <section aria-labelledby="cost-overview-title">
              <h2
                id="cost-overview-title"
                className="text-section-heading font-bold text-primary-dark"
              >
                Budget snapshot
              </h2>
              <Card className="mt-4">
                <dl className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <dt className="text-caption text-secondary-text">
                      Known saved demo amounts
                    </dt>
                    <dd className="mt-1 font-semibold text-primary-text">
                      {formatCurrency(knownSampleAmount)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-caption text-secondary-text">
                      Budget remaining before unpriced costs
                    </dt>
                    <dd className="mt-1 font-semibold text-primary-text">
                      {formatCurrency(estimatedRemaining)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-caption text-secondary-text">
                      Saved selections
                    </dt>
                    <dd className="mt-1 font-semibold text-primary-text">
                      {trip.selections.length}
                    </dd>
                  </div>
                </dl>
                <p className="mt-4 border-t border-border pt-4 text-caption text-secondary-text">
                  Partial demo calculation only. It excludes unpriced return
                  transport, taxes and fees, activities, and local transport.
                </p>
              </Card>
            </section>

            <section aria-labelledby="recommendations-title">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2
                    id="recommendations-title"
                    className="text-section-heading font-bold text-primary-dark"
                  >
                    Sample combinations
                  </h2>
                  <p className="mt-1 text-small-label text-secondary-text">
                    Deterministic price-only examples from the demo catalogue.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => void recommendationQuery.refetch()}
                >
                  Refresh examples
                </Button>
              </div>
              {recommendationQuery.isLoading ? (
                <div className="mt-4 flex justify-center py-8">
                  <LoadingSpinner label="Loading sample combinations" />
                </div>
              ) : recommendationQuery.isError ? (
                <ErrorState
                  className="mt-4"
                  title="Could not load sample combinations"
                  description={getApiErrorMessage(
                    recommendationQuery.error,
                    "Try again.",
                  )}
                  onRetry={() => void recommendationQuery.refetch()}
                />
              ) : recommendationQuery.data?.length ? (
                <div className="mt-4 grid gap-4">
                  {recommendationQuery.data.map((recommendation) => (
                    <Card
                      key={recommendation.style}
                      padding="small"
                      header={
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h3 className="font-semibold text-primary-dark">
                            {recommendation.title}
                          </h3>
                          <Badge variant="information">Demo combination</Badge>
                        </div>
                      }
                      footer={
                        <Button
                          size="small"
                          loading={selectionMutation.isPending}
                          onClick={() =>
                            void saveRecommendation(recommendation)
                          }
                        >
                          Save this combination
                        </Button>
                      }
                    >
                      <p className="text-small-label text-primary-text">
                        {recommendation.options
                          .map((option) => option.name)
                          .join(" + ")}
                      </p>
                      <p className="mt-2 text-caption text-secondary-text">
                        Known sample amount:{" "}
                        {formatCurrency(recommendation.knownSampleAmount)} ·
                        Remaining before unpriced costs:{" "}
                        {formatCurrency(
                          recommendation.remainingBudgetBeforeUnpricedCosts,
                        )}
                      </p>
                      <p className="mt-2 text-caption text-secondary-text">
                        {recommendation.explanation}
                      </p>
                      {!recommendation.withinBudgetForPricedItems && (
                        <p className="mt-2 text-small-label font-semibold text-error-text">
                          Exceeds the trip budget for the priced demo items.
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  className="mt-4"
                  title="No sample combinations for this route"
                  description="The demo catalogue has no matching sample options. Live search is not connected."
                />
              )}
            </section>
          </div>
        )}

        {activeCategory && (
          <section aria-labelledby="search-section-title" className="grid gap-5">
            <div>
              <h2
                id="search-section-title"
                className="text-section-heading font-bold capitalize text-primary-dark"
              >
                {activeCategory}
              </h2>
              <p className="mt-1 text-small-label text-secondary-text">
                Search is limited to clearly marked sample data for{" "}
                {trip.destination}.
              </p>
            </div>
            <Card>
              <form
                className="grid gap-4 sm:grid-cols-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (activeCategory === "hotels") {
                    void search(activeCategory, {
                      rooms: Number(rooms),
                      ...(hotelBudget
                        ? { maxBudget: Number(hotelBudget) }
                        : {}),
                      ...(hotelType
                        ? { accommodationType: hotelType }
                        : {}),
                      ...(minimumRating
                        ? { minimumRating: Number(minimumRating) }
                        : {}),
                      ...(hotelAmenity
                        ? { amenities: [hotelAmenity] }
                        : {}),
                    });
                  } else if (activeCategory === "flights") {
                    void search(activeCategory, {
                      ...(flightBudget
                        ? { maxBudget: Number(flightBudget) }
                        : {}),
                      ...(airline ? { airline } : {}),
                      cabinClass,
                      ...(flightDeparturePeriod
                        ? { departurePeriod: flightDeparturePeriod }
                        : {}),
                      directOnly,
                    });
                  } else if (activeCategory === "trains") {
                    void search(activeCategory, {
                      ...(trainBudget
                        ? { maxBudget: Number(trainBudget) }
                        : {}),
                      ...(trainClass ? { trainClass } : {}),
                      ...(trainDeparturePeriod
                        ? { departurePeriod: trainDeparturePeriod }
                        : {}),
                    });
                  } else {
                    void search(activeCategory, {
                      ...(placeType ? { placeType } : {}),
                    });
                  }
                }}
              >
                {activeCategory === "hotels" && (
                  <>
                    <Input
                      label="Rooms"
                      type="number"
                      min="1"
                      max="10"
                      step="1"
                      value={rooms}
                      onChange={(event) => setRooms(event.target.value)}
                    />
                    <Input
                      label="Maximum sample stay amount (INR)"
                      type="number"
                      min="1"
                      value={hotelBudget}
                      onChange={(event) => setHotelBudget(event.target.value)}
                    />
                    <label className="grid gap-2 text-small-label font-semibold text-primary-text">
                      Accommodation type
                      <select
                        className="min-h-11 rounded-control border border-border bg-surface px-3"
                        value={hotelType}
                        onChange={(event) => setHotelType(event.target.value)}
                      >
                        <option value="">All types</option>
                        {["budget", "standard", "premium", "luxury"].map(
                          (type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ),
                        )}
                      </select>
                    </label>
                    <Input
                      label="Required amenity"
                      placeholder="e.g. Wi-Fi"
                      value={hotelAmenity}
                      onChange={(event) =>
                        setHotelAmenity(event.target.value)
                      }
                    />
                    <Input
                      label="Minimum rating"
                      type="number"
                      min="0"
                      max="5"
                      step="0.5"
                      value={minimumRating}
                      helperText="Demo listings have no verified ratings; applying this filter returns no matches."
                      onChange={(event) =>
                        setMinimumRating(event.target.value)
                      }
                    />
                  </>
                )}
                {activeCategory === "flights" && (
                  <>
                    <Input
                      label="Maximum sample fare (INR per traveller)"
                      type="number"
                      min="1"
                      value={flightBudget}
                      onChange={(event) => setFlightBudget(event.target.value)}
                    />
                    <Input
                      label="Airline"
                      placeholder="Filter airline"
                      value={airline}
                      onChange={(event) => setAirline(event.target.value)}
                    />
                    <label className="grid gap-2 text-small-label font-semibold text-primary-text">
                      Cabin class
                      <select
                        className="min-h-11 rounded-control border border-border bg-surface px-3"
                        value={cabinClass}
                        onChange={(event) => setCabinClass(event.target.value)}
                      >
                        <option value="economy">Economy</option>
                        <option value="premium_economy">Premium economy</option>
                        <option value="business">Business</option>
                        <option value="first">First</option>
                      </select>
                    </label>
                    <label className="grid gap-2 text-small-label font-semibold text-primary-text">
                      Departure time
                      <select
                        className="min-h-11 rounded-control border border-border bg-surface px-3"
                        value={flightDeparturePeriod}
                        onChange={(event) =>
                          setFlightDeparturePeriod(event.target.value)
                        }
                      >
                        <option value="">Any time</option>
                        {["morning", "afternoon", "evening", "night"].map(
                          (period) => (
                            <option key={period} value={period}>
                              {period}
                            </option>
                          ),
                        )}
                      </select>
                    </label>
                    <label className="flex min-h-11 items-center gap-3 text-small-label font-semibold text-primary-text">
                      <input
                        type="checkbox"
                        checked={directOnly}
                        onChange={(event) =>
                          setDirectOnly(event.target.checked)
                        }
                        className="size-4 accent-primary-teal"
                      />
                      Direct only
                    </label>
                  </>
                )}
                {activeCategory === "trains" && (
                  <>
                    <Input
                      label="Maximum sample fare (INR per traveller)"
                      type="number"
                      min="1"
                      value={trainBudget}
                      onChange={(event) => setTrainBudget(event.target.value)}
                    />
                    <Input
                      label="Class contains"
                      placeholder="e.g. sleeper"
                      value={trainClass}
                      onChange={(event) => setTrainClass(event.target.value)}
                    />
                    <label className="grid gap-2 text-small-label font-semibold text-primary-text">
                      Departure time
                      <select
                        className="min-h-11 rounded-control border border-border bg-surface px-3"
                        value={trainDeparturePeriod}
                        onChange={(event) =>
                          setTrainDeparturePeriod(event.target.value)
                        }
                      >
                        <option value="">Any time</option>
                        {["morning", "afternoon", "evening", "night"].map(
                          (period) => (
                            <option key={period} value={period}>
                              {period}
                            </option>
                          ),
                        )}
                      </select>
                    </label>
                  </>
                )}
                {activeCategory === "destinations" && (
                  <Input
                    label="Place type"
                    placeholder="e.g. attraction"
                    value={placeType}
                    onChange={(event) => setPlaceType(event.target.value)}
                  />
                )}
                <div className="flex items-end">
                  <Button
                    type="submit"
                    loading={searchMutation.isPending}
                    leftIcon={<Search className="size-4" />}
                  >
                    Search demo catalogue
                  </Button>
                </div>
              </form>
            </Card>

            {searchMutation.isPending && (
              <div className="flex justify-center py-8">
                <LoadingSpinner label={`Searching sample ${activeCategory}`} />
              </div>
            )}
            {searchMutation.data &&
              searchMutation.data.category === activeCategory &&
              !searchMutation.isPending && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-small-label text-secondary-text">
                    {searchMutation.data.message}{" "}
                    {sortedResults.length}{" "}
                    {searchMutation.data.dataMode === "demo"
                      ? "sample result(s)."
                      : "result(s)."}
                  </p>
                  <label className="flex items-center gap-2 text-caption font-semibold text-primary-text">
                    Sort
                    <select
                      className="min-h-10 rounded-control border border-border bg-surface px-2"
                      value={sortBy}
                      onChange={(event) =>
                        setSortBy(event.target.value as "price" | "duration")
                      }
                    >
                      <option value="price">
                        {searchMutation.data.dataMode === "demo"
                          ? "Lowest sample amount"
                          : "Lowest amount"}
                      </option>
                      {(activeCategory === "flights" ||
                        activeCategory === "trains") && (
                        <option value="duration">Shortest sample duration</option>
                      )}
                    </select>
                  </label>
                </div>
                {searchMutation.data.providerErrors.length > 0 && (
                  <div
                    role="status"
                    className="rounded-control border border-warning/40 bg-warning/10 px-4 py-3 text-small-label text-warning-text"
                  >
                    Some providers did not respond:{" "}
                    {searchMutation.data.providerErrors
                      .map(({ provider }) => provider)
                      .join(", ")}
                    . Results may be incomplete.
                  </div>
                )}
                {sortedResults.length ? (
                  <div className="grid gap-3">
                    {sortedResults.map((option) => (
                      <Card
                        key={option.id}
                        padding="small"
                        header={
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <h3 className="font-semibold text-primary-dark">
                                {option.name}
                              </h3>
                              <p className="mt-1 text-caption text-secondary-text">
                                {option.provider}
                              </p>
                            </div>
                            <Badge
                              variant={
                                option.dataMode === "demo"
                                  ? "warning"
                                  : "success"
                              }
                            >
                              {option.dataMode === "demo"
                                ? "Demo · not live"
                                : "Live source"}
                            </Badge>
                          </div>
                        }
                        footer={
                          <Button
                            size="small"
                            variant="outline"
                            loading={selectionMutation.isPending}
                            leftIcon={<Bookmark className="size-4" />}
                            onClick={() =>
                              selectionMutation.mutate({
                                category: option.category,
                                optionId: option.id,
                              })
                            }
                          >
                            Save selection
                          </Button>
                        }
                      >
                        <div className="grid gap-3 text-small-label sm:grid-cols-2">
                          <p>
                            <span className="font-semibold">
                              {option.dataMode === "demo"
                                ? "Sample amount:"
                                : "Listed amount:"}{" "}
                            </span>
                            {option.price
                              ? `${formatCurrency(option.price.amount)}${
                                  option.price.scope === "per_person"
                                    ? " per traveller, one way"
                                    : option.price.scope === "per_stay"
                                      ? " per stay"
                                      : " per journey"
                                }`
                              : "Not provided"}
                          </p>
                          <p>
                            <span className="font-semibold">Availability:</span>{" "}
                            {option.availability}
                          </p>
                          <p>
                            <span className="font-semibold">Taxes:</span>{" "}
                            {option.price
                              ? option.price.includesTaxes
                                ? "Included in the listed amount"
                                : "Not included in the listed amount"
                              : "Unknown"}
                          </p>
                          {activeCategory === "hotels" && (
                            <>
                              <p>
                                <span className="font-semibold">Room:</span>{" "}
                                {String(option.attributes.roomType)}
                              </p>
                              <p>
                                <span className="font-semibold">Amenities:</span>{" "}
                                {String(option.attributes.amenities)}
                              </p>
                              <p>
                                <span className="font-semibold">Breakfast:</span>{" "}
                                {option.attributes.breakfast ? "Sample yes" : "Unknown"}
                              </p>
                              <p>
                                <span className="font-semibold">Rooms requested:</span>{" "}
                                {String(option.attributes.requestedRooms)}
                              </p>
                              <p>
                                <span className="font-semibold">Cancellation:</span>{" "}
                                {String(option.attributes.cancellation)}
                              </p>
                              <p>
                                <span className="font-semibold">Rating:</span>{" "}
                                Not supplied
                              </p>
                            </>
                          )}
                          {(activeCategory === "flights" ||
                            activeCategory === "trains") && (
                            <>
                              <p>
                                <span className="font-semibold">Departure:</span>{" "}
                                {String(option.attributes.departure)}
                              </p>
                              <p>
                                <span className="font-semibold">Route:</span>{" "}
                                {String(
                                  activeCategory === "flights"
                                    ? option.attributes.departureAirport
                                    : option.attributes.departureStation,
                                )}{" "}
                                to{" "}
                                {String(
                                  activeCategory === "flights"
                                    ? option.attributes.arrivalAirport
                                    : option.attributes.arrivalStation,
                                )}
                              </p>
                              <p>
                                <span className="font-semibold">Arrival:</span>{" "}
                                {String(
                                  activeCategory === "flights"
                                    ? option.attributes.arrivalTime
                                    : option.attributes.arrival,
                                )}
                              </p>
                              <p>
                                <span className="font-semibold">Duration:</span>{" "}
                                <span className="inline-flex items-center gap-1">
                                  <Clock3 aria-hidden="true" className="size-3" />
                                  {Math.floor(
                                    Number(option.attributes.durationMinutes) /
                                      60,
                                  )}
                                  h{" "}
                                  {Number(option.attributes.durationMinutes) %
                                    60}
                                  m
                                </span>
                              </p>
                              {activeCategory === "flights" && (
                                <>
                                  <p>
                                    <span className="font-semibold">Cabin:</span>{" "}
                                    {String(option.attributes.cabinClass)}
                                  </p>
                                  <p>
                                    <span className="font-semibold">Stops:</span>{" "}
                                    {String(option.attributes.stops)}
                                  </p>
                                  <p>
                                    <span className="font-semibold">Baggage:</span>{" "}
                                    {String(option.attributes.baggage)}
                                  </p>
                                  <p>
                                    <span className="font-semibold">Fare conditions:</span>{" "}
                                    {String(option.attributes.fareConditions)}
                                  </p>
                                </>
                              )}
                              {activeCategory === "trains" && (
                                <p>
                                  <span className="font-semibold">Classes:</span>{" "}
                                  {String(option.attributes.classes)}
                                </p>
                              )}
                            </>
                          )}
                          {activeCategory === "destinations" && (
                            <p>
                              {String(option.attributes.description)}
                            </p>
                          )}
                        </div>
                        <p className="mt-3 text-caption text-warning-text">
                          {option.priceDisclosure}
                        </p>
                        <p className="mt-1 text-caption text-secondary-text">
                          {option.dataMode === "demo"
                            ? "Demo generated at "
                            : "Retrieved at "}
                          {new Date(option.retrievedAt).toLocaleString()}.
                          {option.dataMode === "demo" &&
                            " This is not a provider freshness timestamp."}
                        </p>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title={
                      searchMutation.data.dataMode === "demo"
                        ? "No matching demo results"
                        : "No matching results"
                    }
                    description={
                      searchMutation.data.dataMode === "demo"
                        ? "No sample options match this route and filter. Live provider search is not connected."
                        : "No provider options match this route and filter."
                    }
                  />
                )}
              </>
            )}
          </section>
        )}

        {activeTab === "selections" && (
          <section className="grid gap-4" aria-labelledby="selections-heading">
            <div>
              <h2
                id="selections-heading"
                className="text-section-heading font-bold text-primary-dark"
              >
                My selections
              </h2>
              <p className="mt-1 text-small-label text-secondary-text">
                Flights and trains are alternatives; saving one replaces the
                other.
              </p>
            </div>
            {trip.selections.length ? (
              <>
                <div className="grid gap-3">
                  {trip.selections.map((selection) => (
                    <Card
                      key={selection.id}
                      padding="small"
                      className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="information">
                            {categoryLabels[selection.category]}
                          </Badge>
                          <Badge
                            variant={
                              selection.dataMode === "demo"
                                ? "warning"
                                : "success"
                            }
                          >
                            {selection.dataMode === "demo"
                              ? "Demo · not live"
                              : "Live source"}
                          </Badge>
                        </div>
                        <h3 className="mt-2 font-semibold text-primary-dark">
                          {selection.name}
                        </h3>
                        <p className="mt-1 text-caption text-secondary-text">
                          {selection.provider}
                          {selection.price &&
                            ` · ${formatCurrency(
                              selectionAmount(selection, travellerCount),
                            )} known sample amount`}
                        </p>
                        <p className="mt-1 text-caption text-warning-text">
                          {selection.priceDisclosure}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="small"
                        loading={removeMutation.isPending}
                        leftIcon={<Trash2 className="size-4" />}
                        onClick={() =>
                          removeMutation.mutate({
                            category: selection.category,
                            optionId: selection.optionId,
                          })
                        }
                      >
                        Remove
                      </Button>
                    </Card>
                  ))}
                </div>
                <Card>
                  <p className="font-semibold text-primary-dark">
                    Known saved demo amounts:{" "}
                    {formatCurrency(knownSampleAmount)}
                  </p>
                  <p className="mt-2 text-small-label text-secondary-text">
                    Remaining budget before unknown costs:{" "}
                    {formatCurrency(estimatedRemaining)}. This is not a complete
                    trip estimate or payable total.
                  </p>
                </Card>
              </>
            ) : (
              <EmptyState
                title="No saved options yet"
                description="Search the demo catalogue and save a hotel, one transport option, or places to build this trip workspace."
              />
            )}
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
