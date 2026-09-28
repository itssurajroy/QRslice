// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Script from "next/script";
import { CheckCircleIcon, SparklesIcon, CreditCardIcon } from "@/components/Icons";

declare global {
  interface Window {
    Razorpay?: new (options: any) => {
      open: () => void;
      on: (event: string, handler: (response: any) => void) => void;
      close: () => void;
    };
  }
}

type BillingClientProps = {
  restaurant: any;
};

export default function BillingClient({ restaurant }: BillingClientProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<{ message: string; hint?: string } | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [rzpLoaded, setRzpLoaded] = useState(false);
  const [plans, setPlans] = useState<Array<{ id: string; slug: string; billing_cycle: string }>>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  useEffect(() => {
    fetch("/api/billing/plans")
      .then((res) => res.json())
      .then((data) => {
        setPlans(data.plans || []);
        setPlansLoading(false);
      })
      .catch(() => setPlansLoading(false));
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (
        params.get("payment") === "success" ||
        params.get("razorpay_payment_id") ||
        params.get("razorpay_payment_link_status") === "paid"
      ) {
        setPaymentSuccess(true);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Razorpay) {
      setRzpLoaded(true);
    }
  }, []);

  const plan = restaurant?.plan || "trial";
  const trialEnds = restaurant?.trial_ends_at ? new Date(restaurant.trial_ends_at) : null;
  const subEnds = restaurant?.subscription_ends_at ? new Date(restaurant.subscription_ends_at) : null;

  const now = Date.now();
  const daysLeft = trialEnds ? Math.max(0, Math.ceil((trialEnds.getTime() - now) / (1000 * 60 * 60 * 24))) : 0;
  const isPaidActive = plan === "active";
  const isTrialActive = plan === "trial" && daysLeft > 0;
  const isExpired = !isPaidActive && !isTrialActive;

  const monthlyPrice = 999;
  const yearlyPrice = 9999;
  const currentPrice = billingCycle === "monthly" ? monthlyPrice : yearlyPrice;
  const periodLabel = billingCycle === "monthly" ? "/month" : "/year";

  async function handleSubscribe(simulate = false) {
    if (simulate) {
      setSimulating(true);
    } else {
      if (plansLoading) {
        setError({ message: "Plans are still loading. Please wait a moment." });
        return;
      }
      setLoading(true);
    }
    setError(null);

    try {
      if (simulate) {
        // Sandbox simulation mode (dev only)
        const res = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cycle: billingCycle, simulate: true }),
        });
        const data = await res.json();
        if (res.ok && data.simulated) {
          window.location.reload();
        } else {
          setError({ message: data.error || "Sandbox activation failed" });
        }
        return;
      }

      // Standard Web Checkout flow
      if (!rzpLoaded) {
        setError({
          message: "Payment gateway is still loading. Please wait a moment and try again.",
          hint: "If this persists, check your internet connection.",
        });
        setLoading(false);
        return;
      }

      // 1. Create Razorpay order via our backend
      const selectedPlan = plans.find((p) => p.billing_cycle === billingCycle);
      const planId = selectedPlan?.id;
      if (!planId) {
        setError({
          message: "Plan not found for selected billing cycle.",
          hint: "Please try again or contact support.",
        });
        setLoading(false);
        return;
      }

      // 1. Create Razorpay order via our backend
      const orderRes = await fetch("/api/billing/subscription/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: planId }),
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.order_id) {
        setError({
          message: orderData.error || "Failed to create payment order.",
          hint: orderData.hint || "Please verify your Razorpay API credentials.",
        });
        setLoading(false);
        return;
      }

      // 2. Open Razorpay modal
      const keyId = orderData.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!keyId) {
        setError({
          message: "Payment gateway configuration incomplete.",
          hint: "NEXT_PUBLIC_RAZORPAY_KEY_ID is missing.",
        });
        setLoading(false);
        return;
      }

      const RazorpayConstructor = window.Razorpay;
      if (!RazorpayConstructor) {
        setError({
          message: "Payment gateway failed to load. Please refresh and try again.",
        });
        setLoading(false);
        return;
      }
      const rzp = new RazorpayConstructor({
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        order_id: orderData.order_id,
        name: "QRslice",
        description: `${billingCycle === "yearly" ? "Annual" : "Monthly"} Subscription - ${restaurant?.name || "Your Restaurant"}`,
        prefill: {
          name: restaurant?.name || "",
          contact: restaurant?.phone || "",
        },
        theme: {
          color: "#007AFF",
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
        handler: async (response: any) => {
          // 3. Verify payment on our backend
          setLoading(true);
          try {
            const verifyRes = await fetch("/api/billing/subscription/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();

            if (verifyRes.ok) {
              setPaymentSuccess(true);
              // Refresh page to show updated subscription state
              setTimeout(() => window.location.reload(), 1500);
            } else {
              setError({
                message: verifyData.error || "Payment verification failed.",
                hint: "Your payment may have been processed but verification failed. Contact support if amount was deducted.",
              });
            }
          } catch {
            setError({
              message: "Network error during payment verification.",
              hint: "Please check your connection. If payment was deducted, it will be reconciled automatically.",
            });
          } finally {
            setLoading(false);
          }
        },
      });

      rzp.on("payment.failed", (response: any) => {
        setError({
          message: response.error?.description || "Payment failed. Please try again.",
          hint: "No amount has been charged. You can safely retry.",
        });
        setLoading(false);
      });

      rzp.open();
    } catch {
      setError({
        message: "Network error connecting to payment gateway.",
        hint: "Please check your internet connection and try again.",
      });
    } finally {
      if (!simulate) {
        // Loading state will be cleared by modal dismiss or payment handler
      } else {
        setSimulating(false);
      }
    }
  }

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel your subscription?")) {
      return;
    }
    setCancelling(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        setError({ message: data.error || "Failed to cancel subscription" });
      }
    } catch {
      setError({ message: "Network error while cancelling subscription." });
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-slate-900 flex flex-col font-sans selection:bg-[#007AFF] selection:text-white">
      {/* Razorpay Checkout Script */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setRzpLoaded(true)}
      />

      {/* Apple-style Frosted Header */}
      <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-white/80 backdrop-blur-xl px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1.5"
            >
              <span>←</span>
              <span>Admin Dashboard</span>
            </Link>
            <span className="text-slate-300">/</span>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight">Subscription & Billing</h1>
          </div>
          <span className="text-xs font-medium text-slate-500 bg-black/[0.04] px-3 py-1 rounded-full border border-black/[0.04]">
            {restaurant?.name || "Café"}
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 sm:p-6 w-full space-y-6 my-auto">
        {/* Billing Cycle Switcher */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 bg-black/[0.04] rounded-2xl border border-black/[0.05]">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                billingCycle === "monthly"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Monthly (₹999/mo)
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === "yearly"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>Annual (₹9,999/yr)</span>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Payment Success Celebratory Banner */}
        {paymentSuccess && (
          <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 shadow-sm flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="text-xs font-bold text-emerald-900">Payment Successful!</p>
              <p className="text-[11px] text-emerald-700">
                Your restaurant subscription is active. Thank you for powering your restaurant with QRslice!
              </p>
            </div>
          </div>
        )}

        {/* Bento Main Card */}
        <div className="bg-white border border-black/[0.06] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-black/[0.06] pb-6">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#007AFF]">
                  QRslice Complete
                </span>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    isPaidActive
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : isTrialActive
                      ? "bg-amber-50 border-amber-200 text-amber-700"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}
                >
                  {isPaidActive ? "Active ✓" : isTrialActive ? `Free Trial (${daysLeft} Days Left)` : "Expired"}
                </span>
              </div>

              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                  ₹{currentPrice.toLocaleString("en-IN")}
                </span>
                <span className="text-sm font-medium text-slate-500">{periodLabel}</span>
                {billingCycle === "yearly" && (
                  <span className="ml-2 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                    Saves ₹1,989/year (~2 mos free)
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 mt-1">
                {isPaidActive
                  ? `Next renewal: ${subEnds?.toLocaleDateString("en-IN") || "Auto-renews at end of cycle"}`
                  : isTrialActive
                  ? `Free trial active until ${trialEnds?.toLocaleDateString("en-IN")}`
                  : "Subscription expired. Re-activate to resume live customer ordering."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {!isPaidActive ? (
                <div className="flex flex-col items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleSubscribe(false)}
                    disabled={loading || simulating || plansLoading}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#007AFF] hover:bg-[#0062CC] text-white font-bold text-xs transition-all shadow-md shadow-[#007AFF]/20 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Opening Razorpay…</span>
                      </>
                    ) : plansLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Loading plans…</span>
                      </>
                    ) : (
                      <>
                        <CreditCardIcon className="w-4 h-4" />
                        <span>Subscribe Now (₹{currentPrice.toLocaleString("en-IN")}) →</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-slate-500 text-center max-w-[280px] leading-snug">
                    By subscribing, you authorize a recurring <strong>{billingCycle === 'monthly' ? 'monthly' : 'annual'}</strong> charge of <strong>₹{currentPrice.toLocaleString("en-IN")}</strong>. Your subscription will auto-renew automatically until you cancel. You can cancel at any time in your account settings.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {cancelling ? "Cancelling…" : "Cancel Subscription"}
                </button>
              )}
            </div>
          </div>

          {/* Diagnostic Error Banner with Sandbox Fallback */}
          {error && (
            <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200/80 text-red-800 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <span className="font-bold text-red-900">Checkout Error:</span>
                <span className="flex-1">{error.message}</span>
              </div>
              {error.hint && (
                <p className="text-slate-600 bg-white/70 p-2.5 rounded-xl border border-red-100 leading-relaxed">
                  <strong>Fix:</strong> {error.hint}
                </p>
              )}
              {/* Sandbox Activation Fallback */}
              <div className="pt-2 border-t border-red-200/60 flex items-center justify-between flex-wrap gap-2">
                <span className="text-[11px] text-slate-500">
                  Testing locally or awaiting key activation?
                </span>
                <button
                  type="button"
                  onClick={() => handleSubscribe(true)}
                  disabled={simulating || loading}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-[11px] transition-all cursor-pointer disabled:opacity-50"
                >
                  {simulating ? "Activating Sandbox…" : "⚡ Activate Test / Sandbox Mode"}
                </button>
              </div>
            </div>
          )}

          {/* Included Features Grid */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Everything Included in QRslice Complete
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-slate-700 bg-slate-50/60 p-2.5 rounded-xl border border-black/[0.03]">
                <CheckCircleIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span><strong>QR Digital Menu</strong> & Table Ordering</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700 bg-slate-50/60 p-2.5 rounded-xl border border-black/[0.03]">
                <CheckCircleIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span><strong>Multi-Station KDS</strong> & Prep Workflow</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700 bg-slate-50/60 p-2.5 rounded-xl border border-black/[0.03]">
                <CheckCircleIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span><strong>POS Register</strong> & Bluetooth Thermal Printing</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700 bg-slate-50/60 p-2.5 rounded-xl border border-black/[0.03]">
                <CheckCircleIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span><strong>Live Order Dashboard</strong> with Sound Chimes</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700 bg-slate-50/60 p-2.5 rounded-xl border border-black/[0.03]">
                <CheckCircleIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span><strong>GST Invoicing</strong> & Financial Analytics</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700 bg-slate-50/60 p-2.5 rounded-xl border border-black/[0.03]">
                <CheckCircleIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span><strong>Unlimited Tables, Dishes</strong> & Staff Seats</span>
              </div>
            </div>
          </div>

          {/* Secure Trust Footer */}
          <div className="bg-slate-50/80 border border-black/[0.04] rounded-2xl p-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Secured by Razorpay Subscriptions · 256-bit SSL Encryption</span>
            </div>
            <span className="font-medium text-slate-400">Cancel anytime · GST extra</span>
          </div>
        </div>
      </main>
    </div>
  );
}
