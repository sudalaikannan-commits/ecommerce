"use client";

import { useEffect, useRef } from "react";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * Split 6-digit OTP input with automatic focus advance, backspace
 * navigation and paste support (perfect for "one-time-code" flows).
 */
export function OtpInput({ value, onChange, length = 6, disabled, autoFocus }: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const handleChange = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return;
    const next = value.split("");
    for (let i = 0; i < digits.length && index + i < length; i++) {
      next[index + i] = digits[i];
    }
    onChange(next.join("").slice(0, length));
    const focusIndex = Math.min(index + digits.length, length - 1);
    refs.current[focusIndex]?.focus();
    refs.current[focusIndex]?.select();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = value.split("");
      if (next[index]) {
        next[index] = "";
        onChange(next.join(""));
      } else if (index > 0) {
        next[index - 1] = "";
        onChange(next.join(""));
        refs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      refs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      refs.current[index + 1]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          maxLength={length}
          autoComplete="one-time-code"
          aria-label={`Digit ${i + 1}`}
          disabled={disabled}
          value={value[i] || ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          className={`h-12 w-10 rounded-xl border text-center text-xl font-bold outline-none transition sm:h-14 sm:w-12 ${
            disabled
              ? "cursor-not-allowed bg-gray-100 text-gray-400"
              : value[i]
                ? "border-brand-400 bg-brand-50 text-brand-700"
                : "border-gray-300 bg-white text-gray-900"
          } focus:border-brand-500 focus:ring-2 focus:ring-brand-200`}
        />
      ))}
    </div>
  );
}
