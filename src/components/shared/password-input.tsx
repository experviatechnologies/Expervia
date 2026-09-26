"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  /** Classes for the <input> itself — pass the same string the field used before. */
  className?: string;
  /** Classes for the relative wrapper. Put layout margins (e.g. mt-1.5) here. */
  wrapperClassName?: string;
};

/**
 * Password field with a show/hide toggle. Drop-in for a plain
 * `<input type="password">`: pass the same className. The eye button sits
 * inside the field on the right and the input gets right padding so the value
 * never runs under it. The toggle is tabIndex=-1 so keyboard users flow
 * straight from the field to the submit button, and its type="button" keeps it
 * from submitting the form.
 */
export function PasswordInput({
  className = "",
  wrapperClassName = "",
  ...props
}: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className={`relative ${wrapperClassName}`}>
      <input
        {...props}
        type={show ? "text" : "password"}
        className={`${className} pr-11`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-neutral-400 transition-colors hover:text-neutral-200"
      >
        {show ? (
          <EyeOff className="size-[18px]" aria-hidden="true" />
        ) : (
          <Eye className="size-[18px]" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
