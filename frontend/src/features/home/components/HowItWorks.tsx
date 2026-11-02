import {
  ArrowDown,
  ArrowRight,
  CalendarDays,
  Compass,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Card } from "../../../components/ui/Card";
import { Container } from "../../../components/ui/Container";
import { SectionHeading } from "../../../components/ui/SectionHeading";

const steps = [
  {
    number: "01",
    title: "Enter Your Preferences",
    description:
      "Choose where you want to go, when you want to travel, your budget, and the experiences you enjoy.",
    icon: CalendarDays,
  },
  {
    number: "02",
    title: "Compare Travel Options",
    description:
      "Bring flights, accommodation, and activities from travel providers into one place to compare.",
    icon: Compass,
  },
  {
    number: "03",
    title: "Optimise Your Budget",
    description:
      "Explore practical combinations that balance your spending priorities with the experiences you want.",
    icon: Wallet,
  },
  {
    number: "04",
    title: "Get Your Itinerary",
    description:
      "Build a personalised day-wise plan, then follow provider links when you are ready to book.",
    icon: Sparkles,
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 bg-surface py-16 tablet:py-24"
      aria-labelledby="how-it-works-heading"
    >
      <Container>
        <SectionHeading
          id="how-it-works-heading"
          eyebrow="A clearer way to plan"
          heading="From first idea to a thoughtful itinerary"
          subtitle="A simple four-step journey from your travel preferences to a plan that fits."
        />
        <ol className="mt-9 grid gap-4 sm:grid-cols-2 tablet:grid-cols-4">
          {steps.map(({ number, title, description, icon: Icon }, index) => (
            <li key={number} className="relative">
              <Card className="h-full">
                <div className="flex items-center justify-between">
                  <span className="text-small-label font-bold tracking-wider text-secondary-teal">
                    {number}
                  </span>
                  <span className="flex size-10 items-center justify-center rounded-control bg-mint-background text-secondary-teal">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                </div>
                <h3 className="mt-5 text-subheading font-semibold text-primary-text">
                  {title}
                </h3>
                <p className="mt-2 text-small-label leading-relaxed text-secondary-text">
                  {description}
                </p>
              </Card>
              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-3 top-1/2 z-[1] hidden -translate-y-1/2 rounded-full border border-border bg-surface p-1 text-secondary-teal tablet:block"
                >
                  <ArrowRight className="size-4" />
                </span>
              )}
              {index < steps.length - 1 && index % 2 === 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -bottom-3 left-1/2 z-[1] hidden -translate-x-1/2 rounded-full border border-border bg-surface p-1 text-secondary-teal sm:block tablet:hidden"
                >
                  <ArrowDown className="size-4" />
                </span>
              )}
            </li>
          ))}
        </ol>
        <p className="mt-5 text-caption text-secondary-text">
          This describes the planned TripCraft experience. Comparison,
          optimisation, and itinerary tools are not live yet.
        </p>
      </Container>
    </section>
  );
}
