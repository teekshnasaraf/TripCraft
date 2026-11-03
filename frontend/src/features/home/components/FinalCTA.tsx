import { ArrowRight, Compass } from "lucide-react";
import { Link } from "react-router-dom";
import { Container } from "../../../components/ui/Container";

export function FinalCTA() {
  return (
    <section
      id="get-started"
      className="scroll-mt-20 bg-primary-dark py-16 text-white tablet:py-20"
      aria-labelledby="final-cta-heading"
    >
      <Container className="flex flex-col items-start justify-between gap-8 tablet:flex-row tablet:items-center">
        <div className="max-w-content-lg">
          <span className="mb-4 inline-flex size-11 items-center justify-center rounded-control bg-white/10 text-mint-background">
            <Compass aria-hidden="true" className="size-5" />
          </span>
          <h2
            id="final-cta-heading"
            className="text-section-heading font-bold text-white tablet:text-page-heading"
          >
            Your journey starts with a smarter plan.
          </h2>
          <p className="mt-3 max-w-content-md text-body leading-relaxed text-white/80">
            Bring your travel ideas and priorities together. TripCraft planning
            tools are on the way.
          </p>
        </div>
        <Link
          to="/plan-trip"
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-control bg-mint-background px-5 text-body font-semibold text-primary-dark transition-standard hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-dark"
        >
          Start planning
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </Container>
    </section>
  );
}
