'use client';

import { useEffect, useRef, useState } from 'react';

const ROWS: Array<{ label: string; value: string; strong?: boolean }> = [
  { label: 'Ticket (GA)', value: '$15.00' },
  { label: 'Service fee', value: '$0.00' },
  { label: 'Processing fee', value: '$0.00' },
  { label: 'Guest pays', value: '$15.00', strong: true },
  { label: 'You receive', value: '$15.00', strong: true },
];

export default function LandingReceipt() {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="bg-[var(--surface)] px-6 py-24">
      <div
        className={`mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-20 ${
          inView ? 'receipt-in' : ''
        }`}
      >
        <div>
          <div className="font-mono text-[11px] tracking-[0.2em] text-[var(--violet)]">
            PRICING
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
            No service fees. Ever.
          </h2>
          <p className="mt-5 max-w-md text-base text-[var(--muted-foreground)] sm:text-lg">
            Guests pay you directly over Venmo or Zelle. Bouncer verifies every
            payment against your statement — and never takes a cut.
          </p>
          <p className="mt-3 max-w-md text-sm text-[var(--muted-foreground)]">
            Typical ticketing platforms add a service fee plus payment
            processing to every ticket sold.
          </p>
        </div>

        <div className="mx-auto w-full max-w-sm rounded-xl border border-[var(--line)] bg-white p-6 font-mono text-sm shadow-[0_20px_44px_-24px_rgba(20,19,24,0.22)]">
          <div
            className="receipt-row text-[10px] tracking-[0.18em] text-[var(--muted-foreground)]"
            style={{ '--i': 0 } as React.CSSProperties}
          >
            ROOFTOP SOCIAL — GA TICKET
          </div>
          <div className="mt-4 space-y-2.5">
            {ROWS.map((row, i) => (
              <div key={row.label}>
                {row.label === 'Guest pays' && (
                  <div
                    className="receipt-row mb-2.5 border-t border-dashed border-[var(--line)]"
                    style={{ '--i': i + 1 } as React.CSSProperties}
                  />
                )}
                <div
                  className={`receipt-row flex items-baseline justify-between gap-3 ${
                    row.strong ? 'font-semibold text-[var(--ink)]' : 'text-[var(--muted-foreground)]'
                  }`}
                  style={{ '--i': i + 1 } as React.CSSProperties}
                >
                  <span>{row.label}</span>
                  <span className="mx-1 flex-1 border-b border-dotted border-[var(--line)]" />
                  <span>{row.value}</span>
                </div>
              </div>
            ))}
          </div>
          <div
            className="receipt-row mt-5 rounded-md bg-[var(--ok-bg)] px-3 py-2 text-center text-[10px] font-semibold tracking-[0.14em] text-[var(--ok)]"
            style={{ '--i': 7 } as React.CSSProperties}
          >
            PAID DIRECT TO YOU · VENMO / ZELLE
          </div>
        </div>
      </div>
    </section>
  );
}
