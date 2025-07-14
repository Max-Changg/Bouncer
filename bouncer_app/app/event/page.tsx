'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

export default function Event() {
  const [session, setSession] = useState<User | null>(null);
  const [events, setEvents] = useState<
    Database['public']['Tables']['Events']['Row'][]
  >([]);
  const [sortBy, setSortBy] = useState<'start_date' | 'name'>('start_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchEvents = useCallback(
    async (userId: string) => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('Events')
        .select('*')
        .eq('user_id', userId)
        .order(sortBy, {
          ascending: sortOrder === 'asc',
        });

      if (error) {
        console.error('Error fetching events:', error);
        setError(error.message);
      } else {
        setEvents(data || []);
      }
      setLoading(false);
    },
    [supabase, sortBy, sortOrder]
  );

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session?.user ?? null);
      if (!session) {
        router.push('/login');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session.user);
      } else {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase.auth]);

  useEffect(() => {
    if (session) {
      fetchEvents(session.id);
    }
  }, [session, fetchEvents]);

  if (loading) {
    return <div>Loading events...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!session) {
    return null; // Redirecting...
  }

  return (
    <div>
      <Header />
      <div className="grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center gap-16 p-8 pb-20 font-[family-name:var(--font-geist-sans)] sm:p-20">
        <main className="row-start-2 flex flex-col items-center gap-[32px] sm:items-start">
          <h1 className="text-4xl font-bold">My Events</h1>
          <div className="mb-4 flex gap-4">
            <label
              htmlFor="sortBy"
              className="text-white-700 block text-sm font-medium"
            >
              Sort by:
            </label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'start_date' | 'name')}
              className="mt-1 block w-full rounded-md border-gray-300 py-2 pr-10 pl-3 text-base text-black focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
            >
              <option value="start_date">Start Date</option>
              <option value="name">Event Name</option>
            </select>

            <label
              htmlFor="sortOrder"
              className="text-white-700 block text-sm font-medium"
            >
              Order:
            </label>
            <select
              id="sortOrder"
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="mt-1 block w-full rounded-md border-gray-300 py-2 pr-10 pl-3 text-base text-black focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
          {events.length === 0 ? (
            <p>No events created yet. Create one from the home page!</p>
          ) : (
            <div className="space-y-8">
              {events.map(event => (
                <div key={event.id} className="rounded-lg border p-6 shadow-md">
                  <h2 className="text-2xl font-semibold">{event.name}</h2>
                  <p className="text-gray-600">Theme: {event.theme}</p>
                  <p className="text-gray-600">
                    Start: {new Date(event.start_date).toLocaleString()}
                  </p>
                  <p className="text-gray-600">
                    End: {new Date(event.end_date).toLocaleString()}
                  </p>
                  <p className="text-gray-600">
                    Additional Info: {event.additional_info}
                  </p>
                  <button
                    onClick={() => router.push(`/event/${event.id}`)}
                    className="mt-4 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleShare(event.id.toString())}
                    className="mt-4 ml-4 inline-flex justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
                  >
                    Get Invite Link
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function handleShare(eventId: string) {
  const inviteLink = `${window.location.origin}/rsvp?event_id=${eventId}`;
  navigator.clipboard.writeText(inviteLink);
  alert('Invite link copied to clipboard!');
}
