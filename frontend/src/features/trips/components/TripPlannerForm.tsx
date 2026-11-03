import { useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";

const travelPreferences = [
  "Adventure",
  "Relaxation",
  "Culture and history",
  "Food",
  "Nature",
  "Shopping",
  "Nightlife",
  "Sightseeing",
];

const accommodationOptions = ["Budget", "Standard", "Premium", "Luxury"];
const tripStyles = [
  "Budget Explorer",
  "Balanced Experience",
  "Premium Experience",
];

interface TripPlannerValues {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  adults: string;
  children: string;
  budget: string;
  preferences: string[];
  accommodation: string;
  tripStyle: string;
}

type PlannerField = keyof TripPlannerValues;
type PlannerErrors = Partial<Record<PlannerField, string>>;

const initialValues: TripPlannerValues = {
  origin: "",
  destination: "",
  departureDate: "",
  returnDate: "",
  adults: "1",
  children: "0",
  budget: "",
  preferences: [],
  accommodation: "Standard",
  tripStyle: "Balanced Experience",
};

function validate(values: TripPlannerValues): PlannerErrors {
  const errors: PlannerErrors = {};

  if (!values.origin.trim()) {
    errors.origin = "Enter your starting location.";
  }
  if (!values.destination.trim()) {
    errors.destination = "Enter a destination.";
  } else if (
    values.origin.trim() &&
    values.origin.trim().localeCompare(values.destination.trim(), undefined, {
      sensitivity: "accent",
    }) === 0
  ) {
    errors.destination = "Choose a destination different from your starting location.";
  }
  if (!values.departureDate) {
    errors.departureDate = "Choose a departure date.";
  }
  if (!values.returnDate) {
    errors.returnDate = "Choose a return date.";
  } else if (
    values.departureDate &&
    values.returnDate < values.departureDate
  ) {
    errors.returnDate = "Return date must be on or after departure.";
  }

  const adults = Number(values.adults);
  if (!Number.isInteger(adults) || adults < 1) {
    errors.adults = "Enter at least one adult traveller.";
  }

  const children = Number(values.children);
  if (!Number.isInteger(children) || children < 0) {
    errors.children = "Enter zero or more children.";
  }

  const budget = Number(values.budget);
  if (!values.budget.trim() || !Number.isFinite(budget) || budget <= 0) {
    errors.budget = "Enter a total trip budget greater than ₹0.";
  }

  return errors;
}

export function TripPlannerForm() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<PlannerErrors>({});
  const [submissionMessage, setSubmissionMessage] = useState("");

  function updateField(field: PlannerField, value: string | string[]) {
    setValues((current) => ({ ...current, [field]: value }));
    setSubmissionMessage("");
    setErrors((current) => {
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
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setSubmissionMessage("");

    if (Object.keys(nextErrors).length === 0) {
      setSubmissionMessage(
        "Your preferences are valid. Trip creation and live search are not connected yet; no trip was saved and no travel availability was checked.",
      );
    }
  }

  function togglePreference(preference: string) {
    const next = values.preferences.includes(preference)
      ? values.preferences.filter((item) => item !== preference)
      : [...values.preferences, preference];
    updateField("preferences", next);
  }

  return (
    <form className="grid gap-6" noValidate onSubmit={handleSubmit}>
      <Card
        header={
          <h2 className="text-subheading font-semibold text-primary-dark">
            Destination
          </h2>
        }
      >
        <div className="grid gap-5 tablet:grid-cols-2">
          <Input
            id="planner-origin"
            label="Starting location"
            placeholder="City or airport"
            value={values.origin}
            onChange={(event) => updateField("origin", event.target.value)}
            required
            error={errors.origin}
          />
          <Input
            id="planner-destination"
            label="Destination"
            placeholder="Where would you like to go?"
            value={values.destination}
            onChange={(event) =>
              updateField("destination", event.target.value)
            }
            required
            error={errors.destination}
          />
        </div>
      </Card>

      <Card
        header={
          <h2 className="text-subheading font-semibold text-primary-dark">
            Travel dates
          </h2>
        }
      >
        <div className="grid gap-5 tablet:grid-cols-2">
          <Input
            id="planner-departure"
            label="Departure date"
            type="date"
            value={values.departureDate}
            onChange={(event) =>
              updateField("departureDate", event.target.value)
            }
            required
            error={errors.departureDate}
          />
          <Input
            id="planner-return"
            label="Return date"
            type="date"
            min={values.departureDate || undefined}
            value={values.returnDate}
            onChange={(event) => updateField("returnDate", event.target.value)}
            required
            error={errors.returnDate}
          />
        </div>
      </Card>

      <Card
        header={
          <h2 className="text-subheading font-semibold text-primary-dark">
            Travellers and budget
          </h2>
        }
      >
        <div className="grid gap-5 tablet:grid-cols-3">
          <Input
            id="planner-adults"
            label="Adults"
            type="number"
            min="1"
            step="1"
            value={values.adults}
            onChange={(event) => updateField("adults", event.target.value)}
            required
            error={errors.adults}
          />
          <Input
            id="planner-children"
            label="Children"
            type="number"
            min="0"
            step="1"
            value={values.children}
            onChange={(event) => updateField("children", event.target.value)}
            error={errors.children}
          />
          <Input
            id="planner-budget"
            label="Total trip budget (INR)"
            type="number"
            min="1"
            step="0.01"
            inputMode="decimal"
            placeholder="e.g. 50000"
            value={values.budget}
            onChange={(event) => updateField("budget", event.target.value)}
            required
            error={errors.budget}
            helperText="Total budget for the entire trip, not per traveller or per day."
          />
        </div>
      </Card>

      <Card
        header={
          <div>
            <h2
              id="planner-preferences-heading"
              className="text-subheading font-semibold text-primary-dark"
            >
              Travel preferences
            </h2>
            <p className="mt-1 text-small-label text-secondary-text">
              Choose any interests you would like to include.
            </p>
          </div>
        }
      >
        <fieldset aria-labelledby="planner-preferences-heading">
          <legend className="sr-only">Travel preferences</legend>
          <div className="grid gap-3 sm:grid-cols-2 tablet:grid-cols-4">
            {travelPreferences.map((preference) => (
              <label
                key={preference}
                className="flex min-h-11 items-center gap-2 rounded-control border border-border px-3 text-small-label text-primary-text focus-within:ring-2 focus-within:ring-secondary-teal"
              >
                <input
                  type="checkbox"
                  checked={values.preferences.includes(preference)}
                  onChange={() => togglePreference(preference)}
                  className="size-4 accent-secondary-teal"
                />
                {preference}
              </label>
            ))}
          </div>
        </fieldset>
      </Card>

      <Card
        header={
          <h2
            id="planner-accommodation-heading"
            className="text-subheading font-semibold text-primary-dark"
          >
            Accommodation
          </h2>
        }
      >
        <fieldset aria-labelledby="planner-accommodation-heading">
          <legend className="sr-only">Accommodation preference</legend>
          <div className="grid gap-3 sm:grid-cols-2 tablet:grid-cols-4">
            {accommodationOptions.map((option) => (
              <label
                key={option}
                className="flex min-h-11 items-center gap-2 rounded-control border border-border px-3 text-small-label text-primary-text focus-within:ring-2 focus-within:ring-secondary-teal"
              >
                <input
                  type="radio"
                  name="accommodation"
                  value={option}
                  checked={values.accommodation === option}
                  onChange={() => updateField("accommodation", option)}
                  className="size-4 accent-secondary-teal"
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>
      </Card>

      <Card
        header={
          <div>
            <h2
              id="planner-style-heading"
              className="text-subheading font-semibold text-primary-dark"
            >
              Trip style
            </h2>
            <p className="mt-1 text-small-label text-secondary-text">
              Choose a planning preference. Recommendations are not connected
              yet.
            </p>
          </div>
        }
      >
        <fieldset aria-labelledby="planner-style-heading">
          <legend className="sr-only">Trip style</legend>
          <div className="grid gap-3 tablet:grid-cols-3">
            {tripStyles.map((style) => (
              <label
                key={style}
                className="flex min-h-12 items-center gap-2 rounded-control border border-border px-3 text-small-label font-semibold text-primary-text focus-within:ring-2 focus-within:ring-secondary-teal"
              >
                <input
                  type="radio"
                  name="trip-style"
                  value={style}
                  checked={values.tripStyle === style}
                  onChange={() => updateField("tripStyle", style)}
                  className="size-4 accent-secondary-teal"
                />
                {style}
              </label>
            ))}
          </div>
        </fieldset>
      </Card>

      {submissionMessage && (
        <p
          role="status"
          className="rounded-control border border-secondary-teal/30 bg-mint-background p-4 text-small-label leading-relaxed text-primary-dark"
        >
          {submissionMessage}
        </p>
      )}
      <Button type="submit" size="large" fullWidth>
        Create Trip
      </Button>
    </form>
  );
}
