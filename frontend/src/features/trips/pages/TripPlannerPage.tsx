import { Link } from "react-router-dom";
import { Footer } from "../../../components/layout/Footer";
import { Navbar } from "../../../components/layout/Navbar";
import { Container } from "../../../components/ui/Container";
import { SectionHeading } from "../../../components/ui/SectionHeading";
import { TripPlannerForm } from "../components/TripPlannerForm";

export default function TripPlannerPage() {
  const signInLink = (
    <Link
      to="/sign-in"
      className="rounded-control px-3 py-2 text-small-label font-semibold text-secondary-text hover:bg-main-background hover:text-primary-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-teal"
    >
      Sign In
    </Link>
  );

  return (
    <div className="min-h-screen bg-main-background text-primary-text">
      <Navbar
        items={[{ label: "Home", href: "/" }]}
        actions={signInLink}
        mobileActions={signInLink}
      />
      <main>
        <Container className="grid gap-8 py-10 tablet:gap-10 tablet:py-16">
          <SectionHeading
            level="h1"
            eyebrow="Plan a trip"
            heading="Start with the details that matter to you"
            subtitle="Share your route, dates, budget, and preferences. Sign in to save your trip; travel-provider search and availability are not connected."
          />
          <TripPlannerForm />
        </Container>
      </main>
      <Footer />
    </div>
  );
}
