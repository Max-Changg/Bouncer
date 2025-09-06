'use client';

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import type { Session, User } from '@supabase/supabase-js';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Button } from '@/components/ui/button';

import type { Database } from '@/lib/database.types';
import { formatISO, isAfter } from 'date-fns';

function RsvpContent() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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
  const [selectedTicketType, setSelectedTicketType] = useState<any | null>(null);
  const [paymentImage, setPaymentImage] = useState<File | null>(null);

  // Extract payment info block from additional_info (if present)
  const PAYMENT_SECTION_REGEX = /\n\nPayment Information:\n[\s\S]*$/i;
  const extractPaymentInfo = (info: string) => {
    if (!info) return { venmo: '', zelle: '' };
    const match = info.match(PAYMENT_SECTION_REGEX);
    if (!match) return { venmo: '', zelle: '' };
    const paymentBlock = match[0];
    const venmoMatch = paymentBlock.match(/Venmo:\s*([^\n]+)/i);
    const zelleMatch = paymentBlock.match(/Zelle:\s*([^\n]+)/i);
    return {
      venmo: venmoMatch?.[1]?.trim() || '',
      zelle: zelleMatch?.[1]?.trim() || '',
    };
  };

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
        // Calculate available quantities by subtracting RSVPs from total quantity
        const ticketsWithAvailability = await Promise.all(
          ticketData.map(async (ticket) => {
            const { count: rsvpCount, error: rsvpError } = await supabase
              .from('rsvps')
              .select('*', { count: 'exact', head: true })
              .eq('ticket_id', ticket.id);
            
            const usedQuantity = rsvpError ? 0 : (rsvpCount || 0);
            const actualAvailable = Math.max(0, ticket.quantity_available - usedQuantity);
            
            return {
              ...ticket,
              quantity_available: actualAvailable,
              original_quantity: ticket.quantity_available,
              rsvps_count: usedQuantity
            };
          })
        );
        
        // Group tickets by name and price (ticket type)
        const ticketTypes = new Map();
        ticketsWithAvailability.forEach(ticket => {
          const key = `${ticket.name}-${ticket.price}`;
          if (ticketTypes.has(key)) {
            const existing = ticketTypes.get(key);
            existing.quantity_available += ticket.quantity_available;
            existing.original_quantity += ticket.original_quantity;
            existing.rsvps_count += ticket.rsvps_count;
            existing.ticket_ids.push(ticket.id);
          } else {
            ticketTypes.set(key, {
              ...ticket,
              ticket_ids: [ticket.id], // Store all ticket IDs for this type
            });
          }
        });
        
        // Convert back to array
        const groupedTickets = Array.from(ticketTypes.values());
        setTickets(groupedTickets);
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

    if (!selectedTicketType) {
      setError('Please select a ticket type.');
      return;
    }

    // Check if user already has an RSVP for this event
    const { data: existingRsvp, error: checkError } = await supabase
      .from('rsvps')
      .select('id')
      .eq('event_id', Number(eventId))
      .eq('user_id', session.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing RSVP:', checkError);
      setError('Failed to check existing RSVP. Please try again.');
      return;
    }

    if (existingRsvp) {
      setError('You have already RSVP\'d to this event. Please check your events page.');
      return;
    }
    
    // Check if ticket type is still available
    const ticketType = selectedTicketType;
    // If ticket has a cost, require payment proof image to be uploaded
    if (ticketType && ticketType.price > 0 && !paymentImage) {
      setError('Please upload a picture of your payment confirmation for the selected paid ticket.');
      return;
    }
    if (!ticketType || ticketType.quantity_available <= 0 || (ticketType.purchase_deadline && isAfter(new Date(), new Date(ticketType.purchase_deadline)))) {
      setError('Selected ticket type is no longer available.');
      return;
    }

    // Pick the first available ticket ID from this ticket type
    const availableTicketId = ticketType.ticket_ids[0];

    let paymentProofUrl = null;

    // Upload payment proof image if provided
    if (paymentImage && ticketType.price > 0) {
      const fileExt = paymentImage.name.split('.').pop();
      const fileName = `${session.id}-${eventId}-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, paymentImage);

      if (uploadError) {
        console.error('Error uploading payment proof:', uploadError);
        setError('Failed to upload payment proof. Please try again.');
        return;
      }

      paymentProofUrl = fileName;
    }

    // Use a transaction-like approach: insert RSVP first, then update ticket count
    const { data, error } = await supabase
      .from('rsvps')
      .insert([
        {
          name,
          email,
          event_id: Number(eventId),
          user_id: session.id,
          ticket_id: availableTicketId,
          payment_proof_url: paymentProofUrl,
        },
      ])
      .select();

    if (error) {
      console.error('RSVP insertion error:', error);
      
      // Handle specific error cases
      if (error.code === '23505') {
        setError('You have already RSVP\'d to this event.');
      } else if (error.code === '23503') {
        setError('Selected ticket is no longer valid.');
      } else {
        setError('Failed to submit RSVP. Please try again.');
      }
      return;
    }

    // If RSVP was successful, update ticket quantity
    // Note: We don't decrement here since we're tracking via RSVP count
    console.log('RSVP submitted successfully:', data);
    router.push('/event');
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
              <Button
                onClick={() => {
                  const eventIdForRedirect = eventIdParam || eventId || '';
                  const currentUrl = `/rsvp?event_id=${eventIdForRedirect}`;
                  console.log('Sign In button clicked, redirecting to:', `/login?next=${encodeURIComponent(currentUrl)}`);
                  router.push(`/login?next=${encodeURIComponent(currentUrl)}`);
                }}
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
              >
                Sign In
              </Button>
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
            <Button
              onClick={() => router.push('/event')}
              className="mt-4 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
            >
              Go to Events
            </Button>
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
            <Button
              onClick={() => router.push('/event')}
              className="mt-4 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
            >
              Go to Events
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      {/* Unique party background (no light beams): neon rings + soft glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 right-[-120px] w-[520px] h-[520px] rounded-full bg-fuchsia-700/25 blur-3xl mix-blend-screen"></div>
        <div className="absolute bottom-[-140px] -left-24 w-[560px] h-[560px] rounded-full bg-cyan-500/20 blur-3xl mix-blend-screen"></div>
        <div className="absolute inset-0 opacity-[0.10]"
             style={{
               backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
               color: '#ffffff',
               backgroundSize: '20px 20px',
               backgroundPosition: '0 0, 10px 10px',
             }}></div>
      </div>

      {/* Header */}
      <div className="relative z-20">
        <Header />
      </div>

      {/* Hero */}
      <div className="relative z-10 px-6 py-12 sm:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-white to-fuchsia-200 bg-clip-text text-transparent">
            RSVP
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl">
            You're almost in. Confirm your spot and we'll save you on the list.
          </p>
        </div>
      </div>

      {/* Content card */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 pb-16 sm:px-8 lg:px-12">
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-3xl border border-gray-700/50 shadow-xl shadow-black/50 p-6 sm:p-8">
          {/* Event summary */}
          <div className="mb-6 rounded-2xl border border-gray-700/50 bg-gray-800/60 p-5">
            <h2 className="text-2xl font-semibold text-white">{event?.name}</h2>
            <div className="mt-2 text-gray-300">
              {event?.theme && <p>Theme: {event.theme}</p>}
              <p>Start: {event ? new Date(event.start_date).toLocaleString() : ''}</p>
              <p>End: {event ? new Date(event.end_date).toLocaleString() : ''}</p>
              {event?.additional_info && (
                <div className="text-gray-400 whitespace-pre-line">
                  <p className="font-medium text-gray-300 mb-1">Additional Info:</p>
                  <p>{event.additional_info}</p>
                </div>
              )}
            </div>
          </div>

          {/* RSVP form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="text-sm text-gray-300">Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-600"
                  placeholder="Your name"
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm text-gray-300">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-600"
                  placeholder="you@example.com"
                  value={email}
                  readOnly={!!session.email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>



            <div>
              <label className="block text-left font-medium text-gray-200 mb-4">Select Ticket Type</label>
              <div className="space-y-3">
                {tickets.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="w-16 h-16 bg-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                    </div>
                    No tickets available for this event.
                  </div>
                )}
                {tickets.map((ticketType, index) => {
                  const soldOut = ticketType.quantity_available <= 0 || (ticketType.purchase_deadline && isAfter(new Date(), new Date(ticketType.purchase_deadline)));
                  const isPaid = ticketType.price > 0;
                  const isSelected = selectedTicketType?.id === ticketType.id;
                  
                  return (
                    <label
                      key={`${ticketType.name}-${ticketType.price}-${index}`}
                      className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                        soldOut 
                          ? 'bg-gray-800/30 border-gray-700/50 text-gray-500 cursor-not-allowed' 
                          : isSelected
                            ? 'bg-fuchsia-900/20 border-fuchsia-500 text-white'
                            : 'bg-gray-800/50 border-gray-600 text-gray-200 hover:border-fuchsia-500/50 hover:bg-gray-800/70'
                      }`}
                    > 
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="ticket"
                          value={`${ticketType.name}-${ticketType.price}`}
                          disabled={soldOut}
                          checked={isSelected}
                          onChange={() => setSelectedTicketType(ticketType)}
                          className="w-4 h-4 text-fuchsia-600 border-gray-600 focus:ring-fuchsia-500 focus:ring-2"
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-lg">{ticketType.name}</span>
                            {isPaid ? (
                              <span className="text-amber-300 font-bold">${ticketType.price.toFixed(2)}</span>
                            ) : (
                              <span className="text-green-400 font-bold">FREE</span>
                            )}
                          </div>
                          {ticketType.purchase_deadline && (
                            <div className="text-sm text-gray-400 mt-1">
                              Available until {new Date(ticketType.purchase_deadline).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {soldOut ? (
                          <span className="text-red-400 font-semibold text-sm">SOLD OUT</span>
                        ) : (
                          <div className={`text-sm font-medium ${
                            ticketType.quantity_available > 10 ? 'text-green-400' : 
                            ticketType.quantity_available > 5 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {ticketType.quantity_available} remaining
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Payment info and proof upload (conditional) */}
            {(() => {
              const payment = extractPaymentInfo(event?.additional_info || '');
              const hasPaymentInfo = !!(payment.venmo || payment.zelle);
              const requiresProof = !!selectedTicketType && selectedTicketType.price > 0;
              return (
                <>
                  {hasPaymentInfo && (
                    <div className="rounded-2xl border border-fuchsia-600/30 bg-fuchsia-900/10 p-5">
                      <h4 className="text-white font-semibold mb-2">Payment Information</h4>
                      <ul className="text-sm text-fuchsia-100 list-disc pl-5 space-y-1">
                        {payment.venmo && <li>Venmo: {payment.venmo}</li>}
                        {payment.zelle && <li>Zelle: {payment.zelle}</li>}
                      </ul>
                    </div>
                  )}
                  {requiresProof && (
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-900/10 p-5">
                      <label className="block text-sm font-medium text-amber-200 mb-2">
                        Upload payment confirmation (required for paid tickets)
                      </label>
                      <p className="text-xs text-amber-200 mb-3">
                        Please upload a picture of the payment confirmation receipt with the correct ticket price amount.
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => setPaymentImage(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-200 file:mr-4 file:rounded-md file:border-0 file:bg-amber-600 file:px-3 file:py-2 file:text-white hover:file:bg-amber-700"
                      />
                      {!paymentImage && (
                        <p className="text-xs text-amber-300 mt-2">This is required to submit when selecting a paid ticket.</p>
                      )}
                    </div>
                  )}
                </>
              );
            })()}

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-fuchsia-700 to-indigo-700 hover:from-fuchsia-800 hover:to-indigo-800 shadow-lg hover:shadow-fuchsia-800/40 transition-all duration-200"
              >
                Submit RSVP
              </Button>
            </div>
          </form>

          {/* Sign in with a different account button */}
          <Button
            onClick={async () => {
              await supabase.auth.signOut();
              const currentUrl = `/rsvp?event_id=${eventId || ''}`;
              router.push(`/login?next=${encodeURIComponent(currentUrl)}`);
            }}
            className="mt-6 inline-flex justify-center rounded-md border border-gray-600 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-200 shadow-sm hover:bg-gray-700 focus:outline-none"
          >
            Sign in with a different account
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function Rsvp() {
  return (
    <Suspense fallback={
      <div>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          </div>
        </div>
        <Footer />
      </div>
    }>
      <RsvpContent />
    </Suspense>
  );
}
