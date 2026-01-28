"use client";

import { ButtonHTMLAttributes } from "react";

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  loading?: boolean;
  variant?: "primary" | "secondary";
}

export function AuthButton({
  children,
  loading = false,
  variant = "primary",
  disabled,
  ...props
}: AuthButtonProps) {
  const baseStyles =
    "w-full py-3 px-4 rounded-lg font-titulo text-base font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-verde-musgo text-off-white hover:bg-verde-musgo-light active:scale-[0.98]",
    secondary:
      "bg-marrom border border-marrom-light text-off-white hover:bg-marrom-light active:scale-[0.98]",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Aguarde...
        </>
      ) : (
        children
      )}
    </button>
  );
}
