// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  try {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true
    );
  } catch {
    return false;
  }
}

export function PWAInstall() {
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [busy, setBusy] = useState(false);
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    setReady(true);

    const onBeforeInstall = (e: Event) => {
      try {
        e.preventDefault();
        deferredRef.current = e as BeforeInstallPromptEvent;
        setCanInstall(true);
      } catch {
        // Failure-silent: install UI simply stays in marketing mode.
      }
    };
    const onInstalled = () => {
      try {
        deferredRef.current = null;
        setCanInstall(false);
        setInstalled(true);
      } catch {
        // Failure-silent.
      }
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    const deferred = deferredRef.current;
    if (!deferred || busy) return;
    setBusy(true);
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      // eslint-disable-next-line no-console
      console.info(`[pwa] install prompt outcome: ${choice.outcome}`);
      if (choice.outcome === "accepted") {
        deferredRef.current = null;
        setCanInstall(false);
        setInstalled(true);
      }
    } catch {
      // Failure-silent: keep the install UI visible for retry.
    } finally {
      setBusy(false);
    }
  }, [busy]);

  // No layout shift when hidden: render nothing until the client-side
  // installed check runs, and nothing once installed or dismissed.
  if (!ready || installed || dismissed) return null;

  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="overflow-hidden rounded-2xl bg-slate-900">
          <div className="relative px-6 py-12 sm:px-12 sm:py-16">
            {/* Background glow */}
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-lavender0/20 blur-3xl"
              aria-hidden="true"
            />

            <button
              type="button"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss install prompt"
              className="absolute right-4 top-4 rounded-full p-2 text-slate-500 transition-colors hover:bg-white/10 hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="relative flex flex-col items-center text-center">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/25">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Install as an app
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-slate-400">
                Add QRslice to your home screen for a native app experience.
                Fast, installable, always one tap away.
              </p>

              {canInstall ? (
                <button
                  type="button"
                  onClick={handleInstall}
                  disabled={busy}
                  className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md active:scale-[0.98] disabled:opacity-60"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  {busy ? "Installing…" : "Install QRslice"}
                </button>
              ) : (
                <p className="mt-8 text-sm text-slate-500">
                  Open this page in Chrome, Edge, or Safari and use
                  “Add to Home Screen” to install QRslice.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
