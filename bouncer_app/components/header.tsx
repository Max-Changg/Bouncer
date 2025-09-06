'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
// Using native anchors for consistent full navigations through middleware
import { useState, useEffect, Suspense } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { Database } from '@/lib/database.types';
import type { User } from '@supabase/supabase-js';

function HeaderContent() {
  const [session, setSession] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  // Dropdown handled by shadcn menu
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

  // Removed manual outside-click logic; Radix handles it

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
      console.error('Error checking session:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    router.push('/login');
  };

  const handleSignIn = async () => {
    router.push('/login');
  };

  const handleSignInDifferent = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    // Redirect to login with next param set to current page
    let currentUrl = pathname;
    if (typeof window !== 'undefined') {
      currentUrl = window.location.pathname + window.location.search;
    } else if (searchParams) {
      currentUrl =
        pathname +
        (searchParams.toString() ? `?${searchParams.toString()}` : '');
    }
    router.push(`/login?next=${encodeURIComponent(currentUrl)}`);
  };

  return (
    <div className="sticky top-0 z-50">
      <header className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 md:py-5 flex items-center justify-between bg-black/25 backdrop-blur-md border-b border-white/10 rounded-b-2xl">
        <a href="/" className="relative font-extrabold tracking-tight text-white text-2xl md:text-3xl">
          <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-200 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(168,85,247,0.25)]">
            Bouncer
          </span>
        </a>
        <nav>
          <ul className="flex items-center gap-2 sm:gap-3 md:gap-4">

            <li>
              <a href="/event" className="group relative inline-flex items-center px-3 py-2 text-sm md:text-base text-gray-300 hover:text-white transition-colors">
                <span>My Events</span>
                <span className="pointer-events-none absolute inset-0 rounded-md bg-white/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>
                <span className="pointer-events-none absolute left-1/2 -bottom-0.5 h-[2px] w-0 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300 group-hover:left-0 group-hover:w-full"></span>
              </a>
            </li>
            <li>
              <a href="/my-rsvps" className="group relative inline-flex items-center px-3 py-2 text-sm md:text-base text-gray-300 hover:text-white transition-colors">
                <span>My RSVPs</span>
                <span className="pointer-events-none absolute inset-0 rounded-md bg-white/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>
                <span className="pointer-events-none absolute left-1/2 -bottom-0.5 h-[2px] w-0 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300 group-hover:left-0 group-hover:w-full"></span>
              </a>
            </li>
            <li className="relative ml-1 md:ml-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="group flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-purple-500/30"
                    aria-label="User menu"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 32 32"
                      className="h-6 w-6 transition-transform group-hover:scale-105"
                      xmlSpace="preserve"
                    >
                      <path d="M16 31C7.729 31 1 24.271 1 16S7.729 1 16 1s15 6.729 15 15-6.729 15-15 15zm0-28C8.832 3 3 8.832 3 16s5.832 13 13 13 13-5.832 13-13S23.168 3 16 3z" fill="currentColor"/>
                      <circle cx="16" cy="11.368" r="3.368" fill="currentColor"/>
                      <path d="M20.673 24h-9.346c-.83 0-1.502-.672-1.502-1.502v-.987a5.404 5.404 0 0 1 5.403-5.403h1.544a5.404 5.404 0 0 1 5.403 5.403v.987c0 .83-.672 1.502-1.502 1.502z" fill="currentColor"/>
                    </svg>
                    <span className="absolute -inset-px rounded-full bg-gradient-to-r from-purple-500/0 via-indigo-500/0 to-purple-500/0 opacity-0 blur transition-opacity duration-300 group-hover:opacity-20" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-black/85 text-white border border-white/10 backdrop-blur-md min-w-[12rem]">
                  {session ? (
                    <>
                      <DropdownMenuLabel className="text-white/80">
                        <div className="font-semibold">{profile?.full_name || 'User'}</div>
                        <div className="truncate text-xs text-white/60">{session.email}</div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem onSelect={() => (window.location.href = '/event')}>
                        My Events
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => (window.location.href = '/my-rsvps')}>
                        My RSVPs
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => (window.location.href = '/qr-code')}>
                        My QR Code
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem onSelect={handleSignInDifferent}>
                        Switch Account
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={handleSignOut} data-variant="destructive">
                        Sign out
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem onSelect={handleSignIn}>Sign in with Google</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          </ul>
        </nav>
      </header>
    </div>
  );
}

export default function Header() {
  return (
    <Suspense fallback={
      <div className="bg-white shadow-sm">
        <header className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">Bouncer</h1>
              </div>
            </div>
          </div>
        </header>
      </div>
    }>
      <HeaderContent />
    </Suspense>
  );
}
