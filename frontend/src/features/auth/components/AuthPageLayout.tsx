import type { PropsWithChildren } from "react";
import { Link } from "react-router-dom";
import { Footer } from "../../../components/layout/Footer";
import { Navbar } from "../../../components/layout/Navbar";
import { Container } from "../../../components/ui/Container";

interface AuthPageLayoutProps extends PropsWithChildren {
  title: string;
  description: string;
}

export function AuthPageLayout({
  title,
  description,
  children,
}: AuthPageLayoutProps) {
  const actions = (
    <Link
      to="/"
      className="rounded-control px-3 py-2 text-small-label font-semibold text-secondary-text hover:bg-main-background hover:text-primary-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-teal"
    >
      Home
    </Link>
  );

  return (
    <div className="flex min-h-screen flex-col bg-main-background text-primary-text">
      <Navbar
        items={[{ label: "Plan a trip", href: "/plan-trip" }]}
        actions={actions}
        mobileActions={actions}
      />
      <main className="flex flex-1 items-center py-10 tablet:py-16">
        <Container className="w-full max-w-content-sm">
          <div className="rounded-card border border-border bg-surface p-5 shadow-card tablet:p-8">
            <p className="text-small-label font-semibold uppercase tracking-wide text-secondary-teal">
              TripCraft account
            </p>
            <h1 className="mt-2 text-page-heading font-bold text-primary-dark">
              {title}
            </h1>
            <p className="mt-3 text-body leading-relaxed text-secondary-text">
              {description}
            </p>
            <div className="mt-7">{children}</div>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
