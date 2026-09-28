// Copyright (c) 2026 QRslice. All rights reserved.
import type { Metadata } from "next";
import Link from "next/link";
import { QrSliceLogoServer } from "@/components/brand/QrSliceLogoServer";

export const metadata: Metadata = {
  title: { absolute: "Cookie Policy | QRslice" },
  description:
    "How QRslice uses cookies and similar technologies.",
  alternates: { canonical: "/legal/cookies" },
};

export default function CookiePolicyPage() {
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
        <h1 className="text-3xl font-bold text-slate-900">Cookie Policy</h1>
        <p className="mt-2 text-sm text-slate-500">
          Last updated: September 9, 2026
        </p>

        <div className="prose prose-slate mt-8 max-w-none space-y-8 text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              1. What Are Cookies
            </h2>
            <p>
              Cookies are small text files stored on your device when you visit
              a website. They help websites remember your preferences and improve
              your experience.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              2. How We Use Cookies
            </h2>
            <p>QRslice uses cookies and similar technologies for:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>Authentication:</strong> To keep you logged in and
                maintain your session.
              </li>
              <li>
                <strong>Preferences:</strong> To remember your settings (theme,
                language).
              </li>
              <li>
                <strong>Security:</strong> To protect against CSRF attacks and
                unauthorized access.
              </li>
              <li>
                <strong>Analytics:</strong> To understand how the Service is
                used and improve performance.
              </li>
              <li>
                <strong>PWA Support:</strong> To enable offline functionality
                and app-like behavior.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              3. Types of Cookies We Use
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-2 text-left font-medium text-slate-700">
                      Type
                    </th>
                    <th className="border-b border-slate-200 px-4 py-2 text-left font-medium text-slate-700">
                      Purpose
                    </th>
                    <th className="border-b border-slate-200 px-4 py-2 text-left font-medium text-slate-700">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border-b border-slate-200 px-4 py-2">
                      Essential
                    </td>
                    <td className="border-b border-slate-200 px-4 py-2">
                      Authentication, security, session management
                    </td>
                    <td className="border-b border-slate-200 px-4 py-2">
                      Session / 30 days
                    </td>
                  </tr>
                  <tr>
                    <td className="border-b border-slate-200 px-4 py-2">
                      Functional
                    </td>
                    <td className="border-b border-slate-200 px-4 py-2">
                      Preferences, UI settings
                    </td>
                    <td className="border-b border-slate-200 px-4 py-2">
                      1 year
                    </td>
                  </tr>
                  <tr>
                    <td className="border-b border-slate-200 px-4 py-2">
                      Analytics
                    </td>
                    <td className="border-b border-slate-200 px-4 py-2">
                      Usage statistics, performance monitoring
                    </td>
                    <td className="border-b border-slate-200 px-4 py-2">
                      2 years
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              4. Third-Party Cookies
            </h2>
            <p>
              Some cookies are set by third-party services integrated into our
              platform:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>Razorpay:</strong> Payment processing cookies for
                secure transactions.
              </li>
              <li>
                <strong>Supabase:</strong> Authentication and session cookies.
              </li>
            </ul>
            <p>
              These third parties have their own privacy policies governing
              their use of cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              5. Managing Cookies
            </h2>
            <p>You can control cookies through:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>Browser Settings:</strong> Most browsers allow you to
                block or delete cookies. Check your browser&apos;s help section
                for instructions.
              </li>
              <li>
                <strong>Cookie Consent Banner:</strong> When you first visit
                QRslice, you can choose which non-essential cookies to accept.
              </li>
              <li>
                <strong>Opt-Out Links:</strong> You can opt out of analytics
                tracking by disabling JavaScript or using a browser extension.
              </li>
            </ul>
            <p>
              <strong>Note:</strong> Disabling essential cookies may prevent
              the Service from functioning properly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              6. Local Storage and Similar Technologies
            </h2>
            <p>
              In addition to cookies, we use browser local storage and
              session storage to:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Cache data for offline access (Progressive Web App).</li>
              <li>Store shopping cart and session state.</li>
              <li>Remember user preferences.</li>
            </ul>
            <p>
              These technologies are stored on your device and can be cleared
              through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              7. Updates to This Policy
            </h2>
            <p>
              We may update this Cookie Policy periodically. Changes will be
              posted on this page with an updated &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">8. Contact</h2>
            <p>For questions about our use of cookies:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                Email:{" "}
                <a
                  href="mailto:privacy@qrslice.com"
                  className="text-brand hover:underline"
                >
                  privacy@qrslice.com
                </a>
              </li>
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

