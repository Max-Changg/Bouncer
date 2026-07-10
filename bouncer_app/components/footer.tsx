'use client';

import Link from 'next/link';

const COLUMNS = [
  {
    heading: 'Explore',
    links: [
      { href: '/', label: 'Home' },
      { href: '/create-event', label: 'Create Event' },
      { href: '/event', label: 'My Events' },
      { href: '/my-rsvps', label: 'My RSVPs' },
      { href: '/qr-code', label: 'My QR Code' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { href: '/', label: 'Docs (coming soon)' },
      { href: '/', label: 'FAQ (coming soon)' },
      { href: '/', label: 'Changelog (coming soon)' },
    ],
  },
  {
    heading: 'Policies',
    links: [
      { href: '/security', label: 'Security' },
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/terms', label: 'Terms of Service' },
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted text-foreground">
      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Brand + blurb */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-extrabold tracking-tight text-primary">
                Bouncer
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Streamlined check-ins, RSVPs, and QR-powered entry for modern
              parties and events.
            </p>
            {/* Socials */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-foreground transition-colors hover:bg-black/10"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm0 2h10c1.654 0 3 1.346 3 3v10c0 1.654-1.346 3-3 3H7c-1.654 0-3-1.346-3-3V7c0-1.654 1.346-3 3-3zm11 1a1 1 0 100 2 1 1 0 000-2zM12 7a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Nav columns */}
          <div className="grid grid-cols-2 gap-8 md:col-span-2 md:grid-cols-3">
            {COLUMNS.map(col => (
              <div key={col.heading}>
                <h4 className="mb-3 font-mono text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  {col.heading}
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {col.links.map(link => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 md:flex-row">
          <p className="text-xs text-muted-foreground">
            © {year}, Bouncer. All Rights Reserved.
          </p>
          <div className="text-xs text-muted-foreground">
            <span>Contact: </span>
            <a
              className="underline-offset-4 hover:underline"
              href="mailto:otie.net@gmail.com"
            >
              otie.net@gmail.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
