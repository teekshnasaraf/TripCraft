import { Compass, Menu, X } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { Container } from "../ui/Container";

export interface NavigationItem {
  label: string;
  href: string;
}

export interface NavbarProps {
  items?: readonly NavigationItem[];
  brandHref?: string;
  actions?: ReactNode;
  mobileActions?: ReactNode;
}

function NavigationLinks({
  items,
  onNavigate,
}: {
  items: readonly NavigationItem[];
  onNavigate?: () => void;
}) {
  const [activeHash, setActiveHash] = useState("");

  return items.map(({ label, href }) => {
    const baseClasses =
      "rounded-control px-3 py-2 text-small-label font-semibold transition-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-teal focus-visible:ring-offset-2";
    const key = `${label}-${href}`;

    if (href.startsWith("#")) {
      return (
        <a
          key={key}
          href={href}
          aria-current={activeHash === href ? "location" : undefined}
          onClick={() => {
            setActiveHash(href);
            onNavigate?.();
          }}
          className={[
            baseClasses,
            activeHash === href
              ? "bg-mint-background text-primary-dark"
              : "text-secondary-text hover:bg-main-background hover:text-primary-text",
          ].join(" ")}
        >
          {label}
        </a>
      );
    }

    return (
      <NavLink
        key={key}
        to={href}
        end={href.split("#", 1)[0] === "/"}
        onClick={onNavigate}
        className={({ isActive }) =>
          [
            baseClasses,
            isActive
              ? "bg-mint-background text-primary-dark"
              : "text-secondary-text hover:bg-main-background hover:text-primary-text",
          ].join(" ")
        }
      >
        {label}
      </NavLink>
    );
  });
}

export function Navbar({
  items = [],
  brandHref = "/",
  actions,
  mobileActions = actions,
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="relative z-10 border-b border-border bg-surface">
      <Container className="flex min-h-16 items-center justify-between gap-4">
        <Link
          to={brandHref}
          className="inline-flex items-center gap-2 rounded-control text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-teal focus-visible:ring-offset-4"
          aria-label="TripCraft home"
        >
          <Compass aria-hidden="true" className="size-6 text-secondary-teal" />
          <span className="text-subheading font-bold tracking-tight">
            TripCraft
          </span>
        </Link>

        {(items.length > 0 || actions) && (
          <>
            <nav
              aria-label="Primary navigation"
              className="ml-auto hidden items-center gap-1 tablet:flex"
            >
              <NavigationLinks items={items} />
            </nav>
            {actions && (
              <div className="hidden items-center gap-2 tablet:flex">
                {actions}
              </div>
            )}
            <button
              type="button"
              className="inline-flex size-11 items-center justify-center rounded-control text-primary-text transition-standard hover:bg-main-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-teal focus-visible:ring-offset-2 tablet:hidden"
              aria-label={
                menuOpen ? "Close navigation menu" : "Open navigation menu"
              }
              aria-expanded={menuOpen}
              aria-controls="mobile-primary-navigation"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? (
                <X aria-hidden="true" className="size-5" />
              ) : (
                <Menu aria-hidden="true" className="size-5" />
              )}
            </button>
          </>
        )}
      </Container>

      {(items.length > 0 || mobileActions) && (
        <nav
          id="mobile-primary-navigation"
          aria-label="Mobile primary navigation"
          className="border-t border-border bg-surface px-page-gutter py-3 tablet:hidden"
          hidden={!menuOpen}
        >
          <div className="mx-auto flex max-w-content flex-col gap-1">
            <NavigationLinks
              items={items}
              onNavigate={() => setMenuOpen(false)}
            />
            {mobileActions && (
              <div
                className="mt-2 flex flex-wrap items-center gap-2 border-t border-border pt-3"
                onClick={() => setMenuOpen(false)}
              >
                {mobileActions}
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
