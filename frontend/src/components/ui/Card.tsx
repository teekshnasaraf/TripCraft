import type {
  AnchorHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from "react";

interface CardBaseProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  variant?: "default" | "elevated";
  padding?: "small" | "medium" | "large";
  className?: string;
}

type StaticCardProps = CardBaseProps &
  Omit<HTMLAttributes<HTMLDivElement>, "className" | "children">;

type InteractiveCardProps = CardBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children"> & {
    href: string;
    interactive?: true;
  };

export type CardProps = StaticCardProps | InteractiveCardProps;

const paddingClasses: Record<
  NonNullable<CardBaseProps["padding"]>,
  string
> = {
  small: "p-4",
  medium: "p-5 tablet:p-6",
  large: "p-6 tablet:p-8",
};

function cardClasses(
  variant: NonNullable<CardBaseProps["variant"]>,
  padding: NonNullable<CardBaseProps["padding"]>,
  interactive: boolean,
  className?: string,
) {
  return [
    "overflow-hidden rounded-card border border-border bg-surface",
    variant === "elevated" ? "shadow-card" : "shadow-subtle",
    paddingClasses[padding],
    interactive
      ? "block no-underline transition-standard hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-teal focus-visible:ring-offset-2"
      : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

function CardContent({
  children,
  header,
  footer,
}: Pick<CardBaseProps, "children" | "header" | "footer">) {
  return (
    <>
      {header && (
        <header className="mb-4 border-b border-border pb-4">
          {header}
        </header>
      )}
      <div>{children}</div>
      {footer && (
        <footer className="mt-4 border-t border-border pt-4">{footer}</footer>
      )}
    </>
  );
}

export function Card(props: CardProps) {
  if ("href" in props) {
    const {
      href,
      children,
      header,
      footer,
      variant = "default",
      padding = "medium",
      className,
      interactive: isInteractive = true,
      ...anchorProps
    } = props;

    return (
      <a
        {...anchorProps}
        href={href}
        className={cardClasses(variant, padding, isInteractive, className)}
      >
        <CardContent header={header} footer={footer}>
          {children}
        </CardContent>
      </a>
    );
  }

  const {
    children,
    header,
    footer,
    variant = "default",
    padding = "medium",
    className,
    ...divProps
  } = props;

  return (
    <div
      {...divProps}
      className={cardClasses(variant, padding, false, className)}
    >
      <CardContent header={header} footer={footer}>
        {children}
      </CardContent>
    </div>
  );
}
