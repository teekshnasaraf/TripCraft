import { ArrowDown, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { EditorialImage } from "./EditorialImage";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-primary-dark text-white">
      <EditorialImage
        src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2000&q=85"
        alt="A mountain lake surrounded by green alpine peaks"
        className="absolute inset-0"
        imageClassName="h-full object-cover object-center opacity-40"
        loading="eager"
        fetchPriority="high"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-primary-dark/95 via-primary-dark/75 to-primary-dark/35"
      />
      <div className="relative mx-auto grid min-h-[34rem] max-w-content items-center gap-10 px-page-gutter py-16 tablet:min-h-[39rem] tablet:grid-cols-[1.1fr_0.9fr] tablet:py-24">
        <div className="max-w-content-md">
          <span className="mb-6 inline-flex items-center gap-2 rounded-badge border border-white/25 bg-white/10 px-3 py-1.5 text-small-label font-medium text-white">
            <Sparkles aria-hidden="true" className="size-4 text-mint-background" />
            A more thoughtful way to travel
          </span>
          <h1 className="max-w-content-md text-page-heading font-bold leading-tight tracking-tight text-white tablet:text-display">
            Your Next Adventure, Perfectly Planned.
          </h1>
          <p className="mt-5 max-w-content-md text-body leading-relaxed text-white/85 tablet:text-subheading">
            Compare flights, stays and experiences. Discover the best
            combinations, optimise your budget, and build an itinerary that
            makes every trip count.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/plan-trip"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-mint-background px-5 text-subheading font-semibold text-primary-dark transition-standard hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-dark"
            >
              Plan My Trip
              <ArrowRight aria-hidden="true" className="size-5" />
            </Link>
            <a
              href="#destinations"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-white/50 px-5 text-body font-semibold text-white transition-standard hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-dark"
            >
              Explore Destinations
              <ArrowDown aria-hidden="true" className="size-4" />
            </a>
          </div>
          <p className="mt-5 text-caption text-white/75">
            Compare your options, then book directly with travel providers.
          </p>
        </div>

        <div className="hidden tablet:block">
          <div className="ml-auto max-w-[25rem] rounded-card border border-white/20 bg-primary-dark/65 p-6 shadow-card backdrop-blur-sm">
            <p className="text-small-label font-semibold uppercase tracking-wide text-mint-background">
              Your trip, your way
            </p>
            <p className="mt-3 text-section-heading font-semibold text-white">
              More possibilities. Less guesswork.
            </p>
            <p className="mt-3 text-body leading-relaxed text-white/80">
              Bring travel choices and your budget into one thoughtful plan.
              Planning tools are coming soon.
            </p>
            <div className="mt-6 flex items-center gap-3 border-t border-white/20 pt-5">
              <span className="flex size-10 items-center justify-center rounded-full bg-mint-background text-secondary-teal">
                <Sparkles aria-hidden="true" className="size-5" />
              </span>
              <span className="text-small-label text-white/90">
                A clearer path to your next adventure
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
