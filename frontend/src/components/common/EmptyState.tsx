import { useId, type ReactNode } from "react";

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  const titleId = useId();

  return (
    <section
      className={[
        "flex flex-col items-center rounded-card border border-dashed border-border bg-surface px-6 py-10 text-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-labelledby={titleId}
    >
      {icon && (
        <span
          aria-hidden="true"
          className="mb-4 inline-flex text-primary-teal"
        >
          {icon}
        </span>
      )}
      <h3
        id={titleId}
        className="text-subheading font-semibold text-primary-text"
      >
        {title}
      </h3>
      <p className="mt-2 max-w-content-sm text-body text-secondary-text">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </section>
  );
}
