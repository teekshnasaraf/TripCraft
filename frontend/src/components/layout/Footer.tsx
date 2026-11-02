import { Compass } from "lucide-react";
import { Link } from "react-router-dom";
import { Container } from "../ui/Container";

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterSection {
  heading: string;
  links: readonly FooterLink[];
}

export interface FooterProps {
  sections?: readonly FooterSection[];
  brandHref?: string;
  description?: string;
}

const defaultSections: readonly FooterSection[] = [
  {
    heading: "Product",
    links: [
      { label: "Explore", href: "/#explore" },
      { label: "My trips", href: "/#trips" },
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

export function Footer({
  sections = defaultSections,
  brandHref = "/",
  description = "Thoughtful travel planning, with choices that fit your journey.",
}: FooterProps) {
  return (
    <footer className="border-t border-border bg-surface">
      <Container className="grid gap-8 py-10 tablet:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] tablet:py-12">
        <div>
          <Link
            to={brandHref}
            className="inline-flex items-center gap-2 rounded-control text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-teal focus-visible:ring-offset-4"
          >
            <Compass aria-hidden="true" className="size-5 text-secondary-teal" />
            <span className="font-bold">TripCraft</span>
          </Link>
          <p className="mt-3 max-w-content-sm text-small-label leading-relaxed text-secondary-text">
            {description}
          </p>
        </div>
        {sections.map((section) => (
          <nav
            key={section.heading}
            aria-label={`${section.heading} footer links`}
          >
            <h2 className="text-small-label font-semibold text-primary-text">
              {section.heading}
            </h2>
            <ul className="mt-3 grid gap-2">
              {section.links.map((link) => (
                <li key={`${link.label}-${link.href}`}>
                  <Link
                    className="rounded-sm text-small-label text-secondary-text transition-standard hover:text-secondary-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-teal"
                    to={link.href}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>
      <div className="border-t border-border">
        <Container className="py-4 text-caption text-secondary-text">
          &copy; {new Date().getFullYear()} TripCraft. All rights reserved.
        </Container>
      </div>
    </footer>
  );
}
