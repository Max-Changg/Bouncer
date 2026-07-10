import Link from "next/link";
import Header from "@/components/header";
import Footer from "@/components/footer";

export const metadata = {
  title: "Terms of Service — Bouncer",
  description: "The rules for using Bouncer.",
};

const EFFECTIVE_DATE = "July 10, 2026";

export default function TermsOfService() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="font-mono text-[11px] tracking-[0.2em] text-primary uppercase">
            Policies
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Effective date: {EFFECTIVE_DATE}
          </p>

          <div className="mt-10 space-y-10 text-sm leading-relaxed text-foreground/90">
            <section>
              <p>
                These terms are an agreement between you and Bouncer
                (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) covering
                your use of the Bouncer service — creating events, RSVPing,
                and checking in guests. By using Bouncer, you agree to these
                terms and to our{" "}
                <Link
                  href="/privacy"
                  className="text-primary underline underline-offset-4"
                >
                  Privacy Policy
                </Link>
                . If you do not agree, do not use the service.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">
                Eligibility
              </h2>
              <p>
                You must be at least 13 years old to use Bouncer. By using the
                service, you represent that you meet this requirement and that
                any registration information you provide is accurate.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">
                Your account
              </h2>
              <p>
                You sign in with your Google account. You are responsible for
                activity that happens under your account and for keeping your
                Google credentials secure. If you believe your account has
                been accessed without your permission, contact us right away.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">
                Events are the organizer&apos;s responsibility
              </h2>
              <p>
                Bouncer is a tool for managing events; we do not host,
                organize, sponsor, or supervise them. Organizers are solely
                responsible for their events, including their legality,
                safety, admission decisions, and anything that happens at
                them. Guests attend events at their own discretion. We are not
                a party to any arrangement between organizers and guests.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">
                Payments
              </h2>
              <p>
                Bouncer does not process payments. Organizers may request
                payment for tickets through third-party services such as Venmo
                or Zelle; those transactions are strictly between the guest
                and the organizer, on the third-party service&apos;s own
                terms. We do not hold funds, issue refunds, or mediate payment
                disputes. Payment-proof screenshots uploaded to Bouncer are
                used only so organizers can verify payment.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">
                Your content
              </h2>
              <p>
                You keep ownership of the content you submit — event details,
                RSVP information, and uploaded images. You grant us a limited
                license to store, process, and display that content as needed
                to operate the service. You are responsible for what you
                submit and must have the right to share it.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">
                Acceptable use
              </h2>
              <p>You agree not to:</p>
              <ul className="mt-2 list-disc space-y-2 pl-5">
                <li>
                  Use Bouncer for anything unlawful, or create events that
                  promote illegal activity.
                </li>
                <li>
                  Use the email feature to send spam or unsolicited messages —
                  only message guests who RSVP&apos;d to your event, and
                  comply with applicable anti-spam laws.
                </li>
                <li>
                  Impersonate others, misrepresent an event, or submit false
                  RSVP or payment information.
                </li>
                <li>
                  Probe, scrape, disrupt, or attempt to gain unauthorized
                  access to the service or other users&apos; data.
                </li>
              </ul>
              <p className="mt-3">
                We may suspend or terminate accounts that violate these terms.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">
                Gmail sending (organizers)
              </h2>
              <p>
                If you connect your Gmail account, you authorize Bouncer to
                send emails to your guest list on your behalf, from your
                address. You are responsible for the content of those emails.
                You can revoke this access at any time from your{" "}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-4"
                >
                  Google account settings
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">
                Termination
              </h2>
              <p>
                You can stop using Bouncer at any time and request deletion of
                your account and data. We may suspend or terminate access to
                the service for violations of these terms or to protect the
                service and its users.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">
                Disclaimers and limitation of liability
              </h2>
              <p>
                Bouncer is provided &quot;as is&quot; and &quot;as
                available,&quot; without warranties of any kind, express or
                implied. To the fullest extent permitted by law, we are not
                liable for any damages of any kind arising from your use of
                the service — including indirect, incidental, special, or
                consequential damages, anything arising from events organized
                or attended through the service, payment disputes between
                users, or loss of data. If we are nonetheless found liable,
                our total liability for all claims relating to the service is
                limited to the amount you have paid us in the past twelve
                months.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">
                Governing law
              </h2>
              <p>
                These terms are governed by the laws of the State of
                California, without regard to conflict-of-law principles.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">
                Changes to these terms
              </h2>
              <p>
                We may update these terms from time to time. If we make
                material changes, we will update the effective date above and
                notify you through the service or by email. Continuing to use
                Bouncer after changes take effect means you accept the updated
                terms.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">
                Contact us
              </h2>
              <p>
                Questions about these terms? Email us at{" "}
                <a
                  href="mailto:otie.net@gmail.com"
                  className="text-primary underline underline-offset-4"
                >
                  otie.net@gmail.com
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
