'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Database } from '@/lib/database.types';

export default function ClientHome() {
  const [session, setSession] = useState<any>(null);
  const [events, setEvents] = useState<
    Database['public']['Tables']['Events']['Row'][] | null
  >(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          if (typeof document !== 'undefined') {
            return document.cookie
              .split('; ')
              .find(row => row.startsWith(`${name}=`))
              ?.split('=')[1];
          }
          return undefined;
        },
        set(name: string, value: string, options: any) {
          if (typeof document !== 'undefined') {
            document.cookie = `${name}=${value}; path=/; max-age=${options.maxAge || 31536000}`;
          }
        },
        remove(name: string, options: any) {
          if (typeof document !== 'undefined') {
            document.cookie = `${name}=; path=/; max-age=0`;
          }
        },
      },
    }
  );

  // Debug Supabase connection
  useEffect(() => {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      console.error('Missing Supabase environment variables');
    }
  }, []);

  useEffect(() => {
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
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
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Session error:', sessionError);
        return;
      }

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
      if (!userId) {
        console.error('No user ID provided to fetchEvents');
        return;
      }

      console.log('Fetching events for user:', userId);

      const { data, error } = await supabase
        .from('Events')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching events:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
      } else {
        console.log(
          'Events fetched successfully:',
          data?.length || 0,
          'events'
        );
        setEvents(
          data as unknown as Database['public']['Tables']['Events']['Row'][]
        );
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      console.error('Error type:', typeof error);
      console.error('Error stringified:', JSON.stringify(error, null, 2));
    }
  };

  return (
    <div className="flex flex-col items-center justify-items-center gap-[32px] sm:items-start">
      <div className="flex gap-4">
        <Button
          style={{
            backgroundColor: '#A259FF',
            color: 'white',
          }}
          className="hover:bg-[#8e3fff] font-mono hover:animate-grow"
          variant="default"
        >
          <Link href="/create-event">Create Event</Link>
        </Button>
        <Button
          style={{
            backgroundColor: '#A259FF',
            color: 'white',
          }}
          className="hover:bg-[#8e3fff] font-mono hover:animate-grow"
          variant="default"
        >
          <Link href="/event">My Events</Link>
        </Button>
        <Button
          style={{
            backgroundColor: '#A259FF',
            color: 'white',
          }}
          className="hover:bg-[#8e3fff] font-mono hover:animate-grow"
          variant="default"
        >
          <Link href="/qr-code">My QR Code</Link>
        </Button>
      </div>

      {session && events && events.length > 0 && (
        <div className="text-center">
          <h2 className="mt-8 text-2xl font-bold text-white">
            Your Upcoming Events:
          </h2>
          <ul className="mt-4 space-y-2">
            {events
              .filter(
                (event: Database['public']['Tables']['Events']['Row']) => {
                  // Filter out events that have already ended
                  const now = new Date();
                  const eventEnd = new Date(event.end_date);
                  return eventEnd > now;
                }
              )
              .sort(
                (
                  a: Database['public']['Tables']['Events']['Row'],
                  b: Database['public']['Tables']['Events']['Row']
                ) => {
                  // Sort by start date (most recent first)
                  const dateA = new Date(a.start_date);
                  const dateB = new Date(b.start_date);
                  return dateA.getTime() - dateB.getTime();
                }
              )
              .slice(0, 3) // Take only top 3
              .map((event: Database['public']['Tables']['Events']['Row']) => (
                <li key={event.id} className="text-gray-300">
                  {event.name}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
