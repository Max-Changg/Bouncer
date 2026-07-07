'use client';

import Link from 'next/link';
import { HeroPass, MiniPass } from './pass-card';
import { useReducedMotion, useScrollProgress } from './use-scroll';

const GUESTS: Array<{ name: string; tier: string; highlight?: boolean }> = [
  { name: 'Jordan M.', tier: 'VIP' },
  { name: 'Priya P.', tier: 'GA' },
  { name: 'Leo K.', tier: 'GA' },
  { name: 'Maya R.', tier: 'VIP' },
  { name: 'Ava Chen', tier: 'GA', highlight: true },
  { name: 'Sam O.', tier: 'GA' },
  { name: 'Zoe A.', tier: 'GA' },
  { name: 'Noah P.', tier: 'GA' },
  { name: 'Tess N.', tier: 'VIP' },
];

function HeroCopy() {
  return (
    <div className="hero-copy flex max-w-2xl flex-col items-center text-center">
      <span className="landing-rise inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--surface)] px-3.5 py-1.5 font-mono text-[10px] tracking-[0.2em] text-[var(--violet)]">
        EVENT CHECK-IN &amp; TICKETING
      </span>
      <h1
        className="landing-rise mt-6 text-4xl font-semibold leading-[1.05] tracking-tight text-[var(--ink)] sm:text-5xl md:text-6xl"
        style={
          { '--rise-delay': '0.12s', '--rise-duration': '1.4s' } as React.CSSProperties
        }
      >
        Event check-in,
        <br />
        without the chaos.
      </h1>
      <p
        className="landing-rise mt-5 max-w-xl text-base text-[var(--muted-foreground)] sm:text-lg"
        style={{ '--rise-delay': '0.5s' } as React.CSSProperties}
      >
        Create your event, send unique QR passes, verify Venmo and Zelle
        payments automatically, and scan guests in at the door — with no
        per-ticket fees.
      </p>
      <div
        className="landing-rise mt-8 flex items-center gap-3"
        style={{ '--rise-delay': '0.65s' } as React.CSSProperties}
      >
        <Link
          href="/create-event"
          className="rounded-lg bg-[var(--violet)] px-5 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#5b21b6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--violet)]"
        >
          Create an event
        </Link>
        <a
          href="#how-it-works"
          className="rounded-lg border border-[var(--line)] bg-white px-5 py-3 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--surface)]"
        >
          See how it works
        </a>
      </div>
    </div>
  );
}

function Mosaic({ withScrollClasses }: { withScrollClasses: boolean }) {
  return (
    <div className="flex flex-col items-center px-6">
      <div className="grid w-[min(92vw,600px)] grid-cols-3 gap-2.5 sm:gap-3.5">
        {GUESTS.map((guest, i) => (
          <div
            key={guest.name}
            className={withScrollClasses ? 'hero-tile' : undefined}
            style={{ '--i': i } as React.CSSProperties}
          >
            <MiniPass name={guest.name} tier={guest.tier} highlight={guest.highlight} />
          </div>
        ))}
      </div>
      <div
        className={`mt-10 max-w-md text-center ${withScrollClasses ? 'hero-caption' : ''}`}
      >
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--ink)] sm:text-3xl">
          Every guest verified before the door.
        </h2>
        <p className="mt-3 text-sm text-[var(--muted-foreground)] sm:text-base">
          Unique QR passes for each guest, cross-checked against your Venmo and
          Zelle statements.
        </p>
      </div>
    </div>
  );
}

export default function LandingHero() {
  const reduced = useReducedMotion();
  const ref = useScrollProgress<HTMLElement>(p => {
    const el = ref.current;
    if (el) el.dataset.phase = p > 0.42 ? 'list' : 'intro';
  });

  if (reduced) {
    return (
      <section className="px-6 pb-20 pt-16 sm:pt-24">
        <div className="flex flex-col items-center gap-14">
          <HeroCopy />
          <HeroPass />
          <Mosaic withScrollClasses={false} />
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="hero-root relative h-[260svh]" data-phase="intro">
      <div className="sticky top-0 flex h-svh flex-col items-center justify-center overflow-hidden px-6 pb-24">
        <div className="hero-intro flex flex-col items-center gap-6 sm:gap-9">
          <HeroCopy />
          <div className="hero-pass-wrap relative">
            {/* Soft brand glow behind the pass */}
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[820px] -translate-x-1/2 -translate-y-1/2"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(109, 40, 217, 0.08), transparent 62%)',
              }}
              aria-hidden="true"
            />
            <div
              className="landing-rise"
              style={{ '--rise-delay': '1.05s' } as React.CSSProperties}
            >
              <HeroPass />
            </div>
            {/* Floating product context beside the pass (illustrative) */}
            <div
              className="landing-rise absolute -left-56 top-16 hidden -rotate-3 items-center gap-3 rounded-xl border border-[var(--line)] bg-white px-4 py-3 shadow-[0_16px_36px_-18px_rgba(20,19,24,0.25)] md:flex"
              style={{ '--rise-delay': '0.75s' } as React.CSSProperties}
              aria-hidden="true"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--ok-bg)] text-[var(--ok)]">
                <svg
                  viewBox="0 0 12 12"
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M2 6.5 4.8 9 10 3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div>
                <div className="text-sm font-semibold text-[var(--ink)]">
                  Leo K. checked in
                </div>
                <div className="font-mono text-[10px] tracking-wide text-[var(--muted-foreground)]">
                  9:42 PM · GA
                </div>
              </div>
            </div>
            <div
              className="landing-rise absolute -right-52 bottom-24 hidden rotate-2 rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-left shadow-[0_16px_36px_-18px_rgba(20,19,24,0.25)] md:block"
              style={{ '--rise-delay': '0.95s' } as React.CSSProperties}
              aria-hidden="true"
            >
              <div className="text-lg font-semibold tracking-tight text-[var(--ink)]">
                142<span className="text-[var(--muted-foreground)]">/156</span>
              </div>
              <div className="font-mono text-[10px] tracking-[0.14em] text-[var(--muted-foreground)]">
                PASSES SENT
              </div>
            </div>
          </div>
        </div>

        {/* Guest-list mosaic the pass morphs into; illustrative duplicate of the pass content */}
        <div
          className="hero-mosaic pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <Mosaic withScrollClasses />
        </div>

        {/* bottom-24 ≈ header height (72px) + 24px, so the hint clears the fold at load */}
        <div className="hero-hint pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.2em] text-[var(--muted-foreground)]">
          SCROLL
        </div>
      </div>
    </section>
  );
}
