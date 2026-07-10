import Link from "next/link";
import Header from "@/components/header";
import Footer from "@/components/footer";

export const metadata = {
  title: "Security — Bouncer",
  description: "How Bouncer protects your data and how to report a vulnerability.",
};

export default function Security() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="font-mono text-[11px] tracking-[0.2em] text-primary uppercase">
            Policies
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Security
          </h1>

          <div className="mt-10 space-y-10 text-sm leading-relaxed text-foreground/90">
            <section>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">
                How we protect your data
              </h2>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  All traffic to and from Bouncer is encrypted in transit with
                  HTTPS.
                </li>
                <li>
                  Sign-in is handled by Google OAuth — we never see or store
                  your password.
                </li>
                <li>
                  Database access is protected by row-level security, so users
                  can only read the data they are entitled to.
                </li>
                <li>
                  Gmail authorization tokens are encrypted at rest and stored
                  in a table that browser clients cannot access at all — only
                  our server can read it.
                </li>
                <li>
                  Your check-in QR code contains only an internal account
                  identifier — no name, email, or other personal information.
                </li>
              </ul>
              <p className="mt-3">
                For details on what data we collect and why, see our{" "}
                <Link
                  href="/privacy"
                  className="text-primary underline underline-offset-4"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">
                Reporting a vulnerability
              </h2>
              <p>
                If you believe you&apos;ve found a security issue in Bouncer,
                please email{" "}
                <a
                  href="mailto:otie.net@gmail.com"
                  className="text-primary underline underline-offset-4"
                >
                  otie.net@gmail.com
                </a>{" "}
                with a description of the issue and steps to reproduce it.
                Please give us a reasonable opportunity to investigate and fix
                the issue before disclosing it publicly, and do not access or
                modify other users&apos; data while researching. We take every
                report seriously and will respond as quickly as we can.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
