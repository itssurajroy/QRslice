// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useState } from "react";

type FormConsentProps = {
  label?: string;
  required?: boolean;
  onChange?: (checked: boolean) => void;
};

export function FormConsent({
  label = "I agree to the Terms and Conditions and Privacy Policy",
  required = false,
  onChange,
}: FormConsentProps) {
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setChecked(val);
    setError(false);
    onChange?.(val);
  };

  return (
    <div>
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          required={required}
          aria-invalid={error}
          aria-describedby={error ? "consent-error" : undefined}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand"
        />
        <span className="text-sm text-slate-600">{label}</span>
      </label>
      {error && (
        <p id="consent-error" className="mt-1 text-xs text-red-600" role="alert">
          You must agree before submitting.
        </p>
      )}
    </div>
  );
}

