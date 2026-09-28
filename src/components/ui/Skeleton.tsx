// Copyright (c) 2026 QRslice. All rights reserved.
import React from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`skeleton ${className}`}
      aria-hidden="true"
    />
  );
}

export function MenuItemSkeleton() {
  return (
    <div className="bg-white dark:bg-stone-900 border border-[#E7E4F0] dark:border-stone-800 rounded-3xl p-4 space-y-4 shadow-sm">
      <Skeleton className="w-full h-40 rounded-2xl" />
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Skeleton className="w-2/3 h-6 rounded-xl" />
          <Skeleton className="w-16 h-6 rounded-xl" />
        </div>
        <Skeleton className="w-full h-4 rounded-lg" />
        <Skeleton className="w-4/5 h-4 rounded-lg" />
      </div>
      <div className="pt-2 flex justify-between items-center">
        <Skeleton className="w-20 h-5 rounded-full" />
        <Skeleton className="w-24 h-10 rounded-2xl" />
      </div>
    </div>
  );
}

export function CategorySkeleton() {
  return (
    <div className="flex space-x-2 overflow-x-auto py-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-10 w-28 shrink-0 rounded-2xl" />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full rounded-2xl" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-3 border border-slate-100 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-900">
          <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3 rounded-md" />
            <Skeleton className="h-3 w-1/2 rounded-md" />
          </div>
          <Skeleton className="h-8 w-20 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export function KdsCardSkeleton() {
  return (
    <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-[#E7E4F0] dark:border-stone-800 space-y-4 shadow-sm">
      <div className="flex justify-between items-center">
        <Skeleton className="w-20 h-7 rounded-xl" />
        <Skeleton className="w-16 h-5 rounded-full" />
      </div>
      <div className="space-y-2 pt-2">
        <Skeleton className="w-full h-5 rounded-lg" />
        <Skeleton className="w-3/4 h-5 rounded-lg" />
      </div>
      <div className="pt-4 flex justify-between">
        <Skeleton className="w-24 h-9 rounded-2xl" />
        <Skeleton className="w-24 h-9 rounded-2xl" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-[#E7E4F0] dark:border-stone-800 space-y-3 shadow-xs">
            <Skeleton className="w-10 h-10 rounded-2xl" />
            <Skeleton className="w-24 h-8 rounded-xl" />
            <Skeleton className="w-32 h-4 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Pipeline skeleton */}
      <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-[#E7E4F0] dark:border-stone-800 space-y-4 shadow-xs">
        <Skeleton className="w-48 h-6 rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>

      {/* 2 column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    </div>
  );
}
