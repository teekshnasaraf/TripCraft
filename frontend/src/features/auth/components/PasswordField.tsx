import { useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";

interface PasswordFieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete: string;
  required?: boolean;
}

export function PasswordField({
  label,
  id,
  value,
  onChange,
  error,
  autoComplete,
  required = true,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
      <Input
        id={id}
        label={label}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        required={required}
        error={error}
      />
      <Button
        type="button"
        variant="outline"
        size="small"
        aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? "Hide" : "Show"}
      </Button>
    </div>
  );
}
