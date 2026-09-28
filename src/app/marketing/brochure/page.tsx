// Copyright (c) 2026 QRslice. All rights reserved.
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "QRslice Brochure — Restaurant Operating System",
  description:
    "Printable QRslice brochure: digital menus, contactless table ordering, KDS, POS and analytics for cafés and restaurants.",
  alternates: { canonical: "/marketing/brochure" },
};

export default function Brochure() {
  return (
    <div className="font-sans w-[210mm] mx-auto bg-slate-100 print:bg-transparent shadow-2xl print:shadow-none space-y-8 print:space-y-0 text-slate-900">
      
      {/* PAGE 1: COVER */}
      <div className="w-[210mm] h-[297mm] bg-white relative overflow-hidden flex flex-col justify-between print:break-after-page">
        {/* Abstract shapes */}
        <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[80%] bg-gradient-to-br from-indigo-900 via-indigo-700 to-violet-900 rounded-[100%] opacity-90 -z-10 rotate-[-10deg]" />
        
        <div className="px-16 pt-24 text-white relative z-10">
          <div className="flex items-center gap-4 mb-16">
            <div className="w-14 h-14 rounded-2xl bg-white text-brand-dark flex items-center justify-center font-black text-2xl shadow-2xl">
              QR
            </div>
            <span className="font-black text-4xl tracking-tight">QRslice</span>
          </div>
          
          <h1 className="text-6xl font-black leading-[1.05] tracking-tight mb-8 max-w-lg">
            The Future of <br/> Restaurant Management.
          </h1>
          <p className="text-xl text-indigo-100 max-w-md font-medium leading-relaxed">
            A unified ecosystem combining QR Menus, Kitchen Displays, and a next-gen POS. Designed for speed, built for growth.
          </p>
        </div>

        <div className="relative h-[450px] w-full flex items-end justify-end overflow-hidden px-12">
          <div className="absolute bottom-[-100px] right-[-50px] w-[600px] shadow-2xl rounded-3xl overflow-hidden rotate-[-5deg] border-8 border-slate-900/10 backdrop-blur-md">
             <img src="/marketing/pos_mockup.jpg" alt="POS System" className="w-full h-auto" />
          </div>
        </div>
      </div>

      {/* PAGE 2: QR ORDERING & POS */}
      <div className="w-[210mm] h-[297mm] bg-white relative overflow-hidden print:break-after-page">
        <div className="px-16 py-20 flex flex-col h-full">
          
          <div className="mb-16">
            <h2 className="text-amber-500 font-bold uppercase tracking-widest text-sm mb-3">Feature 01</h2>
            <h3 className="text-4xl font-black text-slate-900">Scan. Order. Pay.</h3>
            <p className="mt-4 text-slate-600 text-lg max-w-lg">
              Say goodbye to printed menus and waiting for waiters. Our interactive QR menus allow customers to browse high-res photos, customize their orders, and pay instantly from their smartphones.
            </p>
          </div>

          <div className="flex-1 flex gap-12 items-center">
            <div className="w-1/2 relative h-full flex items-center">
              <div className="w-[280px] absolute shadow-2xl rounded-[3rem] overflow-hidden border-8 border-white bg-slate-100 z-10 -rotate-3">
                <img src="/marketing/qr_menu_mockup.jpg" alt="QR Mobile App" className="w-full h-auto" />
              </div>
              <div className="absolute -left-10 w-64 h-64 bg-amber-200/40 rounded-full blur-3xl -z-10" />
            </div>
            <div className="w-1/2 space-y-8">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-lavender text-brand flex items-center justify-center shrink-0 text-xl">🚀</div>
                <div>
                  <h4 className="font-bold text-xl mb-1 text-slate-900">No App Required</h4>
                  <p className="text-slate-500 text-sm">Frictionless ordering through the native phone browser.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-lavender text-brand flex items-center justify-center shrink-0 text-xl">💳</div>
                <div>
                  <h4 className="font-bold text-xl mb-1 text-slate-900">Instant Payments</h4>
                  <p className="text-slate-500 text-sm">Integrate with Stripe, Apple Pay, and Google Pay to turn tables faster.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-lavender text-brand flex items-center justify-center shrink-0 text-xl">🔄</div>
                <div>
                  <h4 className="font-bold text-xl mb-1 text-slate-900">Live Updates</h4>
                  <p className="text-slate-500 text-sm">Customers see the status of their order updating in real-time as the kitchen cooks it.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PAGE 3: KITCHEN DISPLAY */}
      <div className="w-[210mm] h-[297mm] bg-slate-900 text-white relative overflow-hidden print:break-after-page">
        <div className="px-16 py-20 flex flex-col h-full">
          
          <div className="mb-12">
            <h2 className="text-emerald-400 font-bold uppercase tracking-widest text-sm mb-3">Feature 02</h2>
            <h3 className="text-4xl font-black text-white">The Kitchen OS.</h3>
            <p className="mt-4 text-slate-300 text-lg max-w-lg">
              Kill the paper tickets. Digitize your kitchen workflow with live multi-station displays that route appetizers to the prep station and mains to the grill automatically.
            </p>
          </div>

          <div className="w-full relative h-[400px] mb-12 shadow-2xl rounded-2xl overflow-hidden border border-slate-700">
             <img src="/marketing/kds_mockup.jpg" alt="Kitchen Display System" className="w-full h-full object-cover" />
          </div>

          <div className="grid grid-cols-3 gap-8 mt-auto">
            <div className="border-t border-slate-700 pt-4">
              <h4 className="font-bold text-lg mb-2">Color-Coded Timers</h4>
              <p className="text-slate-400 text-sm">Instantly identify VIP tables, rushing orders, and delayed tickets before customers complain.</p>
            </div>
            <div className="border-t border-slate-700 pt-4">
              <h4 className="font-bold text-lg mb-2">Multi-Station Routing</h4>
              <p className="text-slate-400 text-sm">Send drinks to the bar and food to the kitchen seamlessly from a single order.</p>
            </div>
            <div className="border-t border-slate-700 pt-4">
              <h4 className="font-bold text-lg mb-2">Automated Inventory</h4>
              <p className="text-slate-400 text-sm">Mark an order "Ready" and watch the exact recipe ingredients deduct from your live stock.</p>
            </div>
          </div>
          
        </div>
      </div>

      {/* PAGE 4: BACK COVER */}
      <div className="w-[210mm] h-[297mm] bg-white relative overflow-hidden flex flex-col items-center justify-center text-center">
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-50 to-white -z-10" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-lavender rounded-full blur-[100px] -z-10 opacity-70" />
        
        <div className="w-24 h-24 rounded-3xl bg-brand text-white flex items-center justify-center font-black text-4xl shadow-xl shadow-brand/20 mb-8 mx-auto">
          QR
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-4">Ready to upgrade?</h2>
        <p className="text-lg text-slate-500 max-w-md mx-auto mb-12">
          Join the hundreds of modern restaurants using QRslice to streamline their operations and increase revenue.
        </p>

        <div className="bg-slate-50 border border-slate-200 p-8 rounded-3xl inline-block text-left shadow-sm">
          <div className="font-bold text-sm text-slate-400 uppercase tracking-widest mb-6 border-b pb-4">Contact Sales</div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="text-xl">🌐</div>
              <div className="font-bold text-slate-900">www.qrslice.com</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xl">✉️</div>
              <div className="font-bold text-slate-900">hello@qrslice.com</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xl">📞</div>
              <div className="font-bold text-slate-900">+1 800-QR-SLICE</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

