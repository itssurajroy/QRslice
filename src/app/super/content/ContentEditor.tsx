// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SectionId =
  | "hero" | "pricing" | "faq" | "cta" | "footer"
  | "email0" | "email7" | "email12" | "email14"
  | "legal_terms" | "legal_privacy" | "legal_refund" | "legal_cookies";

const SECTIONS: { id: SectionId; label: string; key: string; liveUrl: string }[] = [
  { id: "hero", label: "Hero", key: "cms.hero", liveUrl: "/" },
  { id: "pricing", label: "Pricing", key: "cms.pricing", liveUrl: "/#pricing" },
  { id: "faq", label: "FAQ", key: "cms.faq", liveUrl: "/#faq" },
  { id: "cta", label: "Final CTA", key: "cms.cta", liveUrl: "/" },
  { id: "footer", label: "Footer", key: "cms.footer", liveUrl: "/" },
  { id: "email0", label: "Email · Day 0", key: "cms.email.trial_0", liveUrl: "/" },
  { id: "email7", label: "Email · Day 7", key: "cms.email.trial_7", liveUrl: "/" },
  { id: "email12", label: "Email · Day 12", key: "cms.email.trial_12", liveUrl: "/" },
  { id: "email14", label: "Email · Day 14", key: "cms.email.trial_14", liveUrl: "/" },
  { id: "legal_terms", label: "Legal · Terms", key: "cms.legal.terms", liveUrl: "/legal/terms" },
  { id: "legal_privacy", label: "Legal · Privacy", key: "cms.legal.privacy", liveUrl: "/legal/privacy" },
  { id: "legal_refund", label: "Legal · Refund", key: "cms.legal.refund", liveUrl: "/legal/refund" },
  { id: "legal_cookies", label: "Legal · Cookies", key: "cms.legal.cookies", liveUrl: "/legal/cookies" },
];

const inputCls =
  "w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand";
const labelCls = "text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1";

export function ContentEditor({ initial }: { initial: Record<string, any> }) {
  const router = useRouter();
  const [section, setSection] = useState<SectionId>("hero");
  const [draft, setDraft] = useState<string>(() =>
    JSON.stringify(initial[SECTIONS[0].key] ?? {}, null, 2),
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const meta = SECTIONS.find((s) => s.id === section)!;
  const hasOverride = initial[meta.key] !== undefined;

  function switchSection(id: SectionId) {
    setSection(id);
    const m = SECTIONS.find((s) => s.id === id)!;
    setDraft(JSON.stringify(initial[m.key] ?? {}, null, 2));
    setMsg(null);
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const value = JSON.parse(draft);
      const res = await fetch("/api/super/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: meta.key, value }),
      });
      if (!res.ok) {
        setMsg("Save failed: " + ((await res.json().catch(() => null))?.error || res.status));
        return;
      }
      setMsg("Saved — live within a minute.");
      router.refresh();
    } catch {
      setMsg("Invalid JSON — fix the syntax and retry.");
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (!confirm(`Reset ${meta.label} to built-in defaults?`)) return;
    setBusy(true);
    const res = await fetch(`/api/super/content?key=${encodeURIComponent(meta.key)}`, { method: "DELETE" });
    setMsg(res.ok ? "Reset — built-in copy is live again." : "Reset failed.");
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => switchSection(s.id)}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer border transition-colors ${
              section === s.id
                ? "bg-brand text-white border-brand"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            {s.label}
            {initial[s.key] !== undefined && (
              <span className={`ml-1.5 inline-block w-1.5 h-1.5 rounded-full ${section === s.id ? "bg-white" : "bg-emerald-500"}`} title="Customized" />
            )}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">{meta.label}</h2>
            <p className="text-xs text-slate-500 font-mono">{meta.key} · {hasOverride ? "customized" : "using built-in defaults"}</p>
          </div>
          <a href={meta.liveUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-brand hover:underline">
            View live ↗
          </a>
        </div>

        <div>
          <label className={labelCls}>Content JSON — field help below</label>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
            rows={18}
            className={`${inputCls} font-mono text-xs leading-relaxed`}
          />
        </div>

        <FieldHelp id={section} />

        {msg && <p className="text-xs font-bold text-slate-700">{msg}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold text-xs cursor-pointer"
          >
            {busy ? "Saving…" : "Save & Publish"}
          </button>
          {hasOverride && (
            <button
              type="button"
              onClick={reset}
              disabled={busy}
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs cursor-pointer hover:bg-slate-50"
            >
              Reset to built-in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldHelp({ id }: { id: SectionId }) {
  const helps: Record<SectionId, string[]> = {
    hero: ["eyebrow, headlineA, headlineB, sub, primaryCta, secondaryCta, trustLine, pills[]"],
    pricing: ["name, monthly, yearly, bullets[], trialText, fineprint"],
    faq: ["Array of {q, a}"],
    cta: ["headline, sub, primaryCta, secondaryCta"],
    footer: ["tagline, note"],
    email0: ["subject, body (HTML, {{cafeName}} {{billingUrl}})"],
    email7: ["subject, body (HTML, {{cafeName}} {{daysLeft}} {{ordersLine}} {{billingUrl}})"],
    email12: ["subject, body (HTML, {{cafeName}} {{daysLeft}} {{billingUrl}})"],
    email14: ["subject, body (HTML, {{cafeName}} {{billingUrl}})"],
    legal_terms: ["title, updated, body (plain text, blank lines = paragraphs)"],
    legal_privacy: ["title, updated, body (plain text, blank lines = paragraphs)"],
    legal_refund: ["title, updated, body (plain text, blank lines = paragraphs)"],
    legal_cookies: ["title, updated, body (plain text, blank lines = paragraphs)"],
  };
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Fields</p>
      {helps[id].map((h) => (
        <code key={h} className="block text-xs font-mono text-slate-700">{h}</code>
      ))}
    </div>
  );
}

