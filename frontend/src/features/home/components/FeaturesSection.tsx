import {
  ArrowLeftRight,
  BrainCircuit,
  Calculator,
  ChartNoAxesCombined,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { Card } from "../../../components/ui/Card";
import { Container } from "../../../components/ui/Container";
import { SectionHeading } from "../../../components/ui/SectionHeading";

const features = [
  {
    title: "Multi-platform comparison",
    description:
      "Compare travel options from independent providers side by side, with sources and details kept clear.",
    icon: ArrowLeftRight,
  },
  {
    title: "AI-assisted itineraries",
    description:
      "Turn your dates, interests, and pace into a personalised day-wise itinerary you can shape.",
    icon: BrainCircuit,
  },
  {
    title: "Smarter budget planning",
    description:
      "Explore practical travel combinations designed around the budget you set.",
    icon: ChartNoAxesCombined,
  },
  {
    title: "Personalised recommendations",
    description:
      "Find ideas that reflect your travel style, preferences, and the way you want to spend your time.",
    icon: Sparkles,
  },
  {
    title: "Trip cost overview",
    description:
      "Bring major trip costs together to make trade-offs easier to understand before you book.",
    icon: Calculator,
  },
  {
    title: "Book with providers",
    description:
      "Continue to a travel provider to review its latest details and complete any booking directly.",
    icon: ExternalLink,
  },
];

export function FeaturesSection() {
  return (
    <section
      id="why-tripcraft"
      className="scroll-mt-20 py-16 tablet:py-24"
      aria-labelledby="features-heading"
    >
      <Container>
        <div className="flex flex-col gap-4 tablet:flex-row tablet:items-end tablet:justify-between">
          <SectionHeading
            id="features-heading"
            eyebrow="Why TripCraft"
            heading="A travel plan built around the whole trip"
            subtitle="The tools we are building bring your choices and priorities together."
          />
          <Badge variant="information">Planned capabilities</Badge>
        </div>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 tablet:grid-cols-3">
          {features.map(({ title, description, icon: Icon }) => (
            <Card key={title} className="h-full">
              <span className="flex size-11 items-center justify-center rounded-control bg-mint-background text-secondary-teal">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <h3 className="mt-5 text-subheading font-semibold text-primary-text">
                {title}
              </h3>
              <p className="mt-2 text-small-label leading-relaxed text-secondary-text">
                {description}
              </p>
            </Card>
          ))}
        </div>
        <p className="mt-5 text-caption text-secondary-text">
          These capabilities are planned and are not yet available in the
          current TripCraft application.
        </p>
      </Container>
    </section>
  );
}
