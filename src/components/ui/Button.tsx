// Copyright (c) 2026 QRslice. All rights reserved.
/**
 * QRslice UI Library — Button
 * Reusable button replacing all inline indigo/slate button Tailwind classes.
 */

import { forwardRef } from "react";
import { Spinner } from "./Spinner";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger" | "outline" | "success";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const BASE =
  "inline-flex items-center justify-center gap-2 font-black rounded-xl transition-all active:scale-95 cursor-pointer touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

const VARIANTS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-md shadow-brand/25",
  ghost:
    "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200",
  danger:
    "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200",
  outline:
    "bg-transparent hover:bg-slate-100 text-slate-700 border border-slate-300",
  success:
    "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200",
};

const SIZES: Record<NonNullable<ButtonProps["size"]>, string> = {
  xs: "px-2.5 py-1 text-xs",
  sm: "px-3.5 py-1.5 text-xs",
  md: "px-4 py-2.5 text-xs",
  lg: "px-6 py-3.5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      className = "",
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
        {...props}
      >
        {loading ? (
          <Spinner size="sm" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  },
);

Button.displayName = "Button";
