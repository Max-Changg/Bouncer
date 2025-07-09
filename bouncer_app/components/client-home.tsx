'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Database } from '@/lib/database.types';

export default function ClientHome() {
  const [session, setSession] = useState<any>(null);
  const [events, setEvents] = useState<Database['public']['Tables']['Events']['Row'][] | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
            ?.split('=')[1]
        },
        set(name: string, value: string, options: any) {
          document.cookie = `${name}=${value}; path=/; max-age=${options.maxAge || 31536000}`
        },
        remove(name: string, options: any) {
          document.cookie = `${name}=; path=/; max-age=0`
        },
      },
    }
  );

  useEffect(() => {
    checkSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session) {
        fetchEvents(session.user.id);
      } else {
        setEvents(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session) {
        await fetchEvents(session.user.id);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("Events")
        .select("*")
        .eq("user_id", userId);
      
      if (error) {
        console.error("Error fetching events:", error);
      } else {
        setEvents(data as unknown as Database['public']['Tables']['Events']['Row'][]);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-[32px] items-center sm:items-start">
      <h1 className="text-4xl font-bold">Bouncer</h1>
      <p className="text-lg">The easiest way to manage your events.</p>
      
      {session ? (
        <div className="flex gap-4">
          <Link href="/create-event">
            <button className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Create Event
            </button>
          </Link>
          <Link href="/event">
            <button className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              My Events
            </button>
          </Link>
          <Link href="/qr-code">
            <button className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              My QR Code
            </button>
          </Link>
        </div>
      ) : (
        <Link href="/login">
          <button className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Login to Create Events
          </button>
        </Link>
      )}
      
      {session && events && events.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mt-8">Your Events</h2>
          <ul>
            {events.map((event: Database['public']['Tables']['Events']['Row']) => (
              <li key={event.id}>{event.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 