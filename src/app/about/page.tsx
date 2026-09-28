// Copyright (c) 2026 QRslice. All rights reserved.
import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "About Us | QRslice",
  description:
    "Learn about QRslice, our mission, and how we empower independent hospitality businesses with modern technology.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 selection:bg-brand selection:text-white">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-slate-950 px-4 py-20 sm:px-6 lg:px-8">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
          <div className="mx-auto max-w-4xl text-center relative z-10">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl" style={{ fontFamily: "var(--font-heading)" }}>
              Empowering Independent Cafés
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
              We believe that local, independent restaurants shouldn't be held back by outdated, clunky legacy systems. QRslice brings enterprise-grade hospitality tech to the neighborhood cafe.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="prose prose-slate prose-indigo max-w-none">
            <h2>Our Mission</h2>
            <p>
              Operating a café is one of the most high-pressure jobs in the world. Between managing staff, ensuring food quality, and delivering excellent customer service, technology should be the least of your worries. 
            </p>
            <p>
              Our mission is to build the fastest, most reliable, and easiest-to-use digital operating system for small to medium-sized dining venues. We strip away the complexity of traditional POS systems and focus strictly on what matters: <strong>speed, legibility, and reliability under pressure.</strong>
            </p>

            <h2>Built for the Rush</h2>
            <p>
              Every pixel of QRslice was designed with the chaotic reality of a dinner rush in mind. We chose a utilitarian design philosophy that prioritizes function. Our Kitchen Display System (KDS) uses a high-contrast dark mode to reduce eye strain and glare in bright kitchens, while our front-of-house POS uses a clean, light interface for maximum daylight visibility.
            </p>

            <h2>Why We're Different</h2>
            <ul>
              <li><strong>Zero Hardware Lock-in:</strong> Use the tablets, phones, or laptops you already own.</li>
              <li><strong>Instant Sync:</strong> Our real-time infrastructure means tickets appear in the kitchen the exact second a customer taps "Order".</li>
              <li><strong>Guest Experience First:</strong> We don't force your customers to download an app. A simple scan of a physical QR code drops them right into your beautiful, customized digital menu.</li>
            </ul>

            <div className="mt-12 rounded-2xl bg-brand-lavender p-8 text-center border border-indigo-100">
              <h3 className="text-xl font-bold text-indigo-900 mt-0">Ready to transform your venue?</h3>
              <p className="text-brand-dark mt-2 mb-6">
                Join the growing network of independent operators upgrading their hospitality experience.
              </p>
              <Link
                href="/onboarding"
                className="inline-block rounded-xl bg-brand px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-brand-dark active:scale-95"
              >
                Start Your Free Trial
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

