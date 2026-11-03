import { Bookmark, CalendarDays, CheckCircle2, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "../../../components/common/EmptyState";
import { Card } from "../../../components/ui/Card";
import { DashboardLayout } from "../components/DashboardLayout";

const overview = [
  { label: "Total trips", icon: CalendarDays },
  { label: "Upcoming trips", icon: MapPin },
  { label: "Completed trips", icon: CheckCircle2 },
  { label: "Saved destinations", icon: Bookmark },
];

interface DashboardPageProps {
  preview?: boolean;
}

export default function DashboardPage({ preview = false }: DashboardPageProps) {
  return (
    <DashboardLayout preview={preview}>
      <div className="grid gap-8">
        <section aria-labelledby="overview-heading">
          <h2
            id="overview-heading"
            className="text-section-heading font-bold text-primary-dark"
          >
            Overview
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {overview.map(({ label, icon: Icon }) => (
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
                      No account data available
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section
          id="upcoming-trips"
          aria-labelledby="upcoming-trips-heading"
          className="scroll-mt-24"
        >
          <h2
            id="upcoming-trips-heading"
            className="text-section-heading font-bold text-primary-dark"
          >
            Upcoming Trips
          </h2>
          <EmptyState
            className="mt-4"
            title="No upcoming trips"
            description="Trips you create will be shown here. Trip creation is not connected yet."
            icon={<CalendarDays className="size-8" />}
            action={
              <Link
                to="/plan-trip"
                className="inline-flex min-h-11 items-center justify-center rounded-control bg-primary-dark px-4 text-small-label font-semibold text-surface transition-standard hover:bg-secondary-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-teal focus-visible:ring-offset-2"
              >
                Plan a Trip
              </Link>
            }
          />
        </section>

        <section
          id="recent-trips"
          aria-labelledby="recent-trips-heading"
          className="scroll-mt-24"
        >
          <h2
            id="recent-trips-heading"
            className="text-section-heading font-bold text-primary-dark"
          >
            Recent Trips
          </h2>
          <EmptyState
            className="mt-4"
            title="No recent trips"
            description="Completed and past trips will appear here when trip history is available."
            icon={<MapPin className="size-8" />}
          />
        </section>

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
            description="Save places you would like to visit once accounts and saved trips are available."
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
