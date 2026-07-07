'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
// Using native anchors for consistent full navigations through middleware
import { useState, useEffect, Suspense } from 'react';
import { Menu, X } from 'lucide-react';
import type { Database } from '@/lib/database.types';
import type { User } from '@supabase/supabase-js';

const NAV_LINKS = [
  { href: '/event', label: 'My Events' },
  { href: '/my-rsvps', label: 'My RSVPs' },
  { href: '/qr-code', label: 'My QR Code' },
];

function HeaderContent() {
  const [session, setSession] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    checkSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session?.user || null);
      if (session?.user) {
        fetchProfile(session.user);
      } else setProfile(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (user: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      if (data && data.full_name) {
        setProfile({ full_name: data.full_name });
      } else {
        // fallback to user_metadata if available
        setProfile({ full_name: user.user_metadata?.full_name || 'User' });
      }
    } catch (error) {
      setProfile({ full_name: user.user_metadata?.full_name || 'User' });
    }
  };

  const checkSession = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session?.user || null);
      if (session?.user) {
        fetchProfile(session.user);
      } else setProfile(null);
    } catch (error) {
      // Error checking session
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    router.push('/');
  };

  const handleSignIn = async () => {
    let currentUrl = pathname;
    if (typeof window !== 'undefined') {
      currentUrl = window.location.pathname + window.location.search;
    } else if (searchParams) {
      currentUrl =
        pathname +
        (searchParams.toString() ? `?${searchParams.toString()}` : '');
    }
    router.push(`/api/auth/direct-google?next=${encodeURIComponent(currentUrl)}`);
  };

  const handleSignInDifferent = async () => {
    try {
      // Sign out and clear all session data
      await supabase.auth.signOut({ scope: 'global' });

      // Clear any cached authentication state
      setSession(null);
      setProfile(null);

      // Get current URL for redirect
      let currentUrl = pathname;
      if (typeof window !== 'undefined') {
        currentUrl = window.location.pathname + window.location.search;
      } else if (searchParams) {
        currentUrl =
          pathname +
          (searchParams.toString() ? `?${searchParams.toString()}` : '');
      }

      // Small delay to ensure cleanup, then force redirect
      setTimeout(() => {
        window.location.href = `/api/auth/direct-google?next=${encodeURIComponent(currentUrl)}`;
      }, 100);
    } catch (error) {
      // Error during sign out
      // Fallback: force redirect anyway
      let currentUrl = pathname;
      if (typeof window !== 'undefined') {
        currentUrl = window.location.pathname + window.location.search;
      }
      window.location.href = `/api/auth/direct-google?next=${encodeURIComponent(currentUrl)}`;
    }
  };

  return (
    <div className="sticky top-0 z-50 bg-white/85 backdrop-blur-md">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <a
          href="/"
          className="text-2xl font-extrabold tracking-tight text-primary md:text-3xl"
        >
          Bouncer
        </a>

        {/* Menu opener — nav stays hidden behind this at every screen size */}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-black/[0.04]"
          aria-expanded={menuOpen}
          aria-controls="main-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen(open => !open)}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Menu panel — animates open/closed, items sit right under the opener */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
          menuOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <nav
          id="main-menu"
          aria-label="Main"
          aria-hidden={!menuOpen}
          className={`overflow-hidden transition-[visibility] duration-300 ${
            menuOpen ? 'visible' : 'invisible'
          }`}
        >
          <div className="mx-auto flex max-w-7xl flex-col items-end gap-0.5 px-4 pb-6 pt-1 sm:px-6 lg:px-8">
            {session && (
              <div className="px-3 pb-2 text-right">
                <div className="text-sm font-semibold text-foreground">
                  {profile?.full_name || 'User'}
                </div>
                <div className="truncate font-mono text-[11px] text-muted-foreground">
                  {session.email}
                </div>
              </div>
            )}
            {NAV_LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                tabIndex={menuOpen ? 0 : -1}
                className="rounded-lg px-3 py-2 text-right text-base text-foreground transition-colors hover:bg-muted"
              >
                {link.label}
              </a>
            ))}
            {session ? (
              <>
                <button
                  type="button"
                  onClick={handleSignInDifferent}
                  tabIndex={menuOpen ? 0 : -1}
                  className="rounded-lg px-3 py-2 text-right text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Switch Account
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  tabIndex={menuOpen ? 0 : -1}
                  className="rounded-lg px-3 py-2 text-right text-sm text-red-600 transition-colors hover:bg-red-50"
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleSignIn}
                tabIndex={menuOpen ? 0 : -1}
                className="rounded-lg px-3 py-2 text-right text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Sign in with Google
              </button>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}

export default function Header() {
  return (
    <Suspense
      fallback={
        <div className="sticky top-0 z-50 bg-white/85 backdrop-blur-md">
          <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <span className="text-2xl font-extrabold tracking-tight text-primary md:text-3xl">
              Bouncer
            </span>
            <div className="flex h-10 w-10 items-center justify-center text-foreground">
              <Menu className="h-6 w-6" />
            </div>
          </header>
        </div>
      }
    >
      <HeaderContent />
    </Suspense>
  );
}
