'use client';

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { Button } from '@/components/ui/button';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDownIcon, CalendarIcon, PlusIcon } from '@heroicons/react/24/outline';
import EventCard from '@/components/event-card';

export default function Event() {
  const [session, setSession] = useState<User | null>(null);
  const [events, setEvents] = useState<
    Database['public']['Tables']['Events']['Row'][]
  >([]);
  const [sortBy, setSortBy] = useState<'start_date' | 'name'>('start_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
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
        // Error fetching events
        setError(error.message);
      } else {
        setEvents(data || []);
      }
      setLoading(false);
    },
    [supabase, sortBy, sortOrder]
  );

  // Delete single event with confirmation
  const deleteEvent = async (eventId: number) => {
    if (!session) return;

    const eventToDelete = events.find(e => e.id === eventId);
    const confirmMessage = `Are you sure you want to delete "${eventToDelete?.name}"?\n\nThis will permanently delete:\n• The event\n• All tickets\n• All RSVPs\n\nThis action cannot be undone.`;

    if (!confirm(confirmMessage)) return;

    setDeleting(eventId);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete event');
      }

      // Remove event from local state
      setEvents(events.filter(e => e.id !== eventId));

      // Event deleted successfully
    } catch (err) {
      // Error deleting event
      setError(err instanceof Error ? err.message : 'Failed to delete event');
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session?.user ?? null);
      if (!session) {
        router.push('/api/auth/direct-google');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session.user);
      } else {
        router.push('/api/auth/direct-google');
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-md rounded-xl border border-border bg-white p-8 text-center shadow-sm">
          <div className="font-mono text-[10px] tracking-[0.18em] text-red-600 uppercase">
            Error
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Redirecting...
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-16 sm:px-8 lg:px-12">
        {/* Page header */}
        <div className="font-mono text-[11px] tracking-[0.2em] text-primary uppercase">
          MY EVENTS
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          My Events
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Manage and organize your events with style. View, edit, and share your upcoming events.
        </p>

        {/* Sort controls */}
        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
            <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
              Filter & Sort
            </span>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Sort by: {sortBy === 'start_date' ? 'Date' : 'Name'}
                    <ChevronDownIcon className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  <DropdownMenuLabel>Sort Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setSortBy('start_date')}
                    className="cursor-pointer"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    Start Date
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSortBy('name')}
                    className="cursor-pointer"
                  >
                    Event Name
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                    <ChevronDownIcon className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-40">
                  <DropdownMenuLabel>Order</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setSortOrder('asc')}
                    className="cursor-pointer"
                  >
                    Ascending
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSortOrder('desc')}
                    className="cursor-pointer"
                  >
                    Descending
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Delete All Button */}
          {/* {events.length > 0 && (
            <Button
              onClick={deleteAllEvents}
              variant="destructive"
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete All Events'}
            </Button>
          )} */}
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
            <div className="mx-auto max-w-md">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CalendarIcon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-3 text-2xl font-semibold tracking-tight text-foreground">
                No Events Yet
              </h3>
              <p className="mb-6 text-muted-foreground">
                Ready to create your first event? Get started and bring people together!
              </p>
              <Button onClick={() => router.push('/create-event')}>
                Schedule Your First Event
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-10 flex w-full flex-wrap content-start items-start justify-start gap-6">
              {events.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  onShare={handleShare}
                  onDelete={deleteEvent}
                  isDeleting={deleting === event.id}
                />
              ))}
            </div>
            <div className="mt-10">
              <Button
                variant="outline"
                onClick={() => router.push('/create-event')}
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Schedule Another Event
              </Button>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

function handleShare(eventId: string) {
  const inviteLink = `${window.location.origin}/rsvp?event_id=${eventId}`;
  navigator.clipboard.writeText(inviteLink);
  alert('Invite link copied to clipboard!');
}
