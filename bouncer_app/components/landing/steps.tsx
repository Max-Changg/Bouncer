'use client';

import { useState } from 'react';
import QRCode from 'react-qr-code';
import { useReducedMotion, useScrollProgress } from './use-scroll';

const STEPS = [
  {
    n: '01',
    title: 'Create your event',
    desc: 'Name, date, venue, ticket tiers and pricing — your event is live in about a minute.',
  },
  {
    n: '02',
    title: 'Send QR passes',
    desc: 'Every guest gets a unique QR pass by email, text, or a shareable link.',
  },
  {
    n: '03',
    title: 'Verify payments automatically',
    desc: 'Upload your Venmo and Zelle statements — Bouncer matches every payment to its guest.',
  },
  {
    n: '04',
    title: 'Scan at the door',
    desc: 'Check guests in from your phone. Payment status shows the moment a pass scans.',
  },
];

function Panel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[0_20px_44px_-24px_rgba(20,19,24,0.22)] sm:p-6">
      <div className="mb-4 font-mono text-[10px] tracking-[0.18em] text-[var(--muted-foreground)]">
        {label}
      </div>
      <div className="flex flex-1 items-center justify-center">{children}</div>
    </div>
  );
}

function CreatePanel() {
  const fields = ['EVENT NAME', 'DATE & TIME', 'VENUE', 'TICKETS & PRICING'];
  return (
    <Panel label="NEW EVENT">
      <div className="w-full max-w-sm rounded-xl border border-[var(--line)] bg-white p-5 shadow-sm">
        <div className="text-sm font-semibold text-[var(--ink)]">Rooftop Social</div>
        <div className="mt-4 space-y-3">
          {fields.map(f => (
            <div key={f}>
              <div className="mb-1 font-mono text-[9px] tracking-[0.16em] text-[var(--muted-foreground)]">
                {f}
              </div>
              <div className="h-7 rounded-md border border-[var(--line)] bg-[var(--surface)]" />
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <span className="rounded-md bg-[var(--violet)] px-3 py-1.5 text-xs font-medium text-white">
            Publish event
          </span>
        </div>
      </div>
    </Panel>
  );
}

function InvitePanel() {
  return (
    <Panel label="INVITES">
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-[var(--surface)] p-2.5">
              <QRCode
                title="Guest QR pass"
                value="https://bouncer.app/rsvp/0418"
                size={64}
                fgColor="#141318"
                bgColor="transparent"
              />
            </div>
            <div className="text-left">
              <div className="font-mono text-[9px] tracking-[0.16em] text-[var(--muted-foreground)]">
                GUEST PASS
              </div>
              <div className="text-sm font-semibold text-[var(--ink)]">Leo Kim</div>
              <div className="font-mono text-[10px] text-[var(--muted-foreground)]">GA · $15.00</div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <span className="rounded-full border border-[var(--line)] bg-white px-3 py-1 font-mono text-[10px] tracking-wide text-[var(--muted-foreground)]">
            142 PASSES SENT
          </span>
          <span className="rounded-full border border-[var(--line)] bg-white px-3 py-1 font-mono text-[10px] tracking-wide text-[var(--muted-foreground)]">
            EMAIL · SMS · LINK
          </span>
        </div>
      </div>
    </Panel>
  );
}

function VerifyPanel() {
  const rows = [
    { name: 'Ava Chen', via: 'VENMO' },
    { name: 'Leo Kim', via: 'ZELLE' },
    { name: 'Sam Osei', via: 'VENMO' },
  ];
  return (
    <Panel label="PAYMENT MATCHING">
      <div className="w-full max-w-sm space-y-2.5">
        {rows.map(r => (
          <div
            key={r.name}
            className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-white px-4 py-3 shadow-sm"
          >
            <div className="text-left">
              <div className="text-sm font-semibold text-[var(--ink)]">{r.name}</div>
              <div className="font-mono text-[10px] text-[var(--muted-foreground)]">
                $15.00 · {r.via}
              </div>
            </div>
            <span className="rounded-md bg-[var(--ok-bg)] px-2 py-1 font-mono text-[10px] font-semibold tracking-wide text-[var(--ok)]">
              ✓ MATCHED
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ScanPanel() {
  return (
    <Panel label="DOOR SCANNER">
      <div className="flex w-[210px] flex-col gap-3 rounded-[1.75rem] border border-[var(--line)] bg-white p-3.5 shadow-sm">
        <div className="relative flex h-[170px] items-center justify-center rounded-2xl bg-[var(--surface)]">
          {/* Viewfinder corner brackets */}
          <span className="absolute left-3 top-3 h-4 w-4 rounded-tl border-l-2 border-t-2 border-[var(--ink)]/50" />
          <span className="absolute right-3 top-3 h-4 w-4 rounded-tr border-r-2 border-t-2 border-[var(--ink)]/50" />
          <span className="absolute bottom-3 left-3 h-4 w-4 rounded-bl border-b-2 border-l-2 border-[var(--ink)]/50" />
          <span className="absolute bottom-3 right-3 h-4 w-4 rounded-br border-b-2 border-r-2 border-[var(--ink)]/50" />
          <QRCode
            title="Guest QR pass being scanned"
            value="https://bouncer.app/rsvp/0417"
            size={84}
            fgColor="#141318"
            bgColor="transparent"
          />
        </div>
        <div className="rounded-xl bg-[var(--ok-bg)] px-3 py-2.5 text-left">
          <div className="text-xs font-semibold text-[var(--ok)]">✓ Ava Chen · GA</div>
          <div className="font-mono text-[10px] text-[var(--ok)]/80">
            PAYMENT VERIFIED — CHECKED IN
          </div>
        </div>
      </div>
    </Panel>
  );
}

const PANELS = [CreatePanel, InvitePanel, VerifyPanel, ScanPanel];

function StepText({ step, animate }: { step: (typeof STEPS)[number]; animate: boolean }) {
  return (
    <div key={step.n} className={animate ? 'step-swap' : undefined}>
      <div className="font-mono text-sm tracking-[0.14em] text-[var(--violet)]">
        {step.n} <span className="text-[var(--muted-foreground)]">/ 04</span>
      </div>
      <h3 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
        {step.title}
      </h3>
      <p className="mt-4 max-w-md text-base text-[var(--muted-foreground)] sm:text-lg">{step.desc}</p>
    </div>
  );
}

export default function LandingSteps() {
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  const ref = useScrollProgress<HTMLElement>(p => {
    const idx = Math.min(3, Math.floor(p * 4));
    setActive(prev => (prev === idx ? prev : idx));
  });

  if (reduced) {
    return (
      <section id="how-it-works" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="font-mono text-[11px] tracking-[0.2em] text-[var(--violet)]">
            HOW IT WORKS
          </div>
          <div className="mt-10 space-y-16">
            {STEPS.map((step, i) => {
              const StepPanel = PANELS[i];
              return (
                <div
                  key={step.n}
                  className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-16"
                >
                  <StepText step={step} animate={false} />
                  <div className="h-[340px]">
                    <StepPanel />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="how-it-works" ref={ref} className="relative h-[380svh]">
      <div className="sticky top-0 flex h-svh items-center">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-8 px-6 md:grid-cols-2 md:gap-16">
          <div>
            <div className="font-mono text-[11px] tracking-[0.2em] text-[var(--violet)]">
              HOW IT WORKS
            </div>
            <div className="mt-6 min-h-[190px] sm:min-h-[210px]">
              <StepText step={STEPS[active]} animate />
            </div>
            <div className="mt-8 h-1 max-w-md overflow-hidden rounded-full bg-[var(--line)]">
              <div className="steps-rail-fill h-full rounded-full bg-[var(--violet)]" />
            </div>
          </div>

          <div className="relative h-[320px] sm:h-[400px]">
            {PANELS.map((StepPanel, i) => (
              <div
                key={i}
                aria-hidden={i !== active}
                className={`absolute inset-0 transition-all duration-500 ${
                  i === active
                    ? 'scale-100 opacity-100'
                    : 'pointer-events-none scale-[0.97] opacity-0'
                }`}
              >
                <StepPanel />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
