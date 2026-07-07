'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect to Vercel deployment after a short delay
    const timer = setTimeout(() => {
      window.location.href = 'https://bouncer-silk.vercel.app/';
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-md text-center">
        {/* Eyebrow */}
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
          Error 404
        </p>

        {/* Headline */}
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Page not found
        </h1>

        {/* Message */}
        <p className="mt-3 text-muted-foreground">
          Redirecting you to our main site...
        </p>

        {/* Spinner */}
        <div
          className="mx-auto mt-8 h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary"
          aria-hidden="true"
        ></div>

        {/* Manual redirect button */}
        <a
          href="https://bouncer-silk.vercel.app/"
          className="mt-8 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-[#5b21b6]"
        >
          Go to Bouncer
        </a>

        {/* Additional info */}
        <p className="mt-6 text-sm text-muted-foreground">
          If you&#x27;re not redirected automatically, click the button above
        </p>
      </div>
    </div>
  );
}
