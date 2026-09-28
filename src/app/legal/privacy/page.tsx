// Copyright (c) 2026 QRslice. All rights reserved.
import type { Metadata } from "next";
import Link from "next/link";
import { QrSliceLogoServer } from "@/components/brand/QrSliceLogoServer";

export const metadata: Metadata = {
  title: { absolute: "Privacy Policy | QRslice" },
  description:
    "How QRslice collects, uses, and protects your personal information.",
  alternates: { canonical: "/legal/privacy" },
};

export default function PrivacyPolicyPage() {
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
        <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-500">
          Last updated: September 9, 2026
        </p>

        <div className="prose prose-slate mt-8 max-w-none space-y-8 text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              1. Introduction
            </h2>
            <p>
              QRslice (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;)
              operates the QRslice platform, including our website, mobile
              application, and related services (collectively, the
              &quot;Service&quot;). This Privacy Policy explains how we collect,
              use, disclose, and safeguard your information when you use our
              Service.
            </p>
            <p>
              By using the Service, you agree to the collection and use of
              information in accordance with this policy. If you do not agree,
              please discontinue use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              2. Information We Collect
            </h2>
            <h3 className="text-lg font-medium text-slate-800">
              2.1 Information You Provide
            </h3>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>Account Information:</strong> Name, email address, phone
                number, and password when you create an account.
              </li>
              <li>
                <strong>Business Information:</strong> Restaurant/cafe name,
                address, GST number, and menu details during onboarding.
              </li>
              <li>
                <strong>Payment Information:</strong> Billing details processed
                through Razorpay. We do not store credit/debit card numbers on
                our servers.
              </li>
              <li>
                <strong>Staff Information:</strong> Names, roles, and contact
                details for staff management features.
              </li>
              <li>
                <strong>Customer Orders:</strong> Customer names, phone numbers,
                and order details placed through QR menus.
              </li>
              <li>
                <strong>Communications:</strong> Any messages you send to us
                through the Service or support channels.
              </li>
            </ul>

            <h3 className="text-lg font-medium text-slate-800">
              2.2 Information Collected Automatically
            </h3>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>Device Information:</strong> Browser type, operating
                system, device type, and screen resolution.
              </li>
              <li>
                <strong>Usage Data:</strong> Pages visited, features used, time
                spent, and interaction patterns.
              </li>
              <li>
                <strong>Log Data:</strong> IP address, access times, and error
                logs.
              </li>
              <li>
                <strong>Cookies and Similar Technologies:</strong> See our{" "}
                <Link href="/legal/cookies" className="text-brand hover:underline">
                  Cookie Policy
                </Link>{" "}
                for details.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              3. How We Use Your Information
            </h2>
            <ul className="list-disc space-y-1 pl-6">
              <li>To provide, maintain, and improve the Service.</li>
              <li>
                To process transactions and send related information (receipts,
                order confirmations).
              </li>
              <li>
                To send administrative notifications (service updates, security
                alerts).
              </li>
              <li>
                To provide customer support and respond to your requests.
              </li>
              <li>
                To generate analytics and insights about cafe performance and
                menu optimization.
              </li>
              <li>
                To detect, prevent, and address technical issues and fraud.
              </li>
              <li>
                To comply with legal obligations under Indian law.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              4. How We Share Your Information
            </h2>
            <p>
              We do not sell your personal information. We may share your data
              only in the following circumstances:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>Service Providers:</strong> With third-party vendors who
                perform services on our behalf (hosting, payment processing,
                analytics).
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law, court
                order, or governmental regulation under Indian law.
              </li>
              <li>
                <strong>Business Transfers:</strong> In connection with a merger,
                acquisition, or sale of assets (we will notify you before your
                data becomes subject to a different privacy policy).
              </li>
              <li>
                <strong>With Your Consent:</strong> When you explicitly authorize
                sharing.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              5. Data Retention
            </h2>
            <p>
              We retain your personal information for as long as your account is
              active or as needed to provide the Service. We will also retain
              your data as necessary to comply with legal obligations, resolve
              disputes, and enforce our agreements.
            </p>
            <p>
              When you delete your account, we will remove your personal data
              within 30 days, except where we are required to retain certain
              records for legal or compliance purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              6. Data Security
            </h2>
            <p>
              We implement industry-standard security measures including SSL/TLS
              encryption, Supabase Row Level Security (RLS), and access controls.
              However, no method of electronic transmission or storage is
              completely secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              7. Your Rights
            </h2>
            <p>Under Indian data protection laws, you have the right to:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Access the personal information we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your personal data.</li>
              <li>Object to processing of your personal data.</li>
              <li>Withdraw consent at any time.</li>
            </ul>
            <p>
              To exercise these rights, contact us at{" "}
              <a
                href="mailto:privacy@qrslice.com"
                className="text-brand hover:underline"
              >
                privacy@qrslice.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              8. Third-Party Services
            </h2>
            <p>Our Service integrates with the following third-party services:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>Supabase:</strong> Database, authentication, and
                real-time data sync.
              </li>
              <li>
                <strong>Razorpay:</strong> Payment processing.
              </li>
              <li>
                <strong>Vercel:</strong> Application hosting and deployment.
              </li>
              <li>
                <strong>WhatsApp (via Baileys):</strong> Order notifications and
                customer communication.
              </li>
            </ul>
            <p>
              Each third-party service has its own privacy policy. We encourage
              you to review their policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              9. Children&apos;s Privacy
            </h2>
            <p>
              The Service is not intended for individuals under 18 years of age.
              We do not knowingly collect personal information from children. If
              we learn that we have collected personal data from a child, we will
              take steps to delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              10. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of any material changes by posting the new policy on
              this page and updating the &quot;Last updated&quot; date. Your
              continued use of the Service after changes are posted constitutes
              acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">11. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please contact us:</p>
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

