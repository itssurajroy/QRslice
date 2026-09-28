// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useEffect, useState } from "react";
import { useOfflineQueue } from "@/lib/offline-queue";
import { WifiIcon, RefreshCwIcon, AlertTriangleIcon } from "@/components/Icons";

export default function OfflineQueueStatus() {
  const { pendingCount, isProcessing, lastSync, process, refresh } = useOfflineQueue();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!pendingCount && isOnline) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold shadow-lg transition-all ${
        isOnline
          ? pendingCount > 0
            ? "bg-amber-500 text-white"
            : "bg-emerald-500 text-white"
          : "bg-rose-500 text-white animate-pulse"
      }`}
    >
      {!isOnline && <WifiIcon className="w-4 h-4" />}
      {pendingCount > 0 && (
        <>
          <AlertTriangleIcon className="w-4 h-4" />
          <span>{pendingCount} order{pendingCount > 1 ? "s" : ""} queued</span>
        </>
      )}
      {isOnline && pendingCount === 0 && <span>All synced</span>}

      {pendingCount > 0 && !isProcessing && (
        <button
          onClick={process}
          className="ml-1 px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded text-[10px] uppercase"
        >
          Sync Now
        </button>
      )}

      {isProcessing && <RefreshCwIcon className="w-4 h-4 animate-spin" />}

      {lastSync && (
        <span className="ml-1 opacity-70">
          Last: {new Date(lastSync).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
