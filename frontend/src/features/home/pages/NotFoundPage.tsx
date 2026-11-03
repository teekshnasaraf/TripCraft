import { Link } from "react-router-dom";
import { Footer } from "../../../components/layout/Footer";
import { Navbar } from "../../../components/layout/Navbar";
import { Container } from "../../../components/ui/Container";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col bg-main-background text-primary-text">
      <Navbar items={[{ label: "Home", href: "/" }]} />
      <main className="flex flex-1 items-center py-16">
        <Container className="text-center">
          <p className="text-small-label font-semibold uppercase tracking-wide text-secondary-teal">
            404 · Page not found
          </p>
          <h1 className="mt-3 text-page-heading font-bold text-primary-dark">
            This page isn’t on the map.
          </h1>
          <p className="mx-auto mt-3 max-w-content-sm text-body text-secondary-text">
            The address may have changed, or the page may not exist yet.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-control bg-primary-dark px-4 text-small-label font-semibold text-surface transition-standard hover:bg-secondary-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-teal focus-visible:ring-offset-2"
          >
            Return home
          </Link>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
