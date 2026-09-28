// Copyright (c) 2026 QRslice. All rights reserved.
import type { Metadata } from "next";
import Link from "next/link";
import { QrSliceLogoServer } from "@/components/brand/QrSliceLogoServer";

export const metadata: Metadata = {
  title: { absolute: "Terms and Conditions | QRslice" },
  description:
    "Terms and conditions governing use of the QRslice platform.",
  alternates: { canonical: "/legal/terms" },
};

export default function TermsPage() {
  return (
    <div className="landing-page min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/"><QrSliceLogoServer size="md" variant="full" className="h-8 w-auto" /></Link>
          <Link
            href="/"
            className="text-sm text-slate-500 transition-colors hover:text-slate-800"
          >
            Back to Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-bold text-slate-900">
          Terms and Conditions
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Last updated: September 9, 2026
        </p>

        <div className="prose prose-slate mt-8 max-w-none space-y-8 text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using QRslice (&quot;the Service&quot;), you agree
              to be bound by these Terms and Conditions (&quot;Terms&quot;). If
              you do not agree to these Terms, please do not use the Service.
            </p>
            <p>
              These Terms constitute a legally binding agreement between you
              (&quot;you,&quot; &quot;your,&quot; or &quot;User&quot;) and QR
              Cafe (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              2. Description of Service
            </h2>
            <p>
              QRslice provides a cloud-based restaurant management platform
              including QR code menu ordering, point of sale (POS), kitchen
              display system (KDS), inventory management, staff management, and
              related features for cafes and restaurants in India.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              3. Account Registration
            </h2>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                You must provide accurate and complete information during
                registration.
              </li>
              <li>
                You are responsible for maintaining the confidentiality of your
                account credentials.
              </li>
              <li>
                You must be at least 18 years old to create an account.
              </li>
              <li>
                You are responsible for all activities that occur under your
                account.
              </li>
              <li>
                You must notify us immediately of any unauthorized use of your
                account.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              4. Subscriptions and Payment
            </h2>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                The Service offers paid subscription tiers (Basic and Pro).
              </li>
              <li>
                Paid subscriptions are billed monthly via Razorpay in Indian
                Rupees (INR).
              </li>
              <li>
                Subscription fees are non-refundable except as stated in our{" "}
                <Link href="/legal/refund" className="text-brand hover:underline">
                  Refund Policy
                </Link>
                .
              </li>
              <li>
                We reserve the right to change pricing with 30 days&apos;
                notice.
              </li>
              <li>
                Failure to pay may result in suspension or termination of your
                account.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              5. Your Content
            </h2>
            <p>
              You retain ownership of all data, menus, images, and content you
              upload to the Service (&quot;Your Content&quot;). By using the
              Service, you grant us a limited license to host, store, and
              process Your Content solely to provide the Service to you.
            </p>
            <p>You represent and warrant that:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                You have the right to upload and share Your Content.
              </li>
              <li>
                Your Content does not infringe on any third-party rights.
              </li>
              <li>
                Your Content complies with all applicable Indian laws and
                regulations.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              6. Acceptable Use
            </h2>
            <p>You agree not to:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Use the Service for any unlawful purpose.</li>
              <li>
                Attempt to gain unauthorized access to any part of the Service.
              </li>
              <li>
                Interfere with or disrupt the Service or servers.
              </li>
              <li>
                Use automated systems (bots, scrapers) to access the Service.
              </li>
              <li>
                Resell or redistribute the Service without written permission.
              </li>
              <li>
                Upload malicious content or code.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              7. Intellectual Property
            </h2>
            <p>
              The Service, including its design, code, features, and branding,
              is owned by QRslice and protected by Indian and international
              intellectual property laws. You may not copy, modify, distribute,
              or reverse-engineer any part of the Service without our written
              consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              8. Third-Party Integrations
            </h2>
            <p>
              The Service integrates with third-party platforms (Supabase,
              Razorpay, WhatsApp, Vercel). Your use of these integrations is
              subject to their respective terms. We are not responsible for the
              availability, accuracy, or policies of third-party services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              9. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by Indian law, QRslice shall not
              be liable for any indirect, incidental, special, consequential, or
              punitive damages arising from your use of the Service, including
              but not limited to loss of profits, data, or business
              interruptions.
            </p>
            <p>
              Our total liability to you shall not exceed the amount paid by you
              to us in the twelve (12) months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              10. Indemnification
            </h2>
            <p>
              You agree to indemnify and hold QRslice harmless from any claims,
              losses, or damages (including legal fees) arising from your use of
              the Service, violation of these Terms, or infringement of any
              third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              11. Termination
            </h2>
            <p>
              We may suspend or terminate your access to the Service at any time,
              with or without cause, with or without notice. Upon termination:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Your right to use the Service ceases immediately.</li>
              <li>
                We will make your data available for export for 30 days after
                termination.
              </li>
              <li>
                We may delete your data after the 30-day export period.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              12. Governing Law and Disputes
            </h2>
            <p>
              These Terms are governed by the laws of India. Any disputes shall
              be subject to the exclusive jurisdiction of the courts in Delhi,
              India. You agree to attempt to resolve disputes informally before
              initiating legal proceedings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              13. Changes to Terms
            </h2>
            <p>
              We reserve the right to modify these Terms at any time. Material
              changes will be notified via email or in-app notification at least
              30 days before taking effect. Continued use after changes take
              effect constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              14. Severability
            </h2>
            <p>
              If any provision of these Terms is found to be unenforceable, the
              remaining provisions shall continue in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">15. Contact</h2>
            <p>For questions about these Terms:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                Email:{" "}
                <a
                  href="mailto:support@qrslice.com"
                  className="text-brand hover:underline"
                >
                  support@qrslice.com
                </a>
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}

