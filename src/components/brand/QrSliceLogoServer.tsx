// Copyright (c) 2026 QRslice. All rights reserved.
import React from "react";
import Image from "next/image";

export interface QrSliceLogoServerProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon" | "wordmark";
  inverted?: boolean;
  priority?: boolean;
}

const logoDimensions = {
  sm: { w: 72, h: 24, hClass: "h-6" },
  md: { w: 96, h: 32, hClass: "h-8" },
  lg: { w: 120, h: 40, hClass: "h-10" },
  xl: { w: 144, h: 48, hClass: "h-12" },
};

const iconDimensions = {
  sm: { w: 24, h: 24, class: "w-6 h-6" },
  md: { w: 32, h: 32, class: "w-8 h-8" },
  lg: { w: 40, h: 40, class: "w-10 h-10" },
  xl: { w: 48, h: 48, class: "w-12 h-12" },
};

/**
 * QRslice Icon - Server-compatible version
 */
export function QrSliceIconServer({
  className = "w-8 h-8",
  size = "md",
  inverted = false,
  priority = false,
}: {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  inverted?: boolean;
  priority?: boolean;
}) {
  const dim = iconDimensions[size] || iconDimensions.md;

  return (
    <Image
      src="/favicon.png"
      alt="QRslice"
      width={dim.w}
      height={dim.h}
      priority={priority}
      className={`object-contain rounded-xl select-none ${dim.class} ${inverted ? "brightness-110 drop-shadow-sm" : ""} ${className}`}
    />
  );
}

/**
 * QRslice Wordmark - Server-compatible version
 */
export function QrSliceWordmarkServer({
  className = "",
  size = "md",
  inverted = false,
}: {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  inverted?: boolean;
}) {
  const sizeClasses = {
    sm: "text-base tracking-tight",
    md: "text-lg tracking-tight",
    lg: "text-xl tracking-tight",
    xl: "text-2xl tracking-tight",
  };

  const textColor = inverted ? "text-white" : "text-slate-900";
  const accentColor = inverted ? "text-[#8B5CF6]" : "text-[#5738F5]";

  return (
    <span
      className={`font-black select-none ${sizeClasses[size] || sizeClasses.md} ${textColor} ${className}`}
      role="img"
      aria-label="QRslice"
    >
      QR<span className={accentColor}>slice</span>
    </span>
  );
}

/**
 * QRslice Full Logo - Server-compatible version
 */
export function QrSliceLogoServer({
  className = "",
  size = "md",
  variant = "full",
  inverted = false,
  priority = false,
}: QrSliceLogoServerProps) {
  if (variant === "icon") {
    return <QrSliceIconServer size={size} className={className} inverted={inverted} priority={priority} />;
  }

  if (variant === "wordmark") {
    return <QrSliceWordmarkServer size={size} className={className} inverted={inverted} />;
  }

  const dim = logoDimensions[size] || logoDimensions.md;

  return (
    <div className={`inline-flex items-center select-none ${className}`} role="img" aria-label="QRslice">
      <Image
        src="/logo.png"
        alt="QRslice"
        width={dim.w}
        height={dim.h}
        priority={priority}
        className={`object-contain w-auto ${dim.hClass} ${inverted ? "filter brightness-0 invert" : ""}`}
      />
    </div>
  );
}
