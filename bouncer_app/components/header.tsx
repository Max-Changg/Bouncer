'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { Database } from '@/lib/database.types';
import type { Session, User } from '@supabase/supabase-js';

export default function Header() {
  const [session, setSession] = useState<User | null>(null);
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  useEffect(() => {
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session?.user || null);
    } catch (error) {
      console.error('Error checking session:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    router.push('/login'); // Redirect to login page after sign out
  };

  return (
    <div>
      <header className="flex items-center justify-between bg-gray-800 p-4 text-white">
        <a href="/" className="text-xl font-bold hover:underline">
          Bouncer
        </a>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <a href="/about" className="hover:underline">
                About
              </a>
            </li>
            <li>
              <a href="/contact" className="hover:underline">
                Contact
              </a>
            </li>
            {session && (
              <li>
                <a href="/event" className="hover:underline">
                  My Events
                </a>
              </li>
            )}
            {session && (
              <li>
                <a href="/qr-code" className="hover:underline">
                  My QR Code
                </a>
              </li>
            )}
            {session && (
              <li>
                <button onClick={handleSignOut} className="hover:underline">
                  Sign Out
                </button>
              </li>
            )}
          </ul>
        </nav>
      </header>
    </div>
  );
}
