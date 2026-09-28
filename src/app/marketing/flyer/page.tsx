// Copyright (c) 2026 QRslice. All rights reserved.
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "QRslice Flyer — QR Table Ordering for Restaurants",
  description:
    "Printable QRslice flyer: QR table ordering, kitchen display, POS billing and inventory for independent restaurants.",
  alternates: { canonical: "/marketing/flyer" },
};

export default function Flyer() {
  return (
    <div className="bg-white shadow-2xl print:shadow-none w-[210mm] h-[297mm] mx-auto overflow-hidden relative flex flex-col font-sans">
      {/* Background Graphic */}
      <div className="absolute top-0 right-0 w-[150%] h-[150%] bg-gradient-to-br from-indigo-50 via-white to-amber-50 -z-10 translate-x-[30%] -translate-y-[20%] rounded-full opacity-50 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-3xl -z-10" />

      {/* Header */}
      <div className="px-12 pt-16 pb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center font-black text-xl shadow-lg shadow-brand/30">
            QR
          </div>
          <span className="font-black text-3xl tracking-tight text-slate-900">QRslice</span>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">Next-Gen Restaurant OS</p>
        </div>
      </div>

      {/* Hero Section */}
      <div className="px-12 flex-1 flex flex-col justify-center">
        <h1 className="text-5xl font-black text-slate-900 leading-[1.1] mb-6">
          Run your café from <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-amber-500">one single system.</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-md leading-relaxed mb-10 font-medium">
          Ditch the clutter. QRslice combines instant QR ordering, a lightning-fast POS, and a live kitchen display system into one seamless platform.
        </p>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-6 mb-12">
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 p-5 rounded-2xl shadow-sm">
            <div className="text-2xl mb-3">📱</div>
            <h3 className="font-bold text-slate-900 text-lg mb-1">Instant QR Menus</h3>
            <p className="text-sm text-slate-500 leading-snug">Customers scan, order, and pay directly from their tables. No app downloads required.</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 p-5 rounded-2xl shadow-sm">
            <div className="text-2xl mb-3">💻</div>
            <h3 className="font-bold text-slate-900 text-lg mb-1">Modern POS</h3>
            <p className="text-sm text-slate-500 leading-snug">Lightning-fast billing, split checks, and bluetooth KOT printing in a single tap.</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 p-5 rounded-2xl shadow-sm">
            <div className="text-2xl mb-3">🍳</div>
            <h3 className="font-bold text-slate-900 text-lg mb-1">Live Kitchen OS</h3>
            <p className="text-sm text-slate-500 leading-snug">Digital kitchen displays (KDS) eliminate paper tickets and speed up prep times.</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 p-5 rounded-2xl shadow-sm">
            <div className="text-2xl mb-3">📦</div>
            <h3 className="font-bold text-slate-900 text-lg mb-1">Real-time Stock</h3>
            <p className="text-sm text-slate-500 leading-snug">Ingredients deduct automatically as orders are placed. Never run out of stock.</p>
          </div>
        </div>

      </div>

      {/* Absolute Image Compositions */}
      <div className="absolute right-[-40px] top-[280px] w-[350px] rotate-[-5deg] shadow-2xl rounded-[2rem] overflow-hidden border-4 border-white/50 backdrop-blur-xl">
        <img src="/marketing/pos_mockup.jpg" alt="POS interface" className="w-full h-auto object-cover scale-110" />
      </div>
      <div className="absolute right-[220px] top-[480px] w-[180px] rotate-[8deg] shadow-2xl rounded-[2rem] overflow-hidden border-4 border-white/50 backdrop-blur-xl">
        <img src="/marketing/qr_menu_mockup.jpg" alt="QR Menu mobile interface" className="w-full h-auto object-cover scale-110" />
      </div>

      {/* Footer / CTA */}
      <div className="mt-auto bg-slate-900 text-white p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-lavender0 rounded-full blur-[80px] opacity-30 -translate-y-1/2 translate-x-1/2" />
        
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h2 className="text-2xl font-black mb-2">Upgrade your restaurant today.</h2>
            <p className="text-slate-400 text-sm">Join hundreds of modern cafés using QRslice.</p>
          </div>
          <div className="text-right">
            <div className="font-mono font-bold text-amber-400 text-lg mb-1">www.qrslice.com</div>
            <div className="text-slate-300 text-sm font-medium">sales@qrslice.com • +1 800-QR-SLICE</div>
          </div>
        </div>
      </div>
    </div>
  );
}

