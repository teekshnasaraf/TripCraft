import { Check, Crown, Leaf, Scale } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { Card } from "../../../components/ui/Card";
import { Container } from "../../../components/ui/Container";
import { SectionHeading } from "../../../components/ui/SectionHeading";

const travelStyles = [
  {
    name: "Budget Explorer",
    description: "Make each part of your budget go thoughtfully further.",
    points: [
      "Focus on affordable, practical combinations",
      "Prioritise cost efficiency",
      "Keep room for meaningful experiences",
    ],
    icon: Leaf,
    variant: "information" as const,
  },
  {
    name: "Balanced Experience",
    description: "Find a comfortable middle ground for your kind of trip.",
    points: [
      "Balance comfort, activities, and affordability",
      "Avoid spend that does not add value",
      "Plan a practical overall combination",
    ],
    icon: Scale,
    variant: "success" as const,
  },
  {
    name: "Premium Experience",
    description: "Give comfort and memorable moments more room.",
    points: [
      "Prioritise added comfort and experiences",
      "Keep recommendations within your budget",
      "Choose where an upgrade matters to you",
    ],
    icon: Crown,
    variant: "featured" as const,
  },
];

export function TravelStyles() {
  return (
    <section
      id="travel-styles"
      className="scroll-mt-20 bg-surface py-16 tablet:py-24"
      aria-labelledby="travel-styles-heading"
    >
      <Container>
        <div className="flex flex-col gap-4 tablet:flex-row tablet:items-end tablet:justify-between">
          <SectionHeading
            id="travel-styles-heading"
            eyebrow="Travel your way"
            heading="Choose the kind of trip that feels right"
            subtitle="Planned recommendation styles will help shape options around what matters to you."
          />
          <Badge variant="warning">Recommendation styles coming soon</Badge>
        </div>
        <div className="mt-9 grid gap-5 tablet:grid-cols-3">
          {travelStyles.map(({ name, description, points, icon: Icon, variant }) => (
            <Card
              key={name}
              variant={name === "Balanced Experience" ? "elevated" : "default"}
              className="h-full"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex size-11 items-center justify-center rounded-control bg-mint-background text-secondary-teal">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <Badge variant={variant}>Planned</Badge>
              </div>
              <h3 className="mt-5 text-subheading font-semibold text-primary-text">
                {name}
              </h3>
              <p className="mt-2 min-h-12 text-small-label leading-relaxed text-secondary-text">
                {description}
              </p>
              <ul className="mt-5 grid gap-3">
                {points.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2 text-small-label leading-relaxed text-primary-text"
                  >
                    <Check
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-secondary-teal"
                    />
                    {point}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
