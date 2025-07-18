'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import type { Session, User } from '@supabase/supabase-js';
import Header from '@/components/header';

import type { Database } from '@/lib/database.types';
import { formatISO, isAfter } from 'date-fns';

export default function Rsvp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('Attending');
  const [loading, setLoading] = useState(true);
  const [eventLoading, setEventLoading] = useState(false);
  const [event, setEvent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [eventId, setEventId] = useState<string | null>(null);
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [session, setSession] = useState<User | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Debug: Log current state
  console.log('RSVP Page State:', {
    loading,
    eventLoading,
    session: !!session,
    eventId,
    event: !!event,
    error
  });

  // Fetch event details
  const fetchEventDetails = async (id: string) => {
    setEventLoading(true);
    setError(null);
    
    console.log('Fetching event details for ID:', id);
    
    // Use the same approach as event/[id]/page.tsx
    const { data, error } = await supabase
      .from('Events')
      .select('*')
      .eq('id', parseInt(id, 10))
      .single();

    console.log('Query result:', { data, error });

    if (error) {
      console.error('Error fetching event:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      if (error.code === 'PGRST116') {
        setError('Event not found. The event may have been deleted or the link is invalid.');
      } else if (error.code === '42501') {
        setError('Permission denied. You may not have access to this event.');
      } else {
        setError(`Error loading event: ${error.message}`);
      }
      setEvent(null);
    } else if (data) {
      console.log('Event found:', data);
      setEvent(data);
      // Fetch tickets for this event
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('*')
        .eq('event_id', parseInt(id, 10));
      if (!ticketError && ticketData) {
        setTickets(ticketData);
      }
    } else {
      setError('Event not found.');
      setEvent(null);
    }
    setEventLoading(false);
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, !!session);
      if (session) {
        setSession(session.user);
        if (session.user.email) {
          setEmail(session.user.email);
        }
        setLoading(false);
      } else {
        setSession(null);
        setLoading(false);
      }
    });

    // Initial session check - use getSession instead of getUser for better cookie handling
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', !!session);
      if (session) {
        setSession(session.user);
        if (session.user.email) {
          setEmail(session.user.email);
        }
      } else {
        setSession(null);
      }
      setLoading(false);
    });

    // Get eventId from URL search params
    const idFromUrl = searchParams.get('event_id');
    console.log('Event ID from URL:', idFromUrl);
    if (idFromUrl) {
      setEventId(idFromUrl);
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, searchParams]);

  // Fetch event details when session becomes available
  useEffect(() => {
    if (session && eventId && !event && !eventLoading) {
      console.log('Session available, fetching event details for ID:', eventId);
      fetchEventDetails(eventId);
    }
  }, [session, eventId, event, eventLoading]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!eventId) {
      console.error('Event ID not found in URL.');
      return;
    }

    if (!session) {
      console.error('User not authenticated.');
      router.push('/login');
      return;
    }

    if (!selectedTicketId) {
      setError('Please select a ticket type.');
      return;
    }
    // Check if ticket is still available
    const ticket = tickets.find(t => t.id === selectedTicketId);
    if (!ticket || ticket.quantity_available <= 0 || (ticket.purchase_deadline && isAfter(new Date(), new Date(ticket.purchase_deadline)))) {
      setError('Selected ticket is no longer available.');
      return;
    }
    // Decrement ticket quantity
    const { error: ticketUpdateError } = await supabase
      .from('tickets')
      .update({ quantity_available: ticket.quantity_available - 1 })
      .eq('id', selectedTicketId);
    if (ticketUpdateError) {
      setError('Failed to reserve ticket. Please try again.');
      return;
    }

    const { data, error } = await supabase
      .from('rsvps')
      .insert([
        {
          name,
          email,
          status,
          event_id: Number(eventId),
          user_id: session.id,
          ticket_id: selectedTicketId,
        },
      ])
      .select();

    if (error) {
      console.log(error);
      setError('Failed to submit RSVP. Please try again.');
    } else {
      router.push('/event');
    }
  };

  if (loading) {
    console.log('RSVP Page: Loading state is true');
    return (
      <div>
        <Header />
        <div className="flex min-h-screen flex-col items-center justify-center py-2">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Loading...</h1>
            <p>Please wait while we authenticate you.</p>
            <p className="text-sm text-gray-500 mt-2">Debug: Loading authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    console.log('RSVP Page: No session, should redirect to login');
    const eventIdParam = searchParams.get('event_id');
    return (
      <div>
        <Header />
        <div className="flex min-h-screen flex-col items-center justify-center py-2">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
            <p>You need to be signed in to RSVP.</p>
            <p className="text-sm text-gray-500 mt-2">Debug: No session found</p>
            {/* Debug buttons */}
            <div className="mt-4 space-y-2">
              <button
                onClick={() => {
                  const eventIdForRedirect = eventIdParam || eventId || '';
                  const currentUrl = `/rsvp?event_id=${eventIdForRedirect}`;
                  console.log('Sign In button clicked, redirecting to:', `/login?next=${encodeURIComponent(currentUrl)}`);
                  router.push(`/login?next=${encodeURIComponent(currentUrl)}`);
                }}
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
              >
                Sign In
              </button>
              <a
                href={`/login?next=${encodeURIComponent(`/rsvp?event_id=${eventIdParam || eventId || ''}`)}`}
                className="ml-4 text-blue-600 underline"
              >
                Or click here to sign in
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (eventLoading) {
    console.log('RSVP Page: Event loading state is true');
    return (
      <div>
        <Header />
        <div className="flex min-h-screen flex-col items-center justify-center py-2">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Loading Event...</h1>
            <p>Please wait while we fetch event details.</p>
            <p className="text-sm text-gray-500 mt-2">Debug: Loading event ID {eventId}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header />
        <div className="flex min-h-screen flex-col items-center justify-center py-2">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
            <p className="text-red-500">{error}</p>
            <button
              onClick={() => router.push('/event')}
              className="mt-4 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
            >
              Go to Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div>
        <Header />
        <div className="flex min-h-screen flex-col items-center justify-center py-2">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
            <p>The event you're looking for doesn't exist or you don't have permission to view it.</p>
            <button
              onClick={() => router.push('/event')}
              className="mt-4 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
            >
              Go to Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="flex min-h-screen flex-col items-center justify-center py-2">
        <main className="flex w-full flex-1 flex-col items-center justify-center px-20 text-center">
          <h1 className="text-6xl font-bold">RSVP</h1>
          
          <div className="mt-4 mb-8 p-4 bg-gray-100 rounded-lg">
            <h2 className="text-2xl font-semibold">{event?.name}</h2>
            <p className="text-gray-600">Theme: {event?.theme}</p>
            <p className="text-gray-600">
              Start: {event ? new Date(event.start_date).toLocaleString() : ''}
            </p>
            <p className="text-gray-600">
              End: {event ? new Date(event.end_date).toLocaleString() : ''}
            </p>
            {event?.additional_info && (
              <p className="text-gray-600">Additional Info: {event.additional_info}</p>
            )}
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="-space-y-px rounded-md shadow-sm">
              <div>
                <label htmlFor="name" className="sr-only">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
                  placeholder="Name"
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="relative block w-full appearance-none rounded-none border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  readOnly={!!session.email} // Make read-only if session exists
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="status" className="sr-only">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  required
                  className="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
                  onChange={e => setStatus(e.target.value)}
                >
                  <option>Attending</option>
                  <option>Maybe</option>
                  <option>Not Attending</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-left font-medium mb-2">Select Ticket Type</label>
              <div className="space-y-2">
                {tickets.length === 0 && <div className="text-gray-500">No tickets available for this event.</div>}
                {tickets.map(ticket => {
                  const soldOut = ticket.quantity_available <= 0 || (ticket.purchase_deadline && isAfter(new Date(), new Date(ticket.purchase_deadline)));
                  return (
                    <label key={ticket.id} className={`flex items-center gap-2 p-2 rounded border ${soldOut ? 'bg-gray-100 text-gray-400' : 'bg-white'}`}> 
                      <input
                        type="radio"
                        name="ticket"
                        value={ticket.id}
                        disabled={soldOut}
                        checked={selectedTicketId === ticket.id}
                        onChange={() => setSelectedTicketId(ticket.id)}
                      />
                      <span className="font-semibold">{ticket.name}</span>
                      <span className="ml-2">${ticket.price}</span>
                      <span className="ml-2">{ticket.quantity_available} left</span>
                      {ticket.purchase_deadline && (
                        <span className="ml-2">until {new Date(ticket.purchase_deadline).toLocaleString()}</span>
                      )}
                      {soldOut && <span className="ml-2 text-red-500 font-bold">Sold Out</span>}
                    </label>
                  );
                })}
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Submit RSVP
              </button>
            </div>
          </form>
          {/* Sign in with a different account button */}
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              const currentUrl = `/rsvp?event_id=${eventId || ''}`;
              router.push(`/login?next=${encodeURIComponent(currentUrl)}`);
            }}
            className="mt-6 inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-100 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
          >
            Sign in with a different account
          </button>
        </main>
      </div>
    </div>
  );
}
