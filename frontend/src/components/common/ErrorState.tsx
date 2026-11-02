import { useId } from "react";
import { Button } from "../ui/Button";

export interface ErrorStateProps {
  title?: string;
  description: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  retryLabel = "Try again",
  className,
}: ErrorStateProps) {
  const titleId = useId();

  return (
    <section
      className={[
        "rounded-card border border-error/30 bg-error/10 px-6 py-5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="alert"
      aria-labelledby={titleId}
    >
      <h3
        id={titleId}
        className="text-subheading font-semibold text-error-text"
      >
        {title}
      </h3>
      <p className="mt-2 text-body text-primary-text">{description}</p>
      {onRetry && (
        <Button
          className="mt-4"
          variant="outline"
          size="small"
          onClick={onRetry}
        >
          {retryLabel}
        </Button>
      )}
    </section>
  );
}
