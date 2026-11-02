import type { HTMLAttributes, ReactNode } from "react";

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "small" | "medium" | "large" | "wide" | "full";
  children: ReactNode;
}

const sizeClasses: Record<NonNullable<ContainerProps["size"]>, string> = {
  small: "max-w-content-sm",
  medium: "max-w-content-md",
  large: "max-w-content-lg",
  wide: "max-w-content",
  full: "max-w-none",
};

export function Container({
  size = "wide",
  className,
  children,
  ...props
}: ContainerProps) {
  return (
    <div
      className={[
        "mx-auto w-full px-page-gutter",
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
