import {
  Bookmark,
  Briefcase,
  LayoutDashboard,
  Map,
  Settings,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const navigation = [
  { label: "Dashboard", href: "", icon: LayoutDashboard },
  { label: "My Trips", href: "#upcoming-trips", icon: Briefcase },
  { label: "Plan a Trip", href: "/plan-trip", icon: Map },
  { label: "Saved Trips", href: "#saved-trips", icon: Bookmark },
];

interface DashboardSidebarProps {
  preview?: boolean;
}

export function DashboardSidebar({ preview = false }: DashboardSidebarProps) {
  const { pathname, hash } = useLocation();
  const dashboardPath = preview ? "/dev/dashboard-preview" : "/dashboard";

  return (
    <nav
      aria-label="Dashboard navigation"
      className="rounded-card border border-border bg-surface p-3 shadow-subtle"
    >
      <ul className="grid gap-1 sm:grid-cols-2 tablet:grid-cols-1">
        {navigation.map(({ label, href, icon: Icon }) => {
          const to =
            href === ""
              ? dashboardPath
              : href.startsWith("#")
                ? `${dashboardPath}${href}`
                : href;
          const current = href.startsWith("#")
            ? pathname === dashboardPath && hash === href
            : href === ""
              ? pathname === dashboardPath && !hash
              : pathname === href;

          return (
            <li key={href}>
              <Link
                to={to}
                aria-current={current ? "page" : undefined}
                className={[
                  "flex min-h-11 items-center gap-3 rounded-control px-3 text-small-label font-semibold transition-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-teal",
                  current
                    ? "bg-mint-background text-primary-dark"
                    : "text-secondary-text hover:bg-main-background hover:text-primary-text",
                ].join(" ")}
              >
                <Icon aria-hidden="true" className="size-4 shrink-0" />
                {label}
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            disabled
            className="flex min-h-11 w-full items-center gap-3 rounded-control px-3 text-left text-small-label font-semibold text-secondary-text disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Settings (coming soon)"
          >
            <Settings aria-hidden="true" className="size-4 shrink-0" />
            Settings
            <span className="ml-auto text-caption font-normal">Soon</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
