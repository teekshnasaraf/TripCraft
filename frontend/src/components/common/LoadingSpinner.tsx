export interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  label?: string;
  className?: string;
}

const sizeClasses: Record<
  NonNullable<LoadingSpinnerProps["size"]>,
  string
> = {
  small: "size-4 border-2",
  medium: "size-6 border-2",
  large: "size-9 border-[3px]",
};

export function LoadingSpinner({
  size = "medium",
  label = "Loading",
  className,
}: LoadingSpinnerProps) {
  return (
    <span
      className="inline-flex items-center gap-2 text-secondary-text"
      role="status"
    >
      <span
        aria-hidden="true"
        className={[
          "animate-spin rounded-full border-primary-teal border-r-transparent",
          sizeClasses[size],
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
