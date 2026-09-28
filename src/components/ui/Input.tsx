// Copyright (c) 2026 QRslice. All rights reserved.
/**
 * QRslice UI Library — Input
 * Standard light-themed form input with error and hint states.
 */

import { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-bold text-slate-500 uppercase tracking-wider"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`
              w-full bg-white border rounded-xl px-3 py-2.5 text-xs text-slate-900
              placeholder-slate-400 transition-colors outline-none
              focus:border-brand focus:ring-1 focus:ring-brand-500/30
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-slate-300"}
              ${leftIcon ? "pl-9" : ""}
              ${rightIcon ? "pr-9" : ""}
              ${className}
            `}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-500 font-medium">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-slate-500">{hint}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

/**
 * Textarea variant
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-bold text-slate-500 uppercase tracking-wider"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={inputId}
          className={`
            w-full bg-white border rounded-xl px-3 py-2.5 text-xs text-slate-900
            placeholder-slate-400 transition-colors outline-none resize-none
            focus:border-brand focus:ring-1 focus:ring-brand-500/30
            disabled:opacity-50
            ${error ? "border-red-500" : "border-slate-300"}
            ${className}
          `}
          {...props}
        />

        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
