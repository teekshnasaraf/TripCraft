import { Link } from "react-router-dom";
import { Footer } from "../../../components/layout/Footer";
import { Navbar } from "../../../components/layout/Navbar";
import { FeaturesSection } from "../components/FeaturesSection";
import { FinalCTA } from "../components/FinalCTA";
import { HeroSection } from "../components/HeroSection";
import { HowItWorks } from "../components/HowItWorks";
import { PopularDestinations } from "../components/PopularDestinations";
import { TravelStyles } from "../components/TravelStyles";
import { TripSearchForm } from "../components/TripSearchForm";

const navigationItems = [
  { label: "Explore", href: "#destinations" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Why TripCraft", href: "#why-tripcraft" },
];

const footerSections = [
  {
    heading: "Explore",
    links: [
      { label: "Destinations", href: "/#destinations" },
      { label: "Travel styles", href: "/#travel-styles" },
    ],
  },
  {
    heading: "TripCraft",
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "Why TripCraft", href: "/#why-tripcraft" },
    ],
  },
  {
    heading: "Information",
    links: [
      { label: "Privacy (coming soon)", href: "/#privacy" },
      { label: "Terms (coming soon)", href: "/#terms" },
    ],
  },
];

const homeActions = (
  <>
    <Link
      to="/sign-in"
      className="inline-flex min-h-11 items-center justify-center rounded-control px-4 text-small-label font-semibold text-secondary-teal transition-standard hover:bg-mint-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-teal focus-visible:ring-offset-2"
    >
      Sign In
    </Link>
    <Link
      to="/register"
      className="inline-flex min-h-11 items-center justify-center rounded-control bg-primary-dark px-4 text-small-label font-semibold text-surface transition-standard hover:bg-secondary-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-teal focus-visible:ring-offset-2"
    >
      Get Started
    </Link>
  </>
);

export default function HomePage() {
  return (
    <div className="min-h-screen bg-main-background text-primary-text">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-control bg-surface p-3 text-primary-text focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-teal"
      >
        Skip to content
      </a>
      <Navbar
        items={navigationItems}
        actions={homeActions}
        mobileActions={homeActions}
      />
      <main id="main-content">
        <HeroSection />
        <TripSearchForm />
        <PopularDestinations />
        <HowItWorks />
        <FeaturesSection />
        <TravelStyles />
        <FinalCTA />
      </main>
      <Footer
        sections={footerSections}
        description="Plan thoughtfully, compare with clarity, and book directly with travel providers."
      />
    </div>
  );
}
