'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Session } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

export default function Event() {
  const [session, setSession] = useState<Session | null>(null);
  const [events, setEvents] = useState<Database['public']['Tables']['events']['Row'][]>([]);
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
        fetchEvents(session.user.id);
      }
    };

    getSession();
  }, [supabase.auth, router]);

  const fetchEvents = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('Events')
      .select('*, rsvps(*)')
      .eq('user_id', userId);

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
                    onClick={() => handleShare(event.id)}
                    className="mt-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Share Invite
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
