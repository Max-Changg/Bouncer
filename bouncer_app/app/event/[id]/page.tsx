'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/header';
import { createBrowserClient } from '@supabase/ssr';
import type { Session, User } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { DataTable } from '@/components/data-table';
import { columns } from './columns';

export default function EventDetails() {
  const [session, setSession] = useState<User | null>(null);
  const [event, setEvent] = useState<
    Database['public']['Tables']['Events']['Row'] | null
  >(null);
  const [rsvps, setRsvps] = useState<
    Database['public']['Tables']['rsvps']['Row'][]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: 'sb-auth-token',
      },
    }
  );
  const eventId = Array.isArray(params.id) ? params.id[0] : params.id;

  const fetchEventDetails = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('Events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) {
      console.error(
        'Error fetching event details:',
        error.message,
        error.details,
        error.hint
      );
      setError(error.message);
      setEvent(null); // Ensure event is null on error
    } else if (data) {
      setEvent(data);
    } else {
      setError('Event not found.');
      setEvent(null);
    }
    setLoading(false);
  }, [supabase, eventId]);

  const fetchRsvps = useCallback(async () => {
    const { data, error } = await supabase
      .from('rsvps')
      .select('*')
      .eq('event_id', eventId);

    if (error) {
      console.error(
        'Error fetching RSVPs:',
        error.message,
        error.details,
        error.hint
      );
      setError(error.message);
      setRsvps([]); // Ensure rsvps is empty array on error
    } else if (data) {
      setRsvps(data);
    } else {
      setRsvps([]);
    }
  }, [supabase, eventId]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setSession(session.user);
      } else {
        setSession(null); // Clear session on logout
        router.push('/login');
      }
    });

    // Initial session check
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setSession(user);
      } else {
        setSession(null); // Clear session on logout
        router.push('/login');
      }
    });

    // Also call fetch functions if eventId is already available on initial render
    if (eventId) {
      fetchEventDetails();
      fetchRsvps();
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth, router, eventId, fetchEventDetails, fetchRsvps]);

  const handleShare = (eventId: string) => {
    const inviteLink = `${window.location.origin}/rsvp?event_id=${eventId}`;
    navigator.clipboard.writeText(inviteLink);
    alert('Invite link copied to clipboard!');
  };

  const handleEdit = () => {
    router.push(`/create-event?event_id=${eventId}`);
  };

  const handleDelete = async () => {
    if (
      window.confirm(
        'Are you sure you want to delete this event? This action cannot be undone.'
      )
    ) {
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
        router.push('/event');
      }
    }
  };

  const handleSave = async (
    updatedRsvps: Database['public']['Tables']['rsvps']['Row'][]
  ) => {
    const { error } = await supabase
      .from('rsvps')
      .upsert(updatedRsvps, { onConflict: 'id' });

    if (error) {
      console.error('Error updating RSVPs:', error);
      setError(error.message);
    } else {
      fetchRsvps(); // Refresh the data
      alert('RSVPs updated successfully!');
    }
  };

  if (loading) {
    return <div>Loading event details...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!session || !event) {
    return null;
  }

  return (
    <div>
      <Header session={session} />
      <div className="grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center gap-16 p-8 pb-20 font-[family-name:var(--font-geist-sans)] sm:p-20">
        <main className="row-start-2 flex w-full flex-col items-center gap-[32px] sm:items-start">
          <div className="flex w-full items-center justify-between">
            <h1 className="text-4xl font-bold">{event.name}</h1>
            <div>
              <button
                onClick={handleEdit}
                className="inline-flex justify-center rounded-md border border-transparent bg-yellow-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:outline-none"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="ml-4 inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
              >
                Delete
              </button>
              <button
                onClick={() => handleShare(event.id.toString())}
                className="ml-4 inline-flex justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
              >
                Get Invite Link
              </button>
              <button
                onClick={() => router.push(`/event/${eventId}/scan`)}
                className="ml-4 inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
              >
                Scan QR Code
              </button>
            </div>
          </div>
          <div className="w-full rounded-lg border p-6 shadow-md">
            <p className="text-gray-600">
              <strong>Theme:</strong> {event.theme}
            </p>
            <p className="text-gray-600">
              <strong>Start:</strong>{' '}
              {new Date(event.start_date).toLocaleString()}
            </p>
            <p className="text-gray-600">
              <strong>End:</strong> {new Date(event.end_date).toLocaleString()}
            </p>
            <p className="text-gray-600">
              <strong>Additional Info:</strong> {event.additional_info}
            </p>
          </div>

          <h2 className="mt-8 text-2xl font-bold">RSVPs</h2>
          <DataTable columns={columns} data={rsvps} onSave={handleSave} />
        </main>
      </div>
    </div>
  );
}
