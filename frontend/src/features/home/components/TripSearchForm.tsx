import { CalendarDays, MapPin, Search, Users, Wallet } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";

interface TripSearchValues {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  travellers: string;
  budget: string;
}

type TripSearchField = keyof TripSearchValues;
type TripSearchErrors = Partial<Record<TripSearchField, string>>;

const initialValues: TripSearchValues = {
  origin: "",
  destination: "",
  departureDate: "",
  returnDate: "",
  travellers: "1",
  budget: "",
};

function validateTrip(values: TripSearchValues): TripSearchErrors {
  const errors: TripSearchErrors = {};

  for (const field of [
    "origin",
    "destination",
    "departureDate",
    "returnDate",
    "travellers",
    "budget",
  ] as const) {
    if (!values[field].trim()) {
      errors[field] = "This field is required.";
    }
  }

  if (
    values.origin.trim() &&
    values.destination.trim() &&
    values.origin.trim().localeCompare(values.destination.trim(), undefined, {
      sensitivity: "accent",
    }) === 0
  ) {
    errors.destination = "Choose a destination different from your origin.";
  }

  if (
    values.departureDate &&
    values.returnDate &&
    values.returnDate < values.departureDate
  ) {
    errors.returnDate = "Return date must be on or after departure.";
  }

  const travellers = Number(values.travellers);
  if (values.travellers.trim() && (!Number.isInteger(travellers) || travellers < 1)) {
    errors.travellers = "Enter at least one traveller.";
  }

  const budget = Number(values.budget);
  if (values.budget.trim() && (!Number.isFinite(budget) || budget <= 0)) {
    errors.budget = "Enter a budget greater than zero.";
  }

  return errors;
}

export function TripSearchForm() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<TripSearchErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState("");

  function updateField(field: TripSearchField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setSubmitted(false);
    setSubmissionMessage("");
    setErrors((current) => {
      if (!(field in current)) {
        return current;
      }

      const next = { ...current };
      delete next[field];

      if (field === "origin" || field === "destination") {
        delete next.origin;
        delete next.destination;
      }
      if (field === "departureDate" || field === "returnDate") {
        delete next.departureDate;
        delete next.returnDate;
      }

      return next;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateTrip(values);
    setErrors(nextErrors);
    setSubmitted(false);

    if (Object.keys(nextErrors).length > 0) {
      setSubmissionMessage("Review the highlighted fields to continue.");
      return;
    }

    setSubmitted(true);
    setSubmissionMessage(
      "Trip planning is coming soon. Your details are still here, ready for when planning tools launch.",
    );
  }

  return (
    <section
      id="trip-search"
      className="relative z-[1] -mt-8 scroll-mt-24 px-page-gutter tablet:-mt-12"
      aria-labelledby="trip-search-heading"
    >
      <div className="mx-auto max-w-content rounded-card border border-border bg-surface p-5 shadow-card tablet:p-8">
        <div className="mb-6 flex flex-col gap-2 tablet:flex-row tablet:items-end tablet:justify-between">
          <div>
            <p className="text-small-label font-semibold uppercase tracking-wide text-secondary-teal">
              Start with the essentials
            </p>
            <h2
              id="trip-search-heading"
              className="mt-1 text-section-heading font-bold text-primary-text"
            >
              Where will you go?
            </h2>
          </div>
          <p className="max-w-content-sm text-small-label text-secondary-text">
            Planning is a preview for now. Your details stay in this form.
          </p>
        </div>

        <form noValidate onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2 tablet:grid-cols-3">
            <Input
              label="Origin"
              placeholder="City you’re leaving from"
              autoComplete="address-level2"
              required
              value={values.origin}
              error={errors.origin}
              leftIcon={<MapPin aria-hidden="true" className="size-4" />}
              onChange={(event) => updateField("origin", event.target.value)}
            />
            <Input
              label="Destination"
              placeholder="Where do you want to go?"
              required
              value={values.destination}
              error={errors.destination}
              leftIcon={<MapPin aria-hidden="true" className="size-4" />}
              onChange={(event) =>
                updateField("destination", event.target.value)
              }
            />
            <Input
              label="Departure date"
              type="date"
              required
              value={values.departureDate}
              error={errors.departureDate}
              leftIcon={<CalendarDays aria-hidden="true" className="size-4" />}
              onChange={(event) =>
                updateField("departureDate", event.target.value)
              }
            />
            <Input
              label="Return date"
              type="date"
              min={values.departureDate || undefined}
              required
              value={values.returnDate}
              error={errors.returnDate}
              leftIcon={<CalendarDays aria-hidden="true" className="size-4" />}
              onChange={(event) =>
                updateField("returnDate", event.target.value)
              }
            />
            <Input
              label="Travellers"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              required
              value={values.travellers}
              error={errors.travellers}
              leftIcon={<Users aria-hidden="true" className="size-4" />}
              onChange={(event) =>
                updateField("travellers", event.target.value)
              }
            />
            <Input
              label="Total budget"
              type="number"
              min="0.01"
              step="any"
              inputMode="decimal"
              placeholder="Enter your budget"
              helperText="Currency selection will be available when planning tools launch."
              required
              value={values.budget}
              error={errors.budget}
              leftIcon={<Wallet aria-hidden="true" className="size-4" />}
              onChange={(event) => updateField("budget", event.target.value)}
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="submit"
              size="large"
              leftIcon={<Search aria-hidden="true" className="size-4" />}
              className="w-full sm:w-auto"
            >
              Find my trip
            </Button>
            <p
              className="text-small-label text-secondary-text"
              role={submitted ? "status" : "alert"}
              aria-live={submitted ? "polite" : "assertive"}
            >
              {submissionMessage}
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
