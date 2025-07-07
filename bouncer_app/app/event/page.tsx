'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Session } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

export default function Event() {
  const [session, setSession] = useState<Session | null>(null);
  const [events, setEvents] = useState<Database['public']['Tables']['Events']['Row'][]>([]);
  const [sortBy, setSortBy] = useState<'start_date' | 'name'>('start_date'); // Default sort by date
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); // Default ascending
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (!session) {
        router.push('/login');
      } else {
        fetchEvents(session.user.id, sortBy, sortOrder);
      }
    };

    getSession();
  }, [supabase.auth, router, sortBy, sortOrder]);

  const fetchEvents = async (userId: string, sortBy: 'start_date' | 'name', sortOrder: 'asc' | 'desc') => {
    setLoading(true);
    const { data, error } = await supabase
      .from('Events')
      .select('*, rsvps(*)')
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

  const handleShare = (eventId: string) => {
    const inviteLink = `${window.location.origin}/rsvp?event_id=${eventId}`;
    navigator.clipboard.writeText(inviteLink);
    alert('Invite link copied to clipboard!');
  };

  const handleEdit = (eventId: number) => {
    router.push(`/create-event?event_id=${eventId}`);
  };

  const handleDelete = async (eventId: number) => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      // First, delete all RSVPs associated with the event
      const { error: rsvpError } = await supabase
        .from('rsvps')
        .delete()
        .eq('event_id', eventId);

      if (rsvpError) {
        console.error('Error deleting RSVPs:', rsvpError);
        setError(rsvpError.message);
        return;
      }

      // Then, delete the event itself
      const { error: eventError } = await supabase
        .from('Events')
        .delete()
        .eq('id', eventId);

      if (eventError) {
        console.error('Error deleting event:', eventError);
        setError(eventError.message);
      } else {
        // Refresh the events list
        fetchEvents(session!.user.id, sortBy, sortOrder);
      }
    }
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
                    onClick={() => handleShare(event.id.toString())}
                    className="mt-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Share Invite
                  </button>
                  <button
                    onClick={() => handleEdit(event.id)}
                    className="mt-4 ml-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="mt-4 ml-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Delete
                  </button>
                  {/* Placeholder for RSVPs - will implement in next step */}
                  <h3 className="text-xl font-semibold mt-6">RSVPs:</h3>
                  {
                    event.rsvps && event.rsvps.length > 0 ? (
                      <ul className="list-disc list-inside">
                        {event.rsvps.map((rsvp) => (
                          <li key={rsvp.id}>
                            {rsvp.name} ({rsvp.email}) - {rsvp.status}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No RSVPs yet.</p>
                    )
                  }
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
