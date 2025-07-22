'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import type { Database } from '@/lib/database.types';
import type { User } from '@supabase/supabase-js';

export default function Header() {
  const [session, setSession] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

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
    <div>
      <header className="text-xl flex items-center justify-between p-4 text-white">
        <a href="/" className="font-bold hover:underline">
          Bouncer
        </a>
        <nav>
          <ul className="flex space-x-4 items-center">
            <li>
              {/* <a href="/about" className="hover:underline">
                About
              </a> */}
            </li>
            <li>
              <a href="/contact" className="hover:underline">
                Contact
              </a>
            </li>
            <li>
              <a href="/event" className="hover:underline">
                My Events
              </a>
            </li>
            <li>
              <a href="/my-rsvps" className="hover:underline">
                My RSVPs
              </a>
            </li>
            <li className="relative">
              <button
                onClick={() => setDropdownOpen(open => !open)}
                className="flex items-center focus:outline-none"
                aria-label="Profile menu"
              >
                <svg
                  className="w-8 h-8 rounded-full bg-gray-600 text-white p-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
              {dropdownOpen && (
                <div
                  ref={dropdownRef}
                  className="absolute right-0 mt-2 w-64 bg-white text-black rounded-md shadow-lg z-50"
                >
                  {session ? (
                    <>
                      <div className="px-4 py-3 border-b flex items-center gap-3">
                        <svg
                          className="w-10 h-10 rounded-full bg-gray-600 text-white p-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <div>
                          <div className="font-semibold">
                            Welcome, {profile?.full_name || 'User'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {session.email}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleSignInDifferent}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        Sign in with a different account
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleSignIn}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Sign in with Google
                    </button>
                  )}
                </div>
              )}
            </li>
          </ul>
        </nav>
      </header>
    </div>
  );
}
