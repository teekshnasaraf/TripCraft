import { useId, type InputHTMLAttributes, type ReactNode } from "react";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  helperText?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  id?: string;
}

export function Input({
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  id,
  className,
  required,
  disabled,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = helperText ? `${inputId}-helper` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [ariaDescribedBy, helperId, errorId]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className="grid gap-2">
      <label
        className="text-small-label font-semibold text-primary-text"
        htmlFor={inputId}
      >
        {label}
        {required && (
          <>
            <span aria-hidden="true" className="ml-1 text-error">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        )}
      </label>
      <span
        className={[
          "flex min-h-11 items-center gap-3 rounded-control border bg-surface px-3 transition-standard focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-main-background",
          error
            ? "border-error focus-within:ring-error"
            : "border-border focus-within:border-secondary-teal focus-within:ring-secondary-teal",
          disabled ? "cursor-not-allowed bg-main-background opacity-70" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {leftIcon && (
          <span
            aria-hidden="true"
            className="inline-flex shrink-0 text-secondary-text"
          >
            {leftIcon}
          </span>
        )}
        <input
          className={[
            "min-w-0 flex-1 border-0 bg-transparent py-2 text-body text-primary-text outline-none placeholder:text-secondary-text disabled:cursor-not-allowed",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          id={inputId}
          required={required}
          disabled={disabled}
          {...props}
          aria-invalid={error ? true : ariaInvalid}
          aria-describedby={describedBy}
        />
        {rightIcon && (
          <span
            aria-hidden="true"
            className="inline-flex shrink-0 text-secondary-text"
          >
            {rightIcon}
          </span>
        )}
      </span>
      {helperText && (
        <span id={helperId} className="text-caption text-secondary-text">
          {helperText}
        </span>
      )}
      {error && (
        <span id={errorId} className="text-caption font-medium text-error-text">
          {error}
        </span>
      )}
    </div>
  );
}
