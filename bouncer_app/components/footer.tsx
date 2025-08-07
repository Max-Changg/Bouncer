'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Footer() {
  const [email, setEmail] = useState('');
  const year = new Date().getFullYear();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    // Simple client-only placeholder action. Replace with your newsletter backend when ready.
    window.open(`mailto:hello@bouncer.app?subject=Subscribe&body=${encodeURIComponent(email)}`);
    setEmail('');
  };

  return (
    <footer className="relative mt-20 border-t border-white/10 bg-black/40 text-white">
      {/* Dotted grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
          color: '#ffffff',
          backgroundSize: '22px 22px',
          backgroundPosition: '0 0, 11px 11px',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Brand + blurb */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-200 bg-clip-text text-transparent">
                Bouncer
              </span>
            </Link>
            <p className="text-sm text-white/70">
              Streamlined check-ins, RSVPs, and QR-powered entry for modern parties and events.
            </p>
            {/* Socials */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm0 2h10c1.654 0 3 1.346 3 3v10c0 1.654-1.346 3-3 3H7c-1.654 0-3-1.346-3-3V7c0-1.654 1.346-3 3-3zm11 1a1 1 0 100 2 1 1 0 000-2zM12 7a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Nav columns */}
          <div className="grid grid-cols-2 gap-8 md:col-span-2 md:grid-cols-3">
            <div>
              <h4 className="mb-3 text-sm font-semibold tracking-wide text-white/80">Explore</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><Link href="/">Home</Link></li>
                <li><Link href="/create-event">Create Event</Link></li>
                <li><Link href="/event">My Events</Link></li>
                <li><Link href="/my-rsvps">My RSVPs</Link></li>
                <li><Link href="/qr-code">My QR Code</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold tracking-wide text-white/80">Resources</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><Link href="/">Docs (coming soon)</Link></li>
                <li><Link href="/">FAQ (coming soon)</Link></li>
                <li><Link href="/">Changelog (coming soon)</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold tracking-wide text-white/80">Policies</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><Link href="/SECURITY.md">Security</Link></li>
                <li><Link href="#">Privacy Policy</Link></li>
                <li><Link href="#">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-1">
            <h4 className="mb-3 text-sm font-semibold tracking-wide text-white/80">Get updates</h4>
            <p className="mb-3 text-sm text-white/70">No spam. Party news only.</p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                required
                aria-label="Email address"
              />
              <Button type="submit" className="bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800">
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 md:flex-row">
          <p className="text-xs text-white/60">© {year}, Bouncer. All Rights Reserved.</p>
          <div className="text-xs text-white/60">
            <span>Contact: </span>
            <a className="underline-offset-4 hover:underline" href="mailto:hello@bouncer.app">hello@bouncer.app</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

