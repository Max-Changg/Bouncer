'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import { createBrowserClient } from '@supabase/ssr';
import type { Session, User } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

export default function Event() {
  const [session, setSession] = useState<User | null>(null);
  const [events, setEvents] = useState<Database['public']['Tables']['Events']['Row'][]>([]);
  const [sortBy, setSortBy] = useState<'start_date' | 'name'>('start_date'); // Default sort by date
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); // Default ascending
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createBrowserClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookieOptions: { name: 'sb-auth-token' } });

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setSession(session.user);
        fetchEvents(session.user.id, sortBy, sortOrder);
      } else {
        setSession(null); // Clear session on logout
        router.push('/login');
      }
    });

    // Initial session check
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setSession(user);
        fetchEvents(user.id, sortBy, sortOrder);
      } else {
        setSession(null); // Clear session on logout
        router.push('/login');
      }
    });

    const fetchEvents = async (userId: string, sortBy: 'start_date' | 'name', sortOrder: 'asc' | 'desc') => {
      setLoading(true);
      const { data, error } = await supabase
        .from('Events')
        .select('*')
        .eq('user_id', userId)
        .order(sortBy, { ascending: sortOrder === 'asc' });

      if (error) {
        console.error('Error fetching events:', error);
        setError(error.message);
      } else {
        setEvents(data || []);
      }
      setLoading(false);
    };

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth, router, sortBy, sortOrder, supabase]);

  const handleShare = (eventId: string) => {
    const inviteLink = `${window.location.origin}/rsvp?event_id=${eventId}`;
    navigator.clipboard.writeText(inviteLink);
    alert('Invite link copied to clipboard!');
  };

  if (loading) {
    return <div>Loading events...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!session) {
    return null; // Should redirect to login, but just in case
  }

  return (
    <div>
      <Header session={session} />
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
          <h1 className="text-4xl font-bold">My Events</h1>
          <div className="flex gap-4 mb-4">
            <label htmlFor="sortBy" className="block text-sm font-medium text-white-700">Sort by:</label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'start_date' | 'name')}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-black"
            >
              <option value="start_date">Start Date</option>
              <option value="name">Event Name</option>
            </select>

            <label htmlFor="sortOrder" className="block text-sm font-medium text-white-700">Order:</label>
            <select
              id="sortOrder"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-black"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
          {events.length === 0 ? (
            <p>No events created yet. Create one from the home page!</p>
          ) : (
            <div className="space-y-8">
              {events.map((event) => (
                <div key={event.id} className="p-6 border rounded-lg shadow-md">
                  <h2 className="text-2xl font-semibold">{event.name}</h2>
                  <p className="text-gray-600">Theme: {event.theme}</p>
                  <p className="text-gray-600">Start: {new Date(event.start_date).toLocaleString()}</p>
                  <p className="text-gray-600">End: {new Date(event.end_date).toLocaleString()}</p>
                  <p className="text-gray-600">Additional Info: {event.additional_info}</p>
                  <button
                    onClick={() => router.push(`/event/${event.id}`)}
                    className="mt-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleShare(event.id.toString())}
                    className="mt-4 ml-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
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
