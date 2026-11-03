import { Bell, CircleUserRound, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../../components/ui/Button";

interface DashboardHeaderProps {
  userName?: string;
  onLogout?: () => void;
}

export function DashboardHeader({
  userName,
  onLogout,
}: DashboardHeaderProps) {
  return (
    <section
      className="flex flex-col gap-5 rounded-card border border-border bg-surface p-5 shadow-subtle sm:flex-row sm:items-center sm:justify-between tablet:p-6"
      aria-labelledby="dashboard-welcome"
    >
      <div>
        <p className="text-small-label font-semibold uppercase tracking-wide text-secondary-teal">
          Your travel space
        </p>
        <h1
          id="dashboard-welcome"
          className="mt-1 text-page-heading font-bold text-primary-dark"
        >
          {userName ? `Welcome, ${userName}` : "Welcome to TripCraft"}
        </h1>
        <p className="mt-2 text-body text-secondary-text">
          {userName
            ? "Here is an overview of your saved travel plans."
            : "Your trips and saved places will appear here when an account is connected."}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled
          aria-label="Notifications (coming soon)"
          className="inline-flex size-11 items-center justify-center rounded-control border border-border text-secondary-text disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Bell aria-hidden="true" className="size-5" />
        </button>
        <div className="flex min-h-11 items-center gap-2 rounded-control border border-border px-3 text-small-label text-secondary-text">
          <CircleUserRound aria-hidden="true" className="size-5" />
          <span>{userName ?? "Profile unavailable"}</span>
        </div>
        {onLogout && (
          <Button variant="outline" size="small" onClick={onLogout}>
            Sign Out
          </Button>
        )}
        <Link
          to="/plan-trip"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary-dark px-4 text-small-label font-semibold text-surface transition-standard hover:bg-secondary-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-teal focus-visible:ring-offset-2"
        >
          <Plus aria-hidden="true" className="size-4" />
          Create New Trip
        </Link>
      </div>
    </section>
  );
}
