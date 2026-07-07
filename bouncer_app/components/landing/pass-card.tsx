import QRCode from 'react-qr-code';

/** The signature hero artifact: a guest's QR entry pass with a verified-payment stamp. */
export function HeroPass() {
  return (
    <div className="relative w-[290px] rounded-2xl border border-[var(--line)] bg-white p-6 text-left shadow-[0_24px_48px_-20px_rgba(20,19,24,0.28)] sm:w-[320px]">
      <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.18em] text-[var(--muted-foreground)]">
        <span className="text-[var(--violet)]">BOUNCER PASS</span>
        <span>№ 0417</span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-[var(--ink)]">
          Rooftop Social
        </h2>
        <span className="whitespace-nowrap pb-0.5 font-mono text-[10px] tracking-wide text-[var(--muted-foreground)]">
          SAT AUG 22 · 8 PM
        </span>
      </div>

      <div className="mt-4 flex justify-center rounded-xl bg-[var(--surface)] py-5">
        <QRCode
          title="Guest QR pass"
          value="https://bouncer.app/rsvp/0417"
          size={116}
          fgColor="#141318"
          bgColor="transparent"
        />
      </div>

      {/* Perforation divider with punched side notches */}
      <div className="relative mt-5">
        <div className="border-t border-dashed border-[var(--line)]" />
        <span className="absolute -left-[34px] top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border border-[var(--line)] bg-[var(--surface)]" />
        <span className="absolute -right-[34px] top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border border-[var(--line)] bg-[var(--surface)]" />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <div className="font-mono text-[9px] tracking-[0.18em] text-[var(--muted-foreground)]">
            GUEST
          </div>
          <div className="text-sm font-semibold text-[var(--ink)]">Ava Chen</div>
        </div>
        <span className="font-mono text-xs text-[var(--muted-foreground)]">GA · $15.00</span>
      </div>

      <div className="stamp-land absolute bottom-[86px] right-4 rounded-md border-2 border-[var(--ok)] bg-[var(--ok-bg)]/95 px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.16em] text-[var(--ok)]">
        VERIFIED · VENMO
      </div>
    </div>
  );
}

/** Compact guest-list tile used in the hero mosaic. */
export function MiniPass({
  name,
  tier,
  highlight = false,
}: {
  name: string;
  tier: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2.5 shadow-sm sm:rounded-xl sm:px-4 sm:py-3 ${
        highlight
          ? 'border-[var(--violet)]/40 ring-1 ring-[var(--violet)]/25'
          : 'border-[var(--line)]'
      }`}
    >
      <div className="min-w-0 text-left">
        <div className="truncate text-xs font-semibold text-[var(--ink)] sm:text-sm">
          {name}
        </div>
        <div className="whitespace-nowrap font-mono text-[9px] tracking-[0.14em] text-[var(--muted-foreground)]">
          {tier}
          <span className="hidden sm:inline"> · VERIFIED</span>
        </div>
      </div>
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--ok-bg)] text-[var(--ok)]">
        <svg
          viewBox="0 0 12 12"
          className="h-3 w-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M2 6.5 4.8 9 10 3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
}
