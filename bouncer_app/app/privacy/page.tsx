import Header from "@/components/header";
import Footer from "@/components/footer";

export const metadata = {
  title: "Privacy Policy — Bouncer",
  description: "How Bouncer collects, uses, and protects your information.",
};

const EFFECTIVE_DATE = "July 10, 2026";

export default function PrivacyPolicy() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="font-mono text-[11px] tracking-[0.2em] text-primary uppercase">
            Policies
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Effective date: {EFFECTIVE_DATE}
          </p>

          <div className="mt-10 space-y-10 text-sm leading-relaxed text-foreground/90">
            <section>
              <p>
                Bouncer (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;)
                provides tools for creating events, collecting RSVPs, and
                checking guests in with QR codes. This policy explains what
                information we collect, how we use it, and the choices you
                have. By using Bouncer, you agree to this policy.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">
                Information we collect
              </h2>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>Account information.</strong> We use Google Sign-In
                  as our only login method. When you sign in, we receive your
                  name, email address, and profile picture from Google.
                </li>
                <li>
                  <strong>RSVP information.</strong> When you RSVP to an
                  event, we collect the name and email address you provide,
                  the event you are attending, and your ticket and payment
                  status.
                </li>
                <li>
                  <strong>Payment proof images.</strong> For paid events, you
                  may upload a screenshot of your payment receipt (for
                  example, from Venmo or Zelle). These images are stored so
                  the event organizer can verify your payment. Bouncer does
                  not process payments directly and never collects card
                  numbers or bank credentials.
                </li>
                <li>
                  <strong>Check-in data.</strong> Your Bouncer QR code encodes
                  only an internal account identifier — it contains no name,
                  email, or other personal information. When your code is
                  scanned at an event, we record that you checked in.
                </li>
                <li>
                  <strong>Gmail connection (organizers only).</strong> If you
                  are an event organizer and choose to connect your Gmail
                  account to email your guest list, we store your Gmail
                  address and the authorization tokens Google provides so we
                  can send those emails on your behalf. We request only the
                  permissions needed to send email; we do not read your
                  inbox. You can disconnect Gmail at any time from your
                  Google account settings.
                </li>
              </ul>
              <p className="mt-3">
                Bouncer&apos;s use of information received from Google APIs
                adheres to the{" "}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-4"
                >
                  Google API Services User Data Policy
                </a>
                , including the Limited Use requirements.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">
                How we use your information
              </h2>
              <ul className="list-disc space-y-2 pl-5">
                <li>To create and manage events, RSVPs, and check-ins.</li>
                <li>
                  To let event organizers see who has RSVP&apos;d, verify
                  payments, and contact their guests.
                </li>
                <li>To operate, secure, and improve the service.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">
                What we don&apos;t do
              </h2>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>We do not sell your personal information.</strong>
                </li>
                <li>We do not show ads or share your data with advertisers.</li>
                <li>
                  We do not use third-party analytics or tracking scripts.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">
                Who we share information with
              </h2>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>Event organizers.</strong> When you RSVP to an
                  event, the organizer of that event can see your name, email,
                  RSVP status, payment status, and any payment proof you
                  upload.
                </li>
                <li>
                  <strong>Service providers.</strong> We use Supabase for our
                  database, authentication, and file storage; Google for
                  sign-in and (for organizers who opt in) sending email; and
                  Vercel for hosting. These providers process data only to
                  provide their services to us.
                </li>
                <li>
                  <strong>Legal requirements.</strong> We may disclose
                  information if required by law or to protect the rights,
                  safety, or property of Bouncer or others.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">
                Cookies
              </h2>
              <p>
                We use cookies solely to keep you signed in. We do not use
                advertising or tracking cookies.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">
                Camera access
              </h2>
              <p>
                The check-in scanner uses your device&apos;s camera to read
                guest QR codes. Camera video is processed on your device and
                is never recorded or uploaded.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">
                Children
              </h2>
              <p>
                Bouncer is not directed to children, and you must be at least
                13 years old to use the service. We do not knowingly collect
                personal information from anyone under 13. If we learn that we
                have collected personal information from a child under 13, we
                will delete it. If you believe a child under 13 has provided
                us personal information, please contact us at the address
                below.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">
                Data retention and deletion
              </h2>
              <p>
                We keep your information for as long as your account is active
                or as needed to provide the service. You may request deletion
                of your account and associated data at any time by emailing
                us, and we will delete it unless we are required to retain it
                by law.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">
                Security
              </h2>
              <p>
                We use industry-standard measures to protect your information,
                including encrypted connections (HTTPS) and access controls on
                our database and file storage. No method of transmission or
                storage is completely secure, so we cannot guarantee absolute
                security.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">
                Your rights
              </h2>
              <p>
                Depending on where you live, you may have the right to access,
                correct, or delete the personal information we hold about you.
                To exercise any of these rights, contact us at the address
                below and we will respond within a reasonable timeframe.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">
                Changes to this policy
              </h2>
              <p>
                We may update this policy from time to time. If we make
                material changes, we will update the effective date above and
                notify you through the service or by email.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">
                Contact us
              </h2>
              <p>
                Questions about this policy or your data? Email us at{" "}
                <a
                  href="mailto:hello@bouncer.app"
                  className="text-primary underline underline-offset-4"
                >
                  hello@bouncer.app
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
