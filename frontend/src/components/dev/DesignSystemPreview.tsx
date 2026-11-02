import {
  ArrowRight,
  Compass,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Container } from "../ui/Container";
import { Input } from "../ui/Input";
import { SectionHeading } from "../ui/SectionHeading";
import { EmptyState } from "../common/EmptyState";
import { ErrorState } from "../common/ErrorState";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { Skeleton } from "../common/Skeleton";
import { Footer } from "../layout/Footer";
import { Navbar } from "../layout/Navbar";

const previewNavigation = [
  { label: "Buttons", href: "#preview-buttons" },
  { label: "Forms", href: "#preview-inputs" },
  { label: "Cards", href: "#preview-cards" },
  { label: "Feedback", href: "#preview-feedback" },
];

export default function DesignSystemPreview() {
  const [retryRequested, setRetryRequested] = useState(false);

  return (
    <div className="min-h-screen bg-main-background text-primary-text">
      <Navbar items={previewNavigation} />
      <main>
        <section className="border-b border-border bg-mint-background/60 py-12 tablet:py-16">
          <Container>
            <p className="mb-3 inline-flex items-center gap-2 text-small-label font-semibold uppercase tracking-wide text-secondary-teal">
              <Sparkles aria-hidden="true" className="size-4" />
              Development preview
            </p>
            <h1 className="text-page-heading text-primary-dark">
              TripCraft design system
            </h1>
            <p className="mt-3 max-w-content-md text-body leading-relaxed text-secondary-text">
              Reusable components, semantic tokens, and interaction states for
              the TripCraft application.
            </p>
          </Container>
        </section>

        <Container className="grid gap-12 py-10 tablet:gap-16 tablet:py-14">
          <section id="preview-buttons" aria-labelledby="buttons-heading">
            <SectionHeading
              id="buttons-heading"
              eyebrow="Actions"
              heading="Buttons"
              subtitle="Variants, sizes, icons, loading, and disabled states."
            />
            <div className="mt-6 grid gap-6">
              <div className="flex flex-wrap items-center gap-3">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="small">Small</Button>
                <Button size="medium">Medium</Button>
                <Button size="large">Large</Button>
                <Button disabled>Disabled</Button>
                <Button loading>Loading</Button>
                <Button
                  leftIcon={<Search className="size-4" />}
                  rightIcon={<ArrowRight className="size-4" />}
                >
                  With icons
                </Button>
              </div>
              <div className="max-w-content-sm">
                <Button fullWidth variant="secondary">
                  Full width
                </Button>
              </div>
            </div>
          </section>

          <section id="preview-inputs" aria-labelledby="inputs-heading">
            <SectionHeading
              id="inputs-heading"
              eyebrow="Form controls"
              heading="Inputs"
              subtitle="Labels, helper text, validation, adornments, and disabled state."
            />
            <div className="mt-6 grid gap-5 tablet:grid-cols-2">
              <Input
                label="Destination"
                placeholder="Where would you like to go?"
                helperText="Try a city, region, or country."
                leftIcon={<Search className="size-4" />}
              />
              <Input
                label="Departure city"
                placeholder="Choose a departure city"
                leftIcon={<MapPin className="size-4" />}
                rightIcon={<Compass className="size-4" />}
                required
              />
              <Input
                label="Email address"
                type="email"
                defaultValue="not-an-email"
                error="Enter a valid email address."
                aria-invalid="true"
              />
              <Input
                label="Read-only example"
                defaultValue="This field is disabled"
                disabled
              />
            </div>
          </section>

          <section id="preview-cards" aria-labelledby="cards-heading">
            <SectionHeading
              id="cards-heading"
              eyebrow="Surfaces"
              heading="Cards"
              subtitle="Default, elevated, and linked interactive cards with optional header and footer."
            />
            <div className="mt-6 grid gap-4 tablet:grid-cols-3">
              <Card
                header={<h3 className="font-semibold">Default card</h3>}
                footer={<span className="text-caption text-secondary-text">Updated just now</span>}
              >
                <p className="text-body text-secondary-text">
                  A balanced surface for general content.
                </p>
              </Card>
              <Card variant="elevated" padding="large">
                <h3 className="font-semibold">Elevated card</h3>
                <p className="mt-2 text-body text-secondary-text">
                  Subtle shadow gives this surface extra emphasis.
                </p>
              </Card>
              <Card
                href="#preview-buttons"
                interactive
                aria-label="Interactive card example, jump to buttons"
              >
                <h3 className="font-semibold">Interactive card</h3>
                <p className="mt-2 text-body text-secondary-text">
                  A semantic link with visible keyboard focus.
                </p>
              </Card>
            </div>
          </section>

          <section aria-labelledby="badges-heading">
            <SectionHeading
              id="badges-heading"
              eyebrow="Status"
              heading="Badges"
              subtitle="Semantic status and emphasis variants."
            />
            <div className="mt-6 flex flex-wrap gap-3">
              <Badge>Default</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="error">Error</Badge>
              <Badge variant="information">Information</Badge>
              <Badge variant="featured">Featured</Badge>
            </div>
          </section>

          <section id="preview-feedback" aria-labelledby="feedback-heading">
            <SectionHeading
              id="feedback-heading"
              eyebrow="Feedback"
              heading="Loading, empty, and error states"
              subtitle="Shared patterns keep feedback clear and consistent."
            />
            <div className="mt-6 grid gap-5 tablet:grid-cols-2">
              <Card header={<h3 className="font-semibold">Loading spinner</h3>}>
                <div className="flex items-center gap-6">
                  <LoadingSpinner size="small" label="Loading small preview" />
                  <LoadingSpinner size="medium" label="Loading preview" />
                  <LoadingSpinner size="large" label="Loading large preview" />
                </div>
              </Card>
              <Card header={<h3 className="font-semibold">Skeleton</h3>}>
                <div className="flex gap-4">
                  <Skeleton variant="circular" className="shrink-0" />
                  <Skeleton lines={3} className="flex-1" />
                </div>
              </Card>
              <EmptyState
                title="No saved trips yet"
                description="Trips you save will appear here when that feature is available."
                icon={<Compass className="size-8" />}
                action={
                  <Button
                    size="small"
                    variant="outline"
                    onClick={() => {
                      window.location.hash = "preview-buttons";
                    }}
                  >
                    Explore the components
                  </Button>
                }
              />
              <ErrorState
                title="Could not load preview data"
                description={
                  retryRequested
                    ? "Retry requested. This preview has no data source connected."
                    : "This is an example error state. Your work has not been lost."
                }
                onRetry={() => setRetryRequested(true)}
              />
            </div>
          </section>

          <section aria-labelledby="heading-preview">
            <SectionHeading
              id="heading-preview"
              eyebrow="Typography"
              heading="Section headings"
              subtitle="A consistent heading hierarchy with optional eyebrow, supporting text, and actions."
              action={
                <Button
                  variant="ghost"
                  rightIcon={<ArrowRight className="size-4" />}
                >
                  Example action
                </Button>
              }
            />
          </section>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
