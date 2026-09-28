// Copyright (c) 2026 QRslice. All rights reserved.
interface BrandingTabProps {
  brandingLogoUrl: string;
  brandingTagline: string;
  brandingGoogleReviewUrl: string;
  brandingAccentColor: string;
  savingBranding: boolean;
  setBrandingLogoUrl: (val: string) => void;
  setBrandingTagline: (val: string) => void;
  setBrandingGoogleReviewUrl: (val: string) => void;
  setBrandingAccentColor: (val: string) => void;
  handleSaveBranding: (e: React.FormEvent) => void;
}

export function BrandingTab({
  brandingLogoUrl,
  brandingTagline,
  brandingGoogleReviewUrl,
  brandingAccentColor,
  savingBranding,
  setBrandingLogoUrl,
  setBrandingTagline,
  setBrandingGoogleReviewUrl,
  setBrandingAccentColor,
  handleSaveBranding,
}: BrandingTabProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm max-w-xl">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-base font-black text-slate-900">Custom Café Branding</h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-black uppercase bg-brand text-white">
            Pro Feature
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Customize your guest ordering theme, logo, and receipt tagline.
        </p>
      </div>

      <form onSubmit={handleSaveBranding} className="space-y-4 text-xs">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Logo Image URL
          </label>
          <input
            type="url"
            placeholder="https://yourdomain.com/logo.png"
            value={brandingLogoUrl}
            onChange={(e) => setBrandingLogoUrl(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-brand"
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Receipt & Menu Tagline
          </label>
          <input
            type="text"
            placeholder="e.g. Crafted with passion since 2021"
            value={brandingTagline}
            onChange={(e) => setBrandingTagline(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-brand"
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Google Business Review Link
          </label>
          <input
            type="url"
            placeholder="https://g.page/r/your-cafe/review or https://search.google.com/..."
            value={brandingGoogleReviewUrl}
            onChange={(e) => setBrandingGoogleReviewUrl(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-brand text-xs"
          />
          <p className="text-xs text-slate-400 mt-1">
            When guests rate their meal 4★ or 5★ on the live order tracker, they are directly prompted to post on this Google Review link.
          </p>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Theme Accent Color
          </label>
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-2">
            <input
              type="color"
              value={brandingAccentColor}
              onChange={(e) => setBrandingAccentColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
            />
            <span className="font-mono text-slate-500 font-bold">{brandingAccentColor}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={savingBranding}
          className="w-full py-3 rounded-xl bg-brand hover:bg-brand-dark text-white font-black text-xs shadow-md cursor-pointer"
        >
          {savingBranding ? "Saving…" : "Save Branding Settings →"}
        </button>
      </form>
    </div>
  );
}

