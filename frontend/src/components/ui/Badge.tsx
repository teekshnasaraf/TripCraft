import type { HTMLAttributes, ReactNode } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "information" | "featured";
  children: ReactNode;
}

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-main-background text-primary-text",
  success: "bg-success/10 text-success-text",
  warning: "bg-warning/15 text-warning-text",
  error: "bg-error/10 text-error-text",
  information: "bg-mint-background text-secondary-teal",
  featured: "bg-primary-dark text-surface",
};

export function Badge({
  variant = "default",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex min-h-6 items-center rounded-badge px-2.5 py-1 text-caption font-semibold",
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}
