import { useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { AuthPageLayout } from "../components/AuthPageLayout";
import { PasswordField } from "../components/PasswordField";
import { useAuth } from "../hooks/useAuth";

interface RegisterValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}

type RegisterField = keyof RegisterValues;
type RegisterErrors = Partial<Record<RegisterField, string>>;

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState<RegisterValues>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: false,
  });
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionInProgress = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionInProgress.current) {
      return;
    }

    const nextErrors: RegisterErrors = {};

    if (!values.fullName.trim()) {
      nextErrors.fullName = "Enter your full name.";
    }
    if (!values.email.trim()) {
      nextErrors.email = "Enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (values.password.length < 8) {
      nextErrors.password = "Use at least 8 characters for your password.";
    }
    if (!values.confirmPassword) {
      nextErrors.confirmPassword = "Confirm your password.";
    } else if (values.confirmPassword !== values.password) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }
    if (!values.acceptedTerms) {
      nextErrors.acceptedTerms = "Accept the terms to continue.";
    }

    setErrors(nextErrors);
    setFormError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    submissionInProgress.current = true;
    setIsSubmitting(true);
    try {
      await register(
        values.fullName.trim(),
        values.email.trim(),
        values.password,
      );
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again.",
      );
    } finally {
      submissionInProgress.current = false;
      setIsSubmitting(false);
    }
  }

  function updateField(field: RegisterField, value: string | boolean) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      if (field === "password" || field === "confirmPassword") {
        delete next.password;
        delete next.confirmPassword;
      }
      return next;
    });
    setFormError("");
  }

  return (
    <AuthPageLayout
      title="Create your account"
      description="Set up your details to get ready for future trip planning."
    >
      <form className="grid gap-5" noValidate onSubmit={handleSubmit}>
        <Input
          id="register-full-name"
          label="Full name"
          autoComplete="name"
          placeholder="Your name"
          value={values.fullName}
          onChange={(event) => updateField("fullName", event.target.value)}
          required
          error={errors.fullName}
        />
        <Input
          id="register-email"
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={values.email}
          onChange={(event) => updateField("email", event.target.value)}
          required
          error={errors.email}
        />
        <PasswordField
          id="register-password"
          label="Password"
          value={values.password}
          onChange={(password) => updateField("password", password)}
          error={errors.password}
          autoComplete="new-password"
        />
        <PasswordField
          id="register-confirm-password"
          label="Confirm password"
          value={values.confirmPassword}
          onChange={(password) => updateField("confirmPassword", password)}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />
        <div>
          <label className="inline-flex items-start gap-2 text-small-label leading-relaxed text-primary-text">
            <input
              type="checkbox"
              checked={values.acceptedTerms}
              onChange={(event) =>
                updateField("acceptedTerms", event.target.checked)
              }
              aria-invalid={Boolean(errors.acceptedTerms)}
              aria-describedby={
                errors.acceptedTerms ? "terms-error" : undefined
              }
              className="mt-0.5 size-4 accent-secondary-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-teal focus-visible:ring-offset-2"
            />
            I agree to the Terms and Conditions (coming soon)
          </label>
          {errors.acceptedTerms && (
            <p
              id="terms-error"
              className="mt-2 text-caption font-medium text-error-text"
            >
              {errors.acceptedTerms}
            </p>
          )}
        </div>
        {formError && (
          <p
            role="alert"
            className="rounded-control border border-error/30 bg-error/5 p-3 text-small-label text-error-text"
          >
            {formError}
          </p>
        )}
        <Button type="submit" fullWidth loading={isSubmitting}>
          Create Account
        </Button>
        <p className="text-center text-small-label text-secondary-text">
          Already have an account?{" "}
          <Link
            to="/sign-in"
            className="font-semibold text-secondary-teal underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-teal"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthPageLayout>
  );
}
