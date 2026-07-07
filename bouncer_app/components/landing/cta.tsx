import Link from 'next/link';

export default function LandingCta() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto flex max-w-6xl flex-col items-center rounded-3xl bg-[var(--violet)] px-6 py-16 text-center sm:py-20">
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Create your first event in minutes.
        </h2>
        <p className="mt-4 max-w-md text-base text-white/75">
          Free to set up. No per-ticket fees. Your guests scan in at the door.
        </p>
        <Link
          href="/create-event"
          className="mt-8 rounded-lg bg-white px-6 py-3 text-sm font-medium text-[var(--violet)] shadow-sm transition-colors hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Create an event
        </Link>
      </div>
    </section>
  );
}
