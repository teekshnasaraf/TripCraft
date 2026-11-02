import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "small" | "medium" | "large";
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-primary-dark text-surface hover:bg-secondary-teal focus-visible:ring-primary-teal",
  secondary:
    "bg-mint-background text-primary-dark hover:bg-mint-background/70 focus-visible:ring-secondary-teal",
  outline:
    "border border-border bg-surface text-primary-dark hover:bg-main-background focus-visible:ring-secondary-teal",
  ghost:
    "text-secondary-teal hover:bg-mint-background/60 focus-visible:ring-secondary-teal",
  danger:
    "bg-error text-surface hover:bg-error/90 focus-visible:ring-error",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  small: "min-h-9 gap-1.5 px-3 text-small-label",
  medium: "min-h-11 gap-2 px-4 text-body",
  large: "min-h-12 gap-2.5 px-5 text-subheading",
};

export function Button({
  variant = "primary",
  size = "medium",
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const classes = [
    "inline-flex items-center justify-center rounded-control font-semibold transition-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-main-background disabled:cursor-not-allowed disabled:opacity-60",
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={classes}
      type={type}
      disabled={disabled || loading}
      {...props}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      ) : (
        leftIcon && (
          <span aria-hidden="true" className="inline-flex shrink-0">
            {leftIcon}
          </span>
        )
      )}
      {children}
      {!loading && rightIcon && (
        <span aria-hidden="true" className="inline-flex shrink-0">
          {rightIcon}
        </span>
      )}
    </button>
  );
}
