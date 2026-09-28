// Copyright (c) 2026 QRslice. All rights reserved.
import { Skeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-stone-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-2xl" />
        </div>
        <TableSkeleton rows={6} />
      </div>
    </main>
  );
}
