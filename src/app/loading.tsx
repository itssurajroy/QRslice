// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { QrSliceLogo } from "@/components/brand/QrSliceLogo";
import { Skeleton } from "@/components/ui/Skeleton";
import { useEffect, useState } from "react";

export default function GlobalLoading() {
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    // Only show the spinner if loading takes more than 300ms to prevent flashing on fast navigations
    const timer = setTimeout(() => setShowSpinner(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-stone-950 animate-in fade-in duration-300">
      <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-sm px-6">
        <div className="animate-pulse scale-125">
          <QrSliceLogo size="lg" />
        </div>
        
        {/* Skeleton UI blocks simulating the UI structure */}
        <div className="w-full space-y-4 opacity-75">
          <Skeleton className="h-24 w-full rounded-3xl" />
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        </div>

        {/* Fallback subtle spinner for slow networks */}
        <div className={`mt-6 transition-opacity duration-500 ${showSpinner ? "opacity-100" : "opacity-0"}`}>
          <div className="w-6 h-6 border-2 border-brand/30 border-t-brand rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 dark:text-stone-500 mt-2 font-medium text-center">Syncing...</p>
        </div>
      </div>
    </div>
  );
}
