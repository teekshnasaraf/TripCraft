import type { ReactNode } from "react";

export interface SectionHeadingProps {
  heading: string;
  subtitle?: string;
  eyebrow?: string;
  action?: ReactNode;
  level?: "h1" | "h2" | "h3";
  className?: string;
  id?: string;
}

export function SectionHeading({
  heading,
  subtitle,
  eyebrow,
  action,
  level = "h2",
  className,
  id,
}: SectionHeadingProps) {
  const Heading = level;
  const headingClasses = {
    h1: "text-page-heading",
    h2: "text-section-heading",
    h3: "text-subheading",
  }[level];

  return (
    <div
      className={[
        "flex flex-col gap-4 tablet:flex-row tablet:items-end tablet:justify-between",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="max-w-content-md">
        {eyebrow && (
          <p className="mb-2 text-small-label font-semibold uppercase tracking-wide text-secondary-teal">
            {eyebrow}
          </p>
        )}
        <Heading
          id={id}
          className={`${headingClasses} font-bold text-primary-text`}
        >
          {heading}
        </Heading>
        {subtitle && (
          <p className="mt-2 text-body leading-relaxed text-secondary-text">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
