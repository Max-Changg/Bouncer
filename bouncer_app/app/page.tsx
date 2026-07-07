export const dynamic = 'force-dynamic';

import { QrCode, Users, Wallet } from 'lucide-react';
import Footer from '@/components/footer';
import Header from '@/components/header';
import LandingCta from '@/components/landing/cta';
import LandingHero from '@/components/landing/hero';
import LandingReceipt from '@/components/landing/receipt';
import LandingSteps from '@/components/landing/steps';

const CAPABILITIES = [
  {
    icon: QrCode,
    eyebrow: 'UNIQUE QR PASSES',
    text: 'Each pass is tied to one guest — no shared or reused tickets at the door.',
  },
  {
    icon: Wallet,
    eyebrow: 'PAYMENT MATCHING',
    text: 'Venmo and Zelle payments are cross-checked against your statements automatically.',
  },
  {
    icon: Users,
    eyebrow: 'LIVE GUEST LIST',
    text: 'RSVPs and check-ins update in real time, with attendance analytics as doors open.',
  },
];

function Capabilities() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="font-mono text-[11px] tracking-[0.2em] text-[var(--violet)]">
          WHAT BOUNCER HANDLES
        </div>
        <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
          Everything the door needs, in one place.
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {CAPABILITIES.map(cap => (
            <div
              key={cap.eyebrow}
              className="rounded-xl border border-[var(--line)] bg-white p-6 shadow-sm"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--violet)]/10 text-[var(--violet)]">
                <cap.icon className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
              <div className="mt-4 font-mono text-[10px] tracking-[0.18em] text-[var(--violet)]">
                {cap.eyebrow}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink)]">{cap.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="landing min-h-screen">
      <Header />
      <main>
        <LandingHero />
        <LandingSteps />
        <Capabilities />
        <LandingReceipt />
        <LandingCta />
      </main>
      <Footer />
    </div>
  );
}
