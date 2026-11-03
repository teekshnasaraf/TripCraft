import { useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { AuthPageLayout } from "../components/AuthPageLayout";
import { PasswordField } from "../components/PasswordField";
import { useAuth } from "../hooks/useAuth";

interface SignInValues {
  email: string;
  password: string;
}

type SignInErrors = Partial<Record<"email" | "password", string>>;

export default function SignInPage() {
  const { login, error: authError } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState<SignInValues>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<SignInErrors>({});
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionInProgress = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionInProgress.current) {
      return;
    }

    const nextErrors: SignInErrors = {};

    if (!values.email.trim()) {
      nextErrors.email = "Enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!values.password) {
      nextErrors.password = "Enter your password.";
    }

    setErrors(nextErrors);
    setFormError("");
    setNotice("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    submissionInProgress.current = true;
    try {
      await login(values.email.trim(), values.password);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Sign-in is unavailable. Please try again later.",
      );
    } finally {
      submissionInProgress.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <AuthPageLayout
      title="Welcome back"
      description="Sign in to continue to your TripCraft account."
    >
      <form className="grid gap-5" noValidate onSubmit={handleSubmit}>
        <Input
          id="sign-in-email"
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={values.email}
          onChange={(event) =>
            setValues((current) => ({ ...current, email: event.target.value }))
          }
          required
          error={errors.email}
        />
        <PasswordField
          id="sign-in-password"
          label="Password"
          value={values.password}
          onChange={(password) =>
            setValues((current) => ({ ...current, password }))
          }
          error={errors.password}
          autoComplete="current-password"
        />
        <div className="flex flex-wrap items-center justify-end gap-3">
          <a
            href="#forgot-password"
            className="text-small-label font-semibold text-secondary-teal underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-teal"
            onClick={(event) => {
              event.preventDefault();
              setNotice("Password recovery is not available yet.")
            }}
          >
            Forgot password?
          </a>
        </div>
        {notice && (
          <p role="status" className="text-small-label text-secondary-text">
            {notice}
          </p>
        )}
        {authError && !formError && (
          <p role="alert" className="text-small-label text-error-text">
            {authError}
          </p>
        )}
        {formError && (
          <p
            role="alert"
            className="rounded-control border border-error/30 bg-error/5 p-3 text-small-label text-error-text"
          >
            {formError}
          </p>
        )}
        <Button type="submit" fullWidth loading={isSubmitting}>
          Sign In
        </Button>
        <p className="text-center text-small-label text-secondary-text">
          New to TripCraft?{" "}
          <Link
            to="/register"
            className="font-semibold text-secondary-teal underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-teal"
          >
            Create an account
          </Link>
        </p>
        <p className="text-center text-caption text-secondary-text">
          Your sign-in remains active for this browser tab only.
        </p>
      </form>
    </AuthPageLayout>
  );
}
