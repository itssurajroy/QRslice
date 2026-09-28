// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircleIcon,
  SparklesIcon,
  CoffeeIcon,
  ClipboardListIcon,
  ChefHatIcon,
  FlameIcon,
  BellIcon,
  CreditCardIcon,
  ClockIcon,
  TrophyIcon,
  StarIcon,
  ArrowRightIcon,
  MessageCircleIcon,
  RefreshCwIcon,
} from "@/components/Icons";
import { paise } from "@/lib/utils";

const STEPS = [
  {
    key: "pending",
    label: "Order Placed",
    desc: "Ticket sent to kitchen",
    renderIcon: (cls: string) => <ClipboardListIcon className={cls} />,
  },
  {
    key: "confirmed",
    label: "Accepted",
    desc: "Chef reviewed & queued",
    renderIcon: (cls: string) => <ChefHatIcon className={cls} />,
  },
  {
    key: "preparing",
    label: "Cooking",
    desc: "Freshly preparing at line",
    renderIcon: (cls: string) => <FlameIcon className={cls} />,
  },
  {
    key: "ready",
    label: "Ready",
    desc: "Plated & ready for pickup",
    renderIcon: (cls: string) => <BellIcon className={cls} />,
  },
  {
    key: "served",
    label: "Served",
    desc: "Served at your table",
    renderIcon: (cls: string) => <SparklesIcon className={cls} />,
  },
] as const;

export default function OrderStatusPage({
  params,
}: {
  params: Promise<{ statusToken: string }>;
}) {
  const [token, setToken] = useState<string>("");
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [prevStatus, setPrevStatus] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const loyaltyEarned = searchParams.get("earned");
  const loyaltyTotal = searchParams.get("total");

  // Time Elapsed Counter
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Countdown timer remaining
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);

  // Modal / Popup Feedback State
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [dismissedModal, setDismissedModal] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [compliments, setCompliments] = useState<string[]>([]);
  const [submittedFeedback, setSubmittedFeedback] = useState<boolean>(false);
  const [submittingFeedback, setSubmittingFeedback] = useState<boolean>(false);

  useEffect(() => {
    params.then((p) => setToken(p.statusToken));
  }, [params]);

  // Live Fast Polling with Graceful Retry
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!token) return;
    async function poll() {
      try {
        const res = await fetch(`/api/order-status/${token}`, { cache: "no-store" });
        const json = await res.json();
        if (res.ok) {
          setData(json);
          setError(null);
          // Trigger feedback popup when served
          if (json.status === "served" && !dismissedModal && !submittedFeedback) {
            setShowFeedbackModal(true);
          }
        } else {
          setRetryCount((prev) => {
            const next = prev + 1;
            if (next >= 4) {
              setError(json.error || "Order not found");
            }
            return next;
          });
        }
      } catch {
        /* retain state */
      }
    }
    poll();
    const id = setInterval(poll, 1500);
    return () => clearInterval(id);
  }, [token, dismissedModal, submittedFeedback]);

  // Status change sound notification
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!data?.status || !prevStatus || data.status === prevStatus) {
      if (data?.status) setPrevStatus(data.status);
      return;
    }
    setPrevStatus(data.status);
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.5);
    } catch { /* blocked */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.status]);

  // Countdown timer based on status + kitchen delay
  useEffect(() => {
    if (!data?.status || !data?.created_at) return;
    const statusCountdowns: Record<string, number> = {
      pending: 20 * 60,
      confirmed: 18 * 60,
      preparing: 10 * 60,
      ready: 0,
      served: 0,
    };
    const delayExtra = (data.delay_minutes || 0) * 60;
    const base = (statusCountdowns[data.status] ?? 0) + delayExtra;
    if (base === 0) { setCountdownSeconds(null); return; }
    const startTime = new Date(data.created_at).getTime();
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const remaining = Math.max(0, base - elapsed);
    setCountdownSeconds(remaining);
    const iv = setInterval(() => setCountdownSeconds(prev => prev !== null && prev > 0 ? prev - 1 : 0), 1000);
    return () => clearInterval(iv);
  }, [data?.status, data?.created_at, data?.delay_minutes]);

  // Live Timer based on created_at
  useEffect(() => {
    if (!data?.created_at) return;
    const startTime = new Date(data.created_at).getTime();
    const updateTimer = () => {
      const sec = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
      setElapsedSeconds(sec);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [data?.created_at]);

  const logGoogleClick = () => {
    fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status_token: token, is_google_click: true, rating }),
    }).catch(() => {});
  };

  const handleGoogleRedirect = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    logGoogleClick();
    
    // Auto-copy feedback to clipboard
    const parts = [];
    if (compliments.length > 0) {
      parts.push(compliments.map(c => c.replace(/[^a-zA-Z\s]/g, "").trim()).join(", ") + ".");
    }
    if (feedbackText.trim()) {
      parts.push(feedbackText.trim());
    }
    const textToCopy = parts.join(" ");
    
    if (textToCopy && navigator?.clipboard) {
      try {
        navigator.clipboard.writeText(textToCopy);
      } catch(err) {}
    }

    const url = data.google_review_url || `https://www.google.com/search?q=${encodeURIComponent((data.restaurant_name || "Cafe") + " reviews")}`;
    window.open(url, "_blank");
  };

  async function handleFeedbackSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    
    // For 4/5 stars, open Google Review in a new tab immediately to avoid popup blockers,
    // auto-copy feedback to clipboard, then submit to our backend in the background.
    if (rating >= 4) {
      handleGoogleRedirect();
    }

    setSubmittingFeedback(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status_token: token,
          rating,
          feedback: feedbackText,
          compliments,
        }),
      });
      if (res.ok) {
        setSubmittedFeedback(true);
      }
    } catch {
      /* ignore */
    } finally {
      setSubmittingFeedback(false);
    }
  }

  function toggleCompliment(tag: string) {
    setCompliments((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s < 10 ? "0" + s : s}s`;
  };

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <CoffeeIcon className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Order Not Found</h2>
          <p className="text-xs text-slate-600 leading-relaxed">{error}</p>
          <Link
            href="/"
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black text-xs inline-flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer min-h-[44px]"
          >
            <span>Return to Home</span>
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-mono">Syncing live order status…</p>
        </div>
      </main>
    );
  }

  const currentIdx = STEPS.findIndex((s) => s.key === data.status);
  const isOrderServed = data.status === "served";
  const currentStep = STEPS[currentIdx] || STEPS[0];
  const progressPercent = Math.min(100, Math.round(((currentIdx + 1) / STEPS.length) * 100));

  return (
    <main className="min-h-dvh bg-[#FAF9F6] text-slate-900 p-4 sm:p-6 pt-safe pb-safe flex flex-col items-center justify-start overflow-y-auto font-[family-name:var(--font-plus-jakarta)] antialiased selection:bg-[#5738F5] selection:text-white">
      {/* Dynamic Island Style Card */}
      <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xl space-y-6 my-auto relative overflow-hidden">
        {/* Top Header with Table Badge & Payment Pill */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                Live Kitchen Sync
              </span>
              <span className="text-xs text-slate-500 font-mono font-medium">
                ⏱ {formatElapsed(elapsedSeconds)}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              Order #{data.order_number}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Table <span className="text-indigo-600 font-bold font-mono text-sm">{data.table}</span>
            </p>
          </div>

          <div className="text-right space-y-1">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider inline-block border ${
                data.payment_status === "paid"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-amber-50 border-amber-200 text-amber-700"
              }`}
            >
              {data.payment_status === "paid" ? "Paid in Cash ✓" : "Pay at Counter"}
            </span>
            <div className="text-xs font-mono text-slate-400">
              {new Date(data.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </div>

        {/* Loyalty Banner (Shown once on fresh checkout) */}
        {loyaltyEarned !== null && loyaltyEarned !== "undefined" && (
          <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 shadow-sm animate-fade-in-up">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                <StarIcon className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-black text-amber-900 text-sm">You earned {loyaltyEarned} points!</h3>
                <p className="text-xs text-amber-700/80 font-medium leading-relaxed mt-0.5">
                  Thanks for visiting! {loyaltyTotal && loyaltyTotal !== "undefined" ? (
                    <>You now have a total of <strong className="font-black">{loyaltyTotal} points</strong> linked to your phone number.</>
                  ) : (
                    <>Points will be credited to your table session once paid.</>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Customer Payment Required Alert Banner (Online Payment & Unpaid) */}
        {data.payment_method === "online" && (data.payment_status === "unpaid" || data.payment_status === "verification_pending") && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-slate-900 shadow-sm space-y-4 text-center overflow-hidden relative">
            {data.payment_status === "verification_pending" && (
              <div className="absolute inset-0 bg-amber-50/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
                <RefreshCwIcon className="w-10 h-10 text-amber-600 animate-spin mx-auto mb-3" />
                <h3 className="text-lg font-black text-amber-900">Verifying Payment</h3>
                <p className="text-xs text-amber-800 mt-1">Please wait while the cafe confirms receipt...</p>
              </div>
            )}
            
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center mx-auto shadow-md">
              <CreditCardIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-amber-950">
                Bill Payment Due: {paise(data.total_paise)}
              </h3>
              <p className="text-xs text-amber-800/90 mt-0.5">
                {data.status === "served"
                  ? "Your order is served! Please settle your bill."
                  : "Complete your payment to confirm the order."}
              </p>
            </div>
            
            {data.upi_id && (
              <div className="pt-3 border-t border-amber-200/50 space-y-4">
                <div className="bg-white p-3 rounded-2xl mx-auto w-fit shadow-inner border border-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=${data.upi_id}&pn=${encodeURIComponent(data.restaurant_name)}&am=${(data.total_paise / 100).toFixed(2)}&tr=ORD${data.order_number}&cu=INR`)}`}
                    alt="UPI QR Code"
                    className="w-40 h-40 object-contain mx-auto"
                  />
                </div>
                
                <a 
                  href={`upi://pay?pa=${data.upi_id}&pn=${encodeURIComponent(data.restaurant_name)}&am=${(data.total_paise / 100).toFixed(2)}&tr=ORD${data.order_number}&cu=INR`}
                  className="w-full block py-3 rounded-xl bg-[#29A05C] hover:bg-[#22874d] text-white font-bold text-sm shadow-md active:scale-95 transition-all"
                >
                  Pay via UPI App (GPay/PhonePe)
                </a>
                
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await fetch(`/api/order-status/${token}/verify-upi`, { method: "POST" });
                      // Trigger a fast re-poll immediately
                      const res = await fetch(`/api/order-status/${token}`, { cache: "no-store" });
                      if (res.ok) setData(await res.json());
                    } catch (err) {}
                  }}
                  className="w-full py-3 rounded-xl bg-white border-2 border-indigo-600 text-indigo-700 font-bold text-sm shadow-sm hover:bg-indigo-50 active:scale-95 transition-all"
                >
                  I Have Paid &rarr;
                </button>
              </div>
            )}
          </div>
        )}

        {/* Kitchen Preparation Delay Alert Banner */}
        {data.delay_minutes > 0 && !isOrderServed && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-slate-900 shadow-sm space-y-1 text-left">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-amber-600 animate-bounce" />
              <h3 className="text-xs font-black text-amber-800 uppercase tracking-wider">
                Kitchen Delay: +{data.delay_minutes} Minutes
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pl-6">
              {data.delay_reason ? `Notice: ${data.delay_reason}.` : "Chef requested extra time to ensure fresh quality preparation."}
            </p>
          </div>
        )}

        {/* Current State Highlight Banner */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20 font-black">
              {currentStep.renderIcon("w-6 h-6")}
            </div>
            <div>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                Current Status
              </span>
              <h3 className="text-base font-black text-slate-900">{currentStep.label}</h3>
              <p className="text-xs text-slate-500">{currentStep.desc}</p>
            </div>
          </div>
        </div>

        {/* 5-Step Animated Progress Stepper */}
        <div className="space-y-4">
          {/* Step circles with connecting line */}
          <div className="flex items-center justify-between relative">
            {/* Background connecting line */}
            <div className="absolute top-5 left-5 right-5 h-0.5 bg-slate-200 z-0"></div>
            {/* Active progress line */}
            <div
              className="absolute top-5 left-5 h-0.5 bg-indigo-600 z-0 transition-all duration-700"
              style={{ width: `${Math.max(0, (currentIdx / (STEPS.length - 1)) * 100)}%`, right: "auto" }}
            ></div>

            {STEPS.map((s, idx) => {
              const isCompleted = idx < currentIdx;
              const isCurrent = idx === currentIdx;
              return (
                <div key={s.key} className="flex flex-col items-center gap-1.5 relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                      : isCurrent
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-110 ring-4 ring-indigo-100"
                      : "bg-slate-100 border-2 border-slate-200 text-slate-400"
                  }`}>
                    {isCompleted ? <CheckCircleIcon className="w-5 h-5" /> : s.renderIcon("w-5 h-5")}
                  </div>
                  <span className={`text-[10px] font-bold text-center max-w-12 leading-tight ${
                    isCurrent ? "text-indigo-600" : isCompleted ? "text-emerald-600" : "text-slate-400"
                  }`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Countdown timer */}
          {countdownSeconds !== null && countdownSeconds > 0 && (
            <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-amber-50 border border-amber-200/80">
              <span className="text-amber-600 text-sm">⏳</span>
              <span className="text-xs text-slate-600 font-medium">Estimated preparation:</span>
              <span className="text-sm font-black text-amber-700 font-mono">
                {Math.floor(countdownSeconds / 60)}:{String(countdownSeconds % 60).padStart(2, "0")}
              </span>
            </div>
          )}
          {data.status === "ready" && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
              <p className="text-sm font-black text-emerald-700">🔔 Your order is ready! A server is bringing it to your table.</p>
            </div>
          )}
        </div>

        {/* Loyalty Points (when served) */}
        {isOrderServed && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <div>
                <p className="text-xs font-black text-slate-900">Loyalty Points Earned!</p>
                <p className="text-[11px] text-slate-500">Credited to your table session</p>
              </div>
            </div>
            <span className="text-sm font-black text-amber-700 font-mono">+{Math.floor((data.total_paise || 0) / 10000)} pts</span>
          </div>
        )}

        {/* Itemized Order Recap */}
        {data.items && data.items.length > 0 && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>Itemized Receipt</span>
              <span>{data.items.length} {data.items.length === 1 ? "item" : "items"}</span>
            </div>
            <div className="space-y-1.5 pt-1 max-h-48 overflow-y-auto pr-1 divide-y divide-slate-100">
              {data.items.map((it: any) => (
                <div key={it.id} className="pt-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-800 font-semibold">
                      {it.item_name} <span className="text-indigo-600 font-bold font-mono">×{it.quantity}</span>
                    </span>
                    <span className="text-slate-900 font-mono font-bold">{paise(it.line_total_paise)}</span>
                  </div>
                  {it.order_item_modifiers && it.order_item_modifiers.length > 0 ? (
                    <div className="space-y-0.5 mt-0.5 pl-2 border-l-2 border-slate-200">
                      {it.order_item_modifiers.map((m: any, mIdx: number) => (
                        <div key={mIdx} className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>+ {m.option_name}</span>
                          {m.price_delta_paise > 0 && (
                            <span className="font-mono text-slate-600">+{paise(m.price_delta_paise)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : it.notes ? (
                    <p className="text-[11px] text-slate-500 mt-0.5 pl-2 border-l-2 border-slate-200 truncate">
                      {it.notes}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
            {data.total_paise > (data.subtotal_paise || data.total_paise) && (
              <div className="border-t border-slate-200 pt-2 mt-2 space-y-1 text-[11px] text-slate-500 font-medium px-1">
                <div className="flex justify-between items-center">
                  <span>CGST (2.5%)</span>
                  <span className="font-mono">{paise(Math.round((data.total_paise - data.subtotal_paise) / 2))}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>SGST (2.5%)</span>
                  <span className="font-mono">{paise(Math.round((data.total_paise - data.subtotal_paise) / 2))}</span>
                </div>
              </div>
            )}
            <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between items-center text-xs font-black">
              <span className="text-slate-700">Total Bill</span>
              <span className="text-slate-900 font-mono text-sm font-black">{paise(data.total_paise)}</span>
            </div>
          </div>
        )}

        {/* Re-Open Feedback CTA Banner when Order Complete */}
        {isOrderServed && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌟</span>
              <div>
                <span className="text-xs font-black text-slate-900 block">
                  {submittedFeedback ? "Feedback Submitted ✓" : "Enjoyed your meal?"}
                </span>
                <span className="text-[11px] text-slate-500">
                  {submittedFeedback ? "Thank you! Rate us on Google." : "Tap to rate your dining experience."}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowFeedbackModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer active:scale-95 transition-all shadow-sm"
            >
              {submittedFeedback ? "Google Review" : "Rate ★"}
            </button>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="border-t border-slate-100 pt-4 space-y-3 text-center">
          {data.qr_token && (
            <Link
              href={`/t/${data.qr_token}`}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center shadow-lg shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer min-h-[44px]"
            >
              + Add More Dishes to Table {data.table} &rarr;
            </Link>
          )}

          <p className="text-[11px] text-slate-400 font-medium">
            This live receipt updates in real-time as your meal progresses.
          </p>
        </div>
      </div>

      {/* POPUP MODAL FEEDBACK DIALOG WITH GOOGLE REVIEWS */}
      {showFeedbackModal && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => {
            setShowFeedbackModal(false);
            setDismissedModal(true);
          }}
        >
          <div
            className="w-full max-w-sm max-h-[90dvh] overflow-y-auto bg-white border-2 border-indigo-200 rounded-3xl p-5 sm:p-6 pb-safe space-y-4 shadow-2xl relative text-center animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Cross */}
            <button
              type="button"
              onClick={() => {
                setShowFeedbackModal(false);
                setDismissedModal(true);
              }}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-white text-xs flex items-center justify-center cursor-pointer transition-colors"
            >
              ✕
            </button>

            {!submittedFeedback ? (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4 pt-1">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/25">
                  <SparklesIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">How was your meal?</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Order #{data.order_number} is completed!</p>
                </div>

                {/* 5-Star Rating Buttons */}
                <div className="flex justify-center items-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className={`text-3xl transition-transform active:scale-125 cursor-pointer ${
                        star <= rating ? "text-amber-400 scale-110" : "text-slate-300 hover:text-slate-400"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                {/* Compliment Badges */}
                <div className="flex flex-wrap justify-center gap-1.5">
                  {[
                    "⚡ Fast Service",
                    "☕ Great Taste",
                    "🔥 Hot & Fresh",
                    "🌟 Polite Staff",
                    "✨ Clean Table",
                  ].map((tag) => {
                    const isSelected = compliments.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => toggleCompliment(tag)}
                        className={`text-xs font-bold px-3 py-1 rounded-full border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-500 font-extrabold shadow-sm scale-105"
                            : "bg-slate-100 border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>

                <textarea
                  placeholder="Suggestions or compliments for the chef? (optional)"
                  value={feedbackText}
                  maxLength={300}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 min-h-[65px] resize-none"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFeedbackModal(false);
                      setDismissedModal(true);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs cursor-pointer border border-slate-300"
                  >
                    Maybe Later
                  </button>
                  <button
                    type="submit"
                    disabled={submittingFeedback}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black text-xs transition-all shadow-md shadow-indigo-600/25 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {submittingFeedback ? (
                      "Submitting…"
                    ) : rating >= 4 ? (
                      <>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                          <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                          <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                        Post on Google &rarr;
                      </>
                    ) : (
                      "Submit Review →"
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="py-6 space-y-4">
                <CheckCircleIcon className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <div>
                  <h3 className="text-lg font-black text-slate-900">Thank You for Dining With Us!</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Your review has been shared with the kitchen team.
                  </p>
                </div>

                {/* Google Reviews CTA Banner after submitting */}
                <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <p className="text-xs font-bold text-amber-300">
                    Help other food lovers find {data.restaurant_name || "us"}!
                  </p>
                  <button
                    type="button"
                    onClick={handleGoogleRedirect}
                    className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white text-slate-900 font-black text-xs hover:bg-slate-50 transition-all shadow-md cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Leave Google Review ★★★★★</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold pt-2 cursor-pointer"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
