"use client";

import { useFormStatus } from "react-dom";
import { buttonClass } from "./button";

/** Submit button for any <form action>. Shows a pending label and blocks double taps. */
export function SubmitButton({
  label,
  pendingLabel,
  variant = "primary",
  className = "",
}: {
  label: string;
  pendingLabel: string;
  variant?: "primary" | "danger" | "secondary";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={buttonClass(variant, className)}
      disabled={pending}
      aria-disabled={pending}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
