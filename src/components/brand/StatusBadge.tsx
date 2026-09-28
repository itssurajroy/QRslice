// Copyright (c) 2026 QRslice. All rights reserved.
import React from "react";

export type OrderStatusType =
  | "new"
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "served"
  | "completed"
  | "cancelled"
  | "rejected";

export type TableStatusType =
  | "available"
  | "occupied"
  | "ordering"
  | "needs_attention";

export type PaymentStatusType =
  | "unpaid"
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

interface StatusBadgeProps {
  status: string;
  type?: "order" | "table" | "payment" | "kitchen";
  size?: "sm" | "md" | "lg";
  className?: string;
  pulse?: boolean;
}

export function StatusBadge({
  status,
  type = "order",
  size = "md",
  className = "",
  pulse = false,
}: StatusBadgeProps) {
  const norm = (status || "").toLowerCase().replace(/\s+/g, "_");

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  // Semantic styles adhering strictly to the brand & operational palette
  let badgeStyle = "bg-slate-100 text-slate-700 border-slate-200";
  let label = status.toUpperCase();

  if (type === "order" || type === "kitchen") {
    switch (norm) {
      case "new":
      case "pending":
        badgeStyle = "bg-[#EEEAFE] text-[#5738F5] border-[#5738F5]/30 font-semibold";
        label = "NEW";
        break;
      case "confirmed":
        badgeStyle = "bg-blue-50 text-blue-700 border-blue-200";
        label = "CONFIRMED";
        break;
      case "preparing":
        badgeStyle = "bg-amber-50 text-amber-800 border-amber-200";
        label = "PREPARING";
        break;
      case "ready":
        badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-300";
        label = "READY";
        break;
      case "served":
      case "completed":
        badgeStyle = "bg-slate-900 text-white border-slate-900";
        label = "SERVED";
        break;
      case "cancelled":
      case "rejected":
        badgeStyle = "bg-rose-50 text-rose-700 border-rose-200";
        label = "CANCELLED";
        break;
    }
  } else if (type === "table") {
    switch (norm) {
      case "available":
        badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
        label = "AVAILABLE";
        break;
      case "occupied":
        badgeStyle = "bg-brand-lavender text-brand-dark border-indigo-200";
        label = "OCCUPIED";
        break;
      case "ordering":
        badgeStyle = "bg-purple-50 text-purple-700 border-purple-200";
        label = "ORDERING";
        break;
      case "needs_attention":
        badgeStyle = "bg-amber-50 text-amber-800 border-amber-300";
        label = "NEEDS ATTENTION";
        break;
    }
  } else if (type === "payment") {
    switch (norm) {
      case "paid":
        badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
        label = "PAID";
        break;
      case "unpaid":
      case "pending":
        badgeStyle = "bg-amber-50 text-amber-800 border-amber-200";
        label = "PENDING";
        break;
      case "failed":
        badgeStyle = "bg-rose-50 text-rose-700 border-rose-200";
        label = "FAILED";
        break;
      case "refunded":
        badgeStyle = "bg-slate-100 text-slate-700 border-slate-300";
        label = "REFUNDED";
        break;
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-mono font-bold uppercase tracking-wider ${sizeClasses[size]} ${badgeStyle} ${className}`}
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
        </span>
      )}
      {label}
    </span>
  );
}

