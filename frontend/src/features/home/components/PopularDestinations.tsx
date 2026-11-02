import { ArrowUpRight, Compass } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { Card } from "../../../components/ui/Card";
import { Container } from "../../../components/ui/Container";
import { SectionHeading } from "../../../components/ui/SectionHeading";
import { EditorialImage } from "./EditorialImage";

const destinations = [
  {
    name: "Bali",
    region: "Indonesia",
    description: "Island temples, green terraces, and a slower pace.",
    style: "Island escape",
    image:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=900&q=80",
    alt: "Balinese temple architecture surrounded by tropical greenery",
  },
  {
    name: "Kyoto",
    region: "Japan",
    description: "Historic streets, quiet gardens, and rich traditions.",
    style: "Culture & calm",
    image:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=900&q=80",
    alt: "Traditional Japanese street framed by historic wooden buildings",
  },
  {
    name: "Swiss Alps",
    region: "Switzerland",
    description: "Mountain air, scenic trails, and lakeside views.",
    style: "Mountain retreat",
    image:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=80",
    alt: "Alpine lake below a range of green mountain peaks",
  },
  {
    name: "Dubai",
    region: "United Arab Emirates",
    description: "Contemporary architecture meets desert horizons.",
    style: "City & desert",
    image:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=80",
    alt: "Dubai skyline at dusk",
  },
  {
    name: "Goa",
    region: "India",
    description: "Coastal villages, warm evenings, and sandy shores.",
    style: "Coastal escape",
    image:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=900&q=80",
    alt: "Sunny coastline with palm trees in Goa",
  },
  {
    name: "Paris",
    region: "France",
    description: "Café corners, grand boulevards, and art-filled days.",
    style: "Classic city break",
    image:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=80",
    alt: "Paris rooftops and the Eiffel Tower in the distance",
  },
];

export function PopularDestinations() {
  return (
    <section
      id="destinations"
      className="scroll-mt-20 py-16 tablet:py-24"
      aria-labelledby="destinations-heading"
    >
      <Container>
        <SectionHeading
          id="destinations-heading"
          eyebrow="A little inspiration"
          heading="Popular places to start exploring"
          subtitle="A few editorial picks to spark an idea. Your own journey can take you anywhere."
          action={
            <Badge variant="information">
              <Compass aria-hidden="true" className="mr-1.5 size-3.5" />
              Inspiration, not live offers
            </Badge>
          }
        />

        <div className="mt-8 grid gap-5 sm:grid-cols-2 tablet:grid-cols-3">
          {destinations.map((destination) => (
            <Card
              key={destination.name}
              padding="small"
              className="group transition-standard hover:-translate-y-0.5 hover:shadow-card"
            >
              <article>
                <div className="relative -mx-4 -mt-4 mb-4 aspect-[4/3] overflow-hidden rounded-t-card bg-primary-dark">
                  <EditorialImage
                    src={destination.image}
                    alt={destination.alt}
                    className="h-full w-full"
                    imageClassName="transition-standard group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3">
                    <Badge variant="featured">{destination.style}</Badge>
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-subheading font-semibold text-primary-text">
                      {destination.name}
                    </h3>
                    <p className="mt-0.5 text-small-label text-secondary-text">
                      {destination.region}
                    </p>
                  </div>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="mt-1 size-4 shrink-0 text-secondary-teal"
                  />
                </div>
                <p className="mt-3 text-small-label leading-relaxed text-secondary-text">
                  {destination.description}
                </p>
              </article>
            </Card>
          ))}
        </div>
        <p className="mt-5 text-caption text-secondary-text">
          Destination descriptions are editorial samples. TripCraft does not
          currently provide live travel listings or availability.
        </p>
      </Container>
    </section>
  );
}
