import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bookmark,
  CalendarDays,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { EmptyState } from "../../../components/common/EmptyState";
import { ErrorState } from "../../../components/common/ErrorState";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { Card } from "../../../components/ui/Card";
import { apiClient } from "../../../services/apiClient";
import { getApiErrorMessage } from "../../../services/apiError";
import { useAuth } from "../../auth/hooks/useAuth";
import { DashboardLayout } from "../components/DashboardLayout";
import { DashboardHeader } from "../components/DashboardHeader";

interface TripSummary {
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
    currency: string;
  };
  interests: string[];
  accommodation: string;
  tripStyle: string;
  status: string;
}

interface TripListResponse {
  success: true;
  data: {
    trips: TripSummary[];
    page: number;
    limit: number;
    total: number;
    summary: {
      upcoming: number;
      completed: number;
    };
  };
}

const overview = [
  { label: "Total trips", icon: CalendarDays },
  { label: "Upcoming trips", icon: MapPin },
  { label: "Completed trips", icon: CheckCircle2 },
  { label: "Saved destinations", icon: Bookmark },
];

interface DashboardPageProps {
  preview?: boolean;
  dashboardHref?: string;
}

function formatTripStyle(style: string): string {
  return style
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function TripCard({ trip }: { trip: TripSummary }) {
  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  });
  const budgetFormatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: trip.budget.currency,
    maximumFractionDigits: 0,
  });

  return (
    <Card padding="small">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-subheading font-semibold text-primary-text">
            {trip.title}
          </h3>
          <p className="mt-1 text-small-label text-secondary-text">
            {trip.origin} to {trip.destination}
          </p>
        </div>
        <span className="w-fit rounded-badge bg-mint-background px-2.5 py-1 text-caption font-semibold capitalize text-primary-dark">
          {trip.status}
        </span>
      </div>
      <dl className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
        <div>
          <dt className="text-caption text-secondary-text">Dates</dt>
          <dd className="mt-1 text-small-label text-primary-text">
            {dateFormatter.format(new Date(trip.departureDate))} –{" "}
            {dateFormatter.format(new Date(trip.returnDate))}
          </dd>
        </div>
        <div>
          <dt className="text-caption text-secondary-text">Total budget</dt>
          <dd className="mt-1 text-small-label text-primary-text">
            {budgetFormatter.format(trip.budget.amount)}
          </dd>
        </div>
        <div>
          <dt className="text-caption text-secondary-text">Trip style</dt>
          <dd className="mt-1 text-small-label text-primary-text">
            {formatTripStyle(trip.tripStyle)}
          </dd>
        </div>
      </dl>
    </Card>
  );
}

export default function DashboardPage({
  preview = false,
  dashboardHref,
}: DashboardPageProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState("");

  const tripsQuery = useQuery({
    queryKey: ["trips", user?.id],
    enabled: !preview,
    queryFn: async () => {
      const response =
        await apiClient.get<TripListResponse>("/trips");
      return response.data.data;
    },
  });

  const trips = preview ? [] : (tripsQuery.data?.trips ?? []);
  const today = new Date().toISOString().slice(0, 10);
  const upcomingTrips = trips.filter(
    (trip) =>
      trip.departureDate.slice(0, 10) >= today &&
      trip.status !== "completed" &&
      trip.status !== "cancelled",
  );
  const recentTrips = trips.filter(
    (trip) =>
      trip.departureDate.slice(0, 10) < today ||
      trip.status === "completed" ||
      trip.status === "cancelled",
  );

  async function handleLogout() {
    setLogoutError("");
    try {
      await logout();
      navigate("/", { replace: true });
    } catch (error) {
      setLogoutError(
        getApiErrorMessage(error, "Could not sign out. Please try again."),
      );
    }
  }

  function renderTripSection(
    title: string,
    id: string,
    sectionTrips: TripSummary[],
    emptyTitle: string,
    emptyDescription: string,
  ) {
    return (
      <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-24">
        <h2
          id={`${id}-heading`}
          className="text-section-heading font-bold text-primary-dark"
        >
          {title}
        </h2>
        {preview ? (
          <EmptyState
            className="mt-4"
            title={emptyTitle}
            description="Dashboard preview only. Account trips are not connected in this preview."
            icon={<CalendarDays className="size-8" />}
          />
        ) : tripsQuery.isLoading ? (
          <div className="mt-4 rounded-card border border-border bg-surface p-8 text-center">
            <LoadingSpinner label={`Loading ${title.toLowerCase()}`} />
          </div>
        ) : tripsQuery.isError ? (
          null
        ) : sectionTrips.length > 0 ? (
          <div className="mt-4 grid gap-3">
            {sectionTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-4"
            title={emptyTitle}
            description={emptyDescription}
            icon={<CalendarDays className="size-8" />}
            action={
              id === "upcoming-trips" ? (
                <Link
                  to="/plan-trip"
                  className="inline-flex min-h-11 items-center justify-center rounded-control bg-primary-dark px-4 text-small-label font-semibold text-surface transition-standard hover:bg-secondary-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-teal focus-visible:ring-offset-2"
                >
                  Plan a Trip
                </Link>
              ) : undefined
            }
          />
        )}
      </section>
    );
  }

  return (
    <DashboardLayout
      preview={preview}
      dashboardHref={preview ? dashboardHref : undefined}
    >
      <div className="grid gap-8">
        <DashboardHeader
          userName={preview ? undefined : user?.fullName}
          onLogout={
            !preview && user ? () => void handleLogout() : undefined
          }
        />
        {logoutError && (
          <ErrorState title="Could not sign out" description={logoutError} />
        )}
        {tripsQuery.isError && !preview && (
          <ErrorState
            title="Could not load dashboard data"
            description={getApiErrorMessage(
              tripsQuery.error,
              "Try loading your trips again.",
            )}
            onRetry={() => void tripsQuery.refetch()}
          />
        )}
        <section aria-labelledby="overview-heading">
          <h2
            id="overview-heading"
            className="text-section-heading font-bold text-primary-dark"
          >
            Overview
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {overview.map(({ label, icon: Icon }) => {
              const value = preview
                ? "Preview only"
                : tripsQuery.isLoading
                  ? "Loading"
                  : tripsQuery.isError
                    ? "Unavailable"
                    : label === "Total trips"
                      ? String(tripsQuery.data?.total ?? 0)
                      : label === "Upcoming trips"
                        ? String(tripsQuery.data?.summary.upcoming ?? 0)
                        : label === "Completed trips"
                          ? String(tripsQuery.data?.summary.completed ?? 0)
                          : "Not available";

              return (
                <Card key={label} padding="small">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-mint-background text-secondary-teal">
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <div>
                      <p className="text-small-label font-semibold text-primary-text">
                        {label}
                      </p>
                      <p className="mt-1 text-caption text-secondary-text">
                        {value}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {renderTripSection(
          "Upcoming Trips",
          "upcoming-trips",
          upcomingTrips,
          "No upcoming trips",
          "Trips you create will be shown here.",
        )}
        {renderTripSection(
          "Recent Trips",
          "recent-trips",
          recentTrips,
          "No recent trips",
          "Completed and past trips will appear here.",
        )}
        <section
          id="saved-trips"
          aria-labelledby="saved-trips-heading"
          className="scroll-mt-24"
        >
          <h2
            id="saved-trips-heading"
            className="text-section-heading font-bold text-primary-dark"
          >
            Saved Trips
          </h2>
          <EmptyState
            className="mt-4"
            title="No saved destinations"
            description={
              preview
                ? "Saved destinations are not available in the dashboard preview."
                : "Saved destinations are not available yet."
            }
            icon={<Bookmark className="size-8" />}
            action={
              <Link
                to="/#destinations"
                className="text-small-label font-semibold text-secondary-teal underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-teal"
              >
                Explore destinations
              </Link>
            }
          />
        </section>
      </div>
    </DashboardLayout>
  );
}
