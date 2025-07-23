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

  const getInitials = (fullName: string) => {
    if (!fullName) return 'U';
    const names = fullName.trim().split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
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
                className="w-10 h-10 rounded-full cursor-pointer flex items-center justify-center focus:outline-none"
                aria-label="Profile menu"
              >
                {session ? (
                  <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                    {getInitials(profile?.full_name || session.email || 'User')}
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-semibold text-sm">
                    ?
                  </div>
                )}
              </button>
              
              {dropdownOpen && (
                <div
                  ref={dropdownRef}
                  className="absolute right-0 mt-2 z-10 bg-white divide-y divide-gray-100 rounded-lg shadow-sm w-44 dark:bg-gray-700 dark:divide-gray-600"
                >
                  {session ? (
                    <>
                      <div className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        <div className="font-medium">{profile?.full_name || 'User'}</div>
                        <div className="truncate text-gray-500 dark:text-gray-400">{session.email}</div>
                      </div>
                      <ul className="py-2 text-sm text-gray-700 dark:text-gray-200">
                        <li>
                          <a href="/event" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">My Events</a>
                        </li>
                        <li>
                          <a href="/my-rsvps" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">My RSVPs</a>
                        </li>
                        <li>
                          <a href="/create-event" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Create Event</a>
                        </li>
                      </ul>
                      <div className="py-1">
                        <button
                          onClick={handleSignInDifferent}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                        >
                          Switch Account
                        </button>
                        <button
                          onClick={handleSignOut}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                        >
                          Sign out
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="py-1">
                      <button
                        onClick={handleSignIn}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                      >
                        Sign in with Google
                      </button>
                    </div>
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
