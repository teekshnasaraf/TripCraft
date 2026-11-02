import type { HTMLAttributes } from "react";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "rectangular" | "circular";
  lines?: number;
}

export function Skeleton({
  variant = "text",
  lines = 1,
  className,
  ...props
}: SkeletonProps) {
  if (!Number.isInteger(lines) || lines < 1) {
    throw new RangeError("Skeleton lines must be a positive integer.");
  }

  const shapeClasses = {
    text: "h-4 rounded-control",
    rectangular: "min-h-24 rounded-card",
    circular: "size-12 rounded-full",
  };

  return (
    <div
      aria-hidden="true"
      className={["grid gap-3", className].filter(Boolean).join(" ")}
      {...props}
    >
      {Array.from({ length: lines }, (_, index) => (
        <span
          key={index}
          className={[
            "block animate-pulse bg-border",
            variant === "text" && index === lines - 1 && lines > 1
              ? "w-3/4"
              : "w-full",
            shapeClasses[variant],
          ]
            .filter(Boolean)
            .join(" ")}
        />
      ))}
    </div>
  );
}
