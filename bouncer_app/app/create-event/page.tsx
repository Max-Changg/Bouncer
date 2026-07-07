'use client';

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react';

// Extend the Window interface to include google
declare global {
  interface Window {
    google: any;
  }
}
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { createBrowserClient } from '@supabase/ssr';
import type { Session, User } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

import { format, toZonedTime } from 'date-fns-tz';

// Polyfill for zonedTimeToUtc if not available
function zonedTimeToUtc(date: Date, timeZone: string): Date {
  // Get the timestamp for the equivalent UTC time
  const invdate = new Date(date.toLocaleString('en-US', { timeZone }));
  const diff = date.getTime() - invdate.getTime();
  return new Date(date.getTime() + diff);
}

import { ChevronDownIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export default function CreateEvent() {
  const [eventName, setEventName] = useState('');
  const [eventTheme, setEventTheme] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [timeZone, setTimeZone] = useState('America/Los_Angeles');
  const [location, setLocation] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return document.cookie
            .split('; ')
            .find(row => row.startsWith(`${name}=`))
            ?.split('=')[1];
        },
        set(name: string, value: string, options: any) {
          document.cookie = `${name}=${value}; path=/; max-age=${options.maxAge || 31536000}`;
        },
        remove(name: string, options: any) {
          document.cookie = `${name}=; path=/; max-age=0`;
        },
      },
    }
  );
  const [session, setSession] = useState<User | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [eventId, setEventId] = useState<number | null>(null);
  const DEFAULT_TICKET: {
    id?: string;
    name: string;
    price: number;
    quantity_available: number;
    purchase_deadline: Date | null;
  } = {
    name: 'Free',
    price: 0,
    quantity_available: 100,
    purchase_deadline: null,
  };

  const [tickets, setTickets] = useState<
    Array<{
      id?: string;
      name: string;
      price: number;
      quantity_available: number;
      purchase_deadline: Date | null;
    }>
  >([DEFAULT_TICKET]);
  const [selectedTicketIndex, setSelectedTicketIndex] = useState<number | null>(
    null
  );
  const [showTicketSidebar, setShowTicketSidebar] = useState(false);
  const [editingTicket, setEditingTicket] = useState<{
    name: string;
    price: number;
    quantity_available: number;
    purchase_deadline: Date | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);

  // Payment handles for paid tickets
  const [venmoHandle, setVenmoHandle] = useState('');
  const [zelleHandle, setZelleHandle] = useState('');

  // Helpers to parse/strip payment info embedded in additional_info
  const PAYMENT_SECTION_REGEX = /\n\nPayment Information:\n[\s\S]*$/i;
  const extractPaymentInfo = (info: string) => {
    if (!info) return { baseInfo: '', venmo: '', zelle: '' };
    const match = info.match(PAYMENT_SECTION_REGEX);
    if (!match) return { baseInfo: info, venmo: '', zelle: '' };
    const paymentBlock = match[0];
    const baseInfo = info.replace(PAYMENT_SECTION_REGEX, '').trim();
    const venmoMatch = paymentBlock.match(/Venmo:\s*([^\n]+)/i);
    const zelleMatch = paymentBlock.match(/Zelle:\s*([^\n]+)/i);
    return {
      baseInfo,
      venmo: venmoMatch?.[1]?.trim() || '',
      zelle: zelleMatch?.[1]?.trim() || '',
    };
  };
  const buildAdditionalInfoWithPayment = (baseInfo: string) => {
    const trimmed = (baseInfo || '').replace(PAYMENT_SECTION_REGEX, '').trim();
    const hasPaidTickets = tickets.some(t => t.price > 0);
    const hasPaymentHandles = venmoHandle.trim() || zelleHandle.trim();
    if (!hasPaidTickets || !hasPaymentHandles) return trimmed;
    const lines: string[] = ['\n\nPayment Information:'];
    if (venmoHandle.trim()) lines.push(`Venmo: ${venmoHandle.trim()}`);
    if (zelleHandle.trim()) lines.push(`Zelle: ${zelleHandle.trim()}`);
    return `${trimmed}${lines.join('\n')}`;
  };

  // Track location state changes
  useEffect(() => {
    // Location state tracking
  }, [location]);

  useEffect(() => {
    let mounted = true;
    let redirectTimeout: NodeJS.Timeout | null = null;

    // Set up auth state listener first
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // Auth state changed

      // Clear any pending redirect
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
        redirectTimeout = null;
      }

      setSessionLoading(false);
      if (session?.user) {
        // Session found from auth change
        setSession(session.user);
      } else {
        // No session from auth state change
        setSession(null);
        // Only redirect on explicit sign out, not initial load
        if (event === 'SIGNED_OUT') {
          // User signed out, redirecting to Google auth
          router.push('/api/auth/direct-google');
        } else if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          // For initial session or token refresh, if no user, set a delay before redirect
          // No user after initial session check, setting redirect timeout
          redirectTimeout = setTimeout(() => {
            if (mounted) {
              // Check current session state before redirecting
              supabase.auth
                .getSession()
                .then(({ data: { session: currentSession } }) => {
                  if (!currentSession?.user && mounted) {
                    // No session found after timeout, redirecting to Google auth
                    router.push('/api/auth/direct-google');
                  }
                });
            }
          }, 2000);
        }
      }
    });

    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          // Initial session error
          setSessionLoading(false);
          setSession(null);
          return;
        }

        // Initial session check
        setSessionLoading(false);

        if (session?.user) {
          // Setting session for user
          setSession(session.user);
        } else {
          // No session found, will set redirect timeout
          setSession(null);
          // Set a timeout to redirect if no session is established
          redirectTimeout = setTimeout(() => {
            if (mounted) {
              // Timeout reached, checking session one more time
              // Double-check session state before redirecting
              supabase.auth
                .getSession()
                .then(({ data: { session: currentSession } }) => {
                  if (!currentSession?.user && mounted) {
                    // Confirmed no session, redirecting to Google auth
                    router.push('/api/auth/direct-google');
                  } else if (currentSession?.user) {
                    // Session found during timeout check, not redirecting
                  }
                });
            }
          }, 2000); // Reduced to 2 seconds
        }
      } catch (error) {
        // Failed to get initial session
        if (mounted) {
          setSessionLoading(false);
          setSession(null);
          router.push('/api/auth/direct-google');
        }
      }
    };

    getInitialSession();

    const fetchEventData = async (id: number) => {
      const { data, error } = await supabase
        .from('Events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        // Error fetching event data
        setError(error.message);
      } else if (data) {
        setEventName(data.name || '');
        setEventTheme(data.theme || '');
        
        // Parse dates and extract times
        const startDateTime = new Date(data.start_date);
        const endDateTime = new Date(data.end_date);
        
        setStartDate(startDateTime);
        setEndDate(endDateTime);
        
        // Extract time portions in HH:MM format, with fallbacks
        const startTimeStr = (!isNaN(startDateTime.getTime())) 
          ? startDateTime.toTimeString().slice(0, 5) || '10:00'
          : '10:00';
        const endTimeStr = (!isNaN(endDateTime.getTime())) 
          ? endDateTime.toTimeString().slice(0, 5) || '11:00'
          : '11:00';
        
        setStartTime(startTimeStr);
        setEndTime(endTimeStr);
        setTimeZone(data.time_zone || 'America/Los_Angeles');
        setLocation(data.location || '');
        
        const { baseInfo, venmo, zelle } = extractPaymentInfo(
          data.additional_info || ''
        );
        setAdditionalInfo(baseInfo || '');
        setVenmoHandle(venmo || '');
        setZelleHandle(zelle || '');
      }

      // Load existing tickets for this event
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .eq('event_id', id);

      if (!ticketsError && ticketsData) {
        if (ticketsData.length === 0) {
          setTickets([DEFAULT_TICKET]);
        } else {
          setTickets(
            ticketsData.map(ticket => ({
              id: ticket.id,
              name: ticket.name,
              price: ticket.price,
              quantity_available: ticket.quantity_available,
              purchase_deadline: ticket.purchase_deadline
                ? new Date(ticket.purchase_deadline)
                : null,
            }))
          );
        }
        
        // Fetch RSVP counts for existing tickets
        await fetchTicketRsvpCounts(id);
      }
    };

    const params = new URLSearchParams(window.location.search);
    const eventIdParam = params.get('event_id');
    if (eventIdParam) {
      const id = parseInt(eventIdParam, 10);
      setEventId(id);
      fetchEventData(id);
    }

    return () => {
      mounted = false;
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
      subscription.unsubscribe();
    };
  }, [supabase.auth, router, supabase]);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    const initAutocomplete = () => {
      // Initializing Google Places Autocomplete

      // Check if Google Maps API is fully loaded
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        // Google Maps API not fully loaded yet, retrying in 100ms
        setTimeout(initAutocomplete, 100);
        return;
      }

      if (locationInputRef.current) {
        try {
          // Creating Autocomplete widget
          const autocomplete = new window.google.maps.places.Autocomplete(
            locationInputRef.current,
            {
              types: ['establishment', 'geocode'],
              fields: ['formatted_address', 'geometry', 'name'],
            }
          );

          // Autocomplete widget created successfully

          autocomplete.addListener('place_changed', () => {
            // Place selection triggered
            const place = autocomplete.getPlace();

            if (place.formatted_address) {
              // Setting location
              setLocation(place.formatted_address);
            } else {
              // No formatted_address found in place data
            }
          });

          // Place listener set up successfully
        } catch (error) {
          // Error initializing autocomplete
          if (
            error instanceof Error &&
            error.message?.includes('InvalidKeyMapError')
          ) {
            setError(
              'Google Maps API key is invalid. Please check your configuration.'
            );
          }
        }
      } else {
        // Cannot initialize autocomplete
      }
    };

    if (window.google && window.google.maps && window.google.maps.places) {
      // Google Maps API already loaded
      initAutocomplete();
    } else {
      // Google Maps API not loaded, loading script
      // Load Google Maps API if not already loaded
      // SECURITY NOTE: This API key is exposed to the frontend.
      // Make sure to restrict it in Google Cloud Console:
      // 1. Restrict to your domain (HTTP referrers)
      // 2. Enable only the APIs you need (Places API, Maps JavaScript API)
      // 3. Set usage quotas to prevent abuse
      if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async&callback=initGoogleMaps`;
        script.async = true;
        script.defer = true;
        script.onerror = error => {
          // Failed to load Google Maps API script
          setError(
            'Failed to load Google Maps API. Please check your API key configuration.'
          );
        };
        
        // Set up global callback
        (window as any).initGoogleMaps = () => {
          // Google Maps API script loaded successfully
          initAutocomplete();
        };
        
        document.head.appendChild(script);
        // Google Maps script added to DOM
      } else {
        // Google Maps script already exists in DOM
        // If script exists but API isn't ready, wait for it
        setTimeout(initAutocomplete, 100);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      if (!eventName.trim()) {
        setError('Event name is required.');
        setLoading(false);
        return;
      }
      // Event theme is optional - no validation needed
      // Start and end dates are optional - no validation needed
      // Require at least one ticket
      if (!tickets || tickets.length === 0) {
        setError('Please add at least one ticket type.');
        setLoading(false);
        return;
      }
      
      // Filter out empty/invalid tickets
      const validTickets = tickets.filter(t => 
        t.name.trim() && 
        Number.isFinite(t.price) && 
        t.price >= 0 && 
        Number.isFinite(t.quantity_available) && 
        t.quantity_available > 0
      );
      
      // Ensure at least one valid ticket exists
      if (validTickets.length === 0) {
        setError('Please create at least one valid ticket with a name, price, and quantity greater than 0.');
        setLoading(false);
        return;
      }
      
      // Update tickets to only include valid ones
      if (validTickets.length !== tickets.length) {
        setTickets(validTickets);
        setError('Removed invalid tickets. Please ensure all tickets have valid information.');
        setLoading(false);
        return;
      }
      // Location is optional - no validation needed
      // Description is optional - no validation needed
      setError('');

      if (!session) {
        setError(
          'You must be logged in to create an event. Redirecting to Google sign-in...'
        );
        setTimeout(() => router.push('/api/auth/direct-google'), 3000);
        setLoading(false);
        return;
      }

      const formatInTimeZone = (date: Date, fmt: string, tz: string) => {
        return format(toZonedTime(date, tz), fmt, {
          timeZone: tz,
        });
      };

      // Combine date and time, then convert to UTC for storage
      const createUtcDateTime = (
        date: Date | null,
        time: string,
        tz: string
      ) => {
        if (!date) return null;
        const [hours, minutes] = time.split(':').map(Number);
        const localDate = new Date(date);
        localDate.setHours(hours, minutes, 0, 0);
        return zonedTimeToUtc(localDate, tz);
      };

      const startUtcDateTime = createUtcDateTime(
        startDate,
        startTime,
        timeZone
      );
      const endUtcDateTime = createUtcDateTime(endDate, endTime, timeZone);

      // Handle all optional fields - save as null if empty
      const additionalInfoToSave = buildAdditionalInfoWithPayment(additionalInfo);
      const finalAdditionalInfo = additionalInfoToSave.trim() || null;
      const finalTheme = eventTheme.trim() || null;
      const finalLocation = location.trim() || null;

      if (eventId) {
        // Update existing event (including auto-created ones)
        const { error } = await supabase
          .from('Events')
          .update({
            name: eventName,
            theme: finalTheme,
            start_date: startUtcDateTime
              ? startUtcDateTime.toISOString()
              : null,
            end_date: endUtcDateTime ? endUtcDateTime.toISOString() : null,
            location: finalLocation,
            additional_info: finalAdditionalInfo,
            time_zone: timeZone,
          })
          .eq('id', eventId);

        if (error) {
          // Error updating event
          setError(error.message);
          setLoading(false);
          return;
        }

        // Save tickets after updating event (direct call, not debounced for final save)
        await saveTickets(eventId);

        setInviteLink(`${window.location.origin}/rsvp?event_id=${eventId}`);
      } else {
        // Create new event
        const { data, error } = await supabase
          .from('Events')
          .insert({
            name: eventName,
            theme: finalTheme,
            start_date: startUtcDateTime
              ? startUtcDateTime.toISOString()
              : null,
            end_date: endUtcDateTime ? endUtcDateTime.toISOString() : null,
            location: finalLocation,
            additional_info: finalAdditionalInfo,
            time_zone: timeZone,
            user_id: session.id,
          })
          .select()
          .single();

        if (error) {
          // Error creating event
          setError(error.message);
          setLoading(false);
          return;
        }

        if (data) {
          setEventId(data.id);
          setInviteLink(`${window.location.origin}/rsvp?event_id=${data.id}`);
          // Save tickets for the new event
          await saveTickets(data.id);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const addTicket = () => {
    if (tickets.length >= 5) return;

    const newTicket = {
      name: '',
      price: 0,
      quantity_available: 1,
      purchase_deadline: null,
    };
    const updatedTickets = [...tickets, newTicket];
    setTickets(updatedTickets);
    
    // Open the editor for the new ticket
    openTicketEditor(tickets.length);

    // Don't auto-save - tickets will be saved when event is created/updated
  };

  const updateTicket = (
    index: number,
    updates: Partial<(typeof tickets)[0]>
  ) => {
    const updatedTickets = [...tickets];
    updatedTickets[index] = { ...updatedTickets[index], ...updates };
    setTickets(updatedTickets);

    // Don't auto-save - tickets will be saved when event is created/updated
  };

  const openTicketEditor = (index: number) => {
    const ticket = tickets[index];
    
    // Check if ticket can be edited (no RSVPs)
    if (!canEditTicket(ticket.id)) {
      const rsvpCount = ticketRsvpCounts[ticket.id!] || 0;
      setError(`Cannot edit "${ticket.name}" ticket - ${rsvpCount} people have already RSVP'd. You can only edit tickets with no RSVPs.`);
      return;
    }
    
    setEditingTicket({
      name: ticket.name,
      price: ticket.price,
      quantity_available: ticket.quantity_available,
      purchase_deadline: ticket.purchase_deadline,
    });
    setSelectedTicketIndex(index);
    setShowTicketSidebar(true);
  };

  const closeTicketEditor = () => {
    setEditingTicket(null);
    setSelectedTicketIndex(null);
    setShowTicketSidebar(false);
  };

  const saveTicketChanges = () => {
    if (selectedTicketIndex !== null && editingTicket) {
      // Validate the editing ticket before saving
      const finalTicket = {
        ...editingTicket,
        name: editingTicket.name.trim() || 'Untitled Ticket',
        price: Math.max(0, editingTicket.price || 0),
        quantity_available: Math.max(1, editingTicket.quantity_available || 1),
      };
      
      updateTicket(selectedTicketIndex, finalTicket);
    }
    closeTicketEditor();
  };

  const removeTicket = (index: number) => {
    const ticket = tickets[index];
    
    // Check if ticket can be removed (no RSVPs)
    if (!canEditTicket(ticket.id)) {
      const rsvpCount = ticketRsvpCounts[ticket.id!] || 0;
      setError(`Cannot remove "${ticket.name}" ticket - ${rsvpCount} people have already RSVP'd. You can only remove tickets with no RSVPs.`);
      return;
    }
    
    // Count valid tickets (after potential removal)
    const remainingTickets = tickets.filter((_, i) => i !== index);
    const validRemainingTickets = remainingTickets.filter(t => 
      t.name.trim() && 
      Number.isFinite(t.price) && 
      t.price >= 0 && 
      Number.isFinite(t.quantity_available) && 
      t.quantity_available > 0
    );
    
    // Prevent removing if it would leave no valid tickets
    if (validRemainingTickets.length === 0) {
      setError('Cannot remove this ticket. Every event must have at least one valid ticket type with a name, price, and quantity.');
      return;
    }
    
    const updatedTickets = tickets.filter((_, i) => i !== index);
    setTickets(updatedTickets);
    if (selectedTicketIndex === index) {
      setSelectedTicketIndex(null);
      setShowTicketSidebar(false);
    }

    // Don't auto-save - tickets will be saved when event is updated
  };

  const [isSavingTickets, setIsSavingTickets] = useState(false);
  const saveTicketsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [ticketRsvpCounts, setTicketRsvpCounts] = useState<Record<string, number>>({});

  // Check if tickets have RSVPs (prevents editing)
  const fetchTicketRsvpCounts = async (eventIdToUse: number) => {
    try {
      const { data: rsvpData, error } = await supabase
        .from('rsvps')
        .select('ticket_id')
        .eq('event_id', eventIdToUse);

      if (error) {
        // Error fetching RSVP counts
        return;
      }

      // Count RSVPs per ticket
      const counts: Record<string, number> = {};
      rsvpData?.forEach(rsvp => {
        if (rsvp.ticket_id) {
          counts[rsvp.ticket_id] = (counts[rsvp.ticket_id] || 0) + 1;
        }
      });

      setTicketRsvpCounts(counts);
    } catch (error) {
      // Error fetching ticket RSVP counts
    }
  };

  // Check if a ticket can be edited (no RSVPs)
  const canEditTicket = (ticketId?: string) => {
    if (!ticketId) return true; // New tickets can always be edited
    return (ticketRsvpCounts[ticketId] || 0) === 0;
  };

  // Count valid tickets
  const getValidTicketsCount = () => {
    return tickets.filter(t => 
      t.name.trim() && 
      Number.isFinite(t.price) && 
      t.price >= 0 && 
      Number.isFinite(t.quantity_available) && 
      t.quantity_available > 0
    ).length;
  };

  const saveTickets = async (eventIdToUse: number | null = eventId) => {
    if (!eventIdToUse) {
      setError('Event must be created before saving tickets.');
      return;
    }
    
    // Prevent multiple simultaneous saves
    if (isSavingTickets) {
      return;
    }
    
    setIsSavingTickets(true);
    
    try {
      // Filter to only valid tickets
      const validTickets = tickets.filter(ticket => 
        ticket.name.trim() && 
        Number.isFinite(ticket.price) && 
        ticket.price >= 0 && 
        Number.isFinite(ticket.quantity_available) && 
        ticket.quantity_available > 0
      );
      
      // Ensure at least one valid ticket
      if (validTickets.length === 0) {
        throw new Error('Cannot save event without at least one valid ticket');
      }
      
      // Delete existing tickets for this event
      await supabase.from('tickets').delete().eq('event_id', eventIdToUse);
      
      // Insert new valid tickets
      const ticketsToInsert = validTickets.map(ticket => ({
        event_id: eventIdToUse,
        name: ticket.name.trim(),
        price: ticket.price,
        quantity_available: ticket.quantity_available,
        purchase_deadline: ticket.purchase_deadline?.toISOString(),
      }));
      
      const { error } = await supabase
        .from('tickets')
        .insert(ticketsToInsert);
      if (error) throw error;
      
      setInviteLink(`${window.location.origin}/rsvp?event_id=${eventIdToUse}`);
    } catch (error) {
      // Error saving tickets
      setError(error instanceof Error ? error.message : 'Failed to save tickets');
    } finally {
      setIsSavingTickets(false);
    }
  };

  const debouncedSaveTickets = (eventIdToUse: number | null = eventId) => {
    // Clear existing timeout
    if (saveTicketsTimeoutRef.current) {
      clearTimeout(saveTicketsTimeoutRef.current);
    }
    
    // Set new timeout
    saveTicketsTimeoutRef.current = setTimeout(() => {
      saveTickets(eventIdToUse);
    }, 1000); // Increased delay to 1 second for better debouncing
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTicketsTimeoutRef.current) {
        clearTimeout(saveTicketsTimeoutRef.current);
      }
    };
  }, []);

  if (sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <div className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
        {/* Page header */}
        <div className="mb-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
            {eventId ? 'Edit Event' : 'Create Event'}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {eventId ? 'Edit Your Event' : 'Create Your Event'}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {eventId
              ? 'Update your event details and manage tickets'
              : 'Bring your vision to life. Create an unforgettable experience for your guests.'}
          </p>
        </div>
        {error && (
          <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit}>
          {/* Event details */}
          <div className="mb-6 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
            <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
              Event Details
            </p>
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="eventName"
                    className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
                  >
                    Event Name
                  </label>
                  <input
                    type="text"
                    id="eventName"
                    value={eventName}
                    onChange={e => setEventName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter your event name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="eventTheme"
                    className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
                  >
                    Event Theme <span className="text-muted-foreground/60">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    id="eventTheme"
                    value={eventTheme}
                    onChange={e => setEventTheme(e.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Optional: e.g., Birthday Party, Corporate Event"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="additionalInfo"
                  className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
                >
                  Description <span className="text-muted-foreground/60">(Optional)</span>
                </label>
                <textarea
                  id="additionalInfo"
                  value={additionalInfo}
                  onChange={e => setAdditionalInfo(e.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Optional: Address details, dress code, what to bring, parking info..."
                />
              </div>
            </div>
          </div>

          {/* Date & time */}
          <div className="mb-6 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
            <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
              Date &amp; Time
            </p>
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <Label
                    htmlFor="start-date-picker"
                    className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
                  >
                    Start Date and Time <span className="text-muted-foreground/60">(Optional)</span>
                  </Label>
                  <div className="flex gap-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          id="start-date-picker"
                          className="flex-1 justify-between font-normal"
                        >
                          {startDate
                            ? startDate.toLocaleDateString()
                            : 'Select date'}
                          <ChevronDownIcon className="text-muted-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto overflow-hidden p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={startDate || undefined}
                          onSelect={date => setStartDate(date || null)}
                        />
                      </PopoverContent>
                    </Popover>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      step="60"
                      className="w-32 appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                    />
                  </div>
                </div>
                <div>
                  <Label
                    htmlFor="end-date-picker"
                    className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
                  >
                    End Date and Time <span className="text-muted-foreground/60">(Optional)</span>
                  </Label>
                  <div className="flex gap-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          id="end-date-picker"
                          className="flex-1 justify-between font-normal"
                        >
                          {endDate ? endDate.toLocaleDateString() : 'Select date'}
                          <ChevronDownIcon className="text-muted-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto overflow-hidden p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={endDate || undefined}
                          onSelect={date => setEndDate(date || null)}
                        />
                      </PopoverContent>
                    </Popover>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      step="60"
                      className="w-32 appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label
                  htmlFor="timeZone"
                  className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
                >
                  Time Zone
                </label>
                <select
                  id="timeZone"
                  value={timeZone}
                  onChange={e => setTimeZone(e.target.value)}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="Europe/London">Greenwich Mean Time</option>
                </select>
              </div>
            </div>
          </div>

          {/* Venue */}
          <div className="mb-6 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
            <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
              Venue
            </p>
            <div>
              <label
                htmlFor="location"
                className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
              >
                Event Location <span className="text-muted-foreground/60">(Optional)</span>
              </label>
              <input
                ref={locationInputRef}
                type="text"
                id="location"
                value={location}
                onChange={e => {
                  // Manual location input
                  setLocation(e.target.value);
                }}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Optional: Start typing to search for a location..."
              />
            </div>
          </div>
        </form>

        {/* Tickets & pricing */}
        <div className="mb-6 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
            Tickets &amp; Pricing
          </p>
          <div className="mb-6">
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-border bg-muted p-4">
              <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Required: At least one ticket type</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Every event must have at least one valid ticket to control capacity and prevent unlimited attendance.
                </p>
              </div>
            </div>
            <p className="mb-6 text-sm text-muted-foreground">
              Manage up to 5 different ticket types for your event. Each ticket
              type can have its own price, quantity, and purchase deadline. You can edit tickets again after the event is created.
              {!eventId && (
                <span className="mt-2 block text-sm text-foreground">
                  Tickets will be saved when you create the event
                </span>
              )}
            </p>

            {/* Ticket count indicator */}
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Ticket Types</span>
                <span className={`rounded-full px-3 py-1 font-mono text-xs font-medium ${
                  getValidTicketsCount() === 0
                    ? 'border border-red-200 bg-red-50 text-red-600'
                    : 'bg-[#e4f5ec] text-[#067a53]'
                }`}>
                  {getValidTicketsCount()} valid of {tickets.length} total
                </span>
              </div>
              {getValidTicketsCount() === 0 && (
                <span className="text-sm font-medium text-red-600">At least 1 required</span>
              )}
            </div>

            {tickets.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-red-200 bg-red-50/50 py-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <svg
                    className="h-8 w-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <p className="mb-2 font-medium text-red-600">No tickets created</p>
                <p className="mb-6 text-sm text-muted-foreground">Your event needs at least one ticket type to control capacity.</p>
                <Button onClick={addTicket}>
                  Create First Ticket Type
                </Button>
              </div>
            ) : getValidTicketsCount() === 0 ? (
              <div className="mb-4 rounded-2xl border-2 border-dashed border-red-200 bg-red-50/50 py-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <p className="mb-2 font-medium text-red-600">No valid tickets</p>
                <p className="mb-4 text-sm text-muted-foreground">All tickets need a name, price, and quantity greater than 0.</p>
                <Button onClick={addTicket}>
                  Add Valid Ticket
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket, index) => {
                  const rsvpCount = ticket.id ? (ticketRsvpCounts[ticket.id] || 0) : 0;
                  const canEdit = canEditTicket(ticket.id);
                  
                  return (
                    <div
                      key={index}
                      className={`flex flex-col gap-4 rounded-xl border p-4 transition-colors sm:flex-row sm:items-center sm:justify-between sm:p-5 ${
                        canEdit
                          ? 'border-border bg-white hover:bg-muted/50'
                          : 'border-border bg-muted'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-base font-semibold text-foreground">
                            {ticket.name || 'Untitled Ticket'}
                          </h3>
                          {!canEdit && (
                            <span className="rounded-full border border-border bg-white px-2 py-1 font-mono text-[10px] tracking-wide text-muted-foreground">
                              {rsvpCount} RSVP{rsvpCount !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                          ${ticket.price} • {ticket.quantity_available} available
                          {ticket.purchase_deadline && (
                            <span>
                              {' '}
                              • Until{' '}
                              {ticket.purchase_deadline.toLocaleDateString()}
                            </span>
                          )}
                        </p>
                        {!canEdit && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Cannot edit - people have already RSVP&#x27;d to this ticket
                          </p>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => openTicketEditor(index)}
                          variant="outline"
                          disabled={!canEdit}
                          className="px-4 py-2 text-sm"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => removeTicket(index)}
                          variant="outline"
                          disabled={!canEdit}
                          className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-600"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {tickets.length < 5 && (
                  <Button
                    onClick={addTicket}
                    variant="outline"
                    className="w-full rounded-xl border-2 border-dashed border-border py-4 text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                  >
                    + Add Another Ticket Type
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Payment handles if any ticket is paid */}
        {tickets.some(t => t.price > 0) && (
          <div className="mb-6 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Payment Details
            </p>
            <h4 className="mb-2 text-lg font-semibold text-foreground">Payment Details for Paid Tickets</h4>
            <p className="mb-4 text-sm text-muted-foreground">
              Add your payment handle(s) so guests can send payment after selecting a paid ticket.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Venmo Username</label>
                <input
                  type="text"
                  value={venmoHandle}
                  onChange={e => setVenmoHandle(e.target.value)}
                  placeholder="e.g., @yourname"
                  className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Zelle (phone or email)</label>
                <input
                  type="text"
                  value={zelleHandle}
                  onChange={e => setZelleHandle(e.target.value)}
                  placeholder="e.g., 555-123-4567 or you@email.com"
                  className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">These will be shown on the RSVP page under Additional Info.</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
          <Button
            onClick={() => router.push('/event')}
            variant="outline"
          >
            Cancel
          </Button>
          <div className="flex gap-3">
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
            >
              {eventId ? 'Update Event' : 'Create Event'}
            </Button>
          </div>
        </div>

        {/* Success Section - Show invite link after event creation */}
        {inviteLink && (
          <div className="mt-8 rounded-2xl border border-[#067a53]/25 bg-[#e4f5ec] p-6 sm:p-8">
            <div className="mb-4 flex items-center">
              <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-white">
                <svg
                  className="h-5 w-5 text-[#067a53]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#067a53]">
                Event {eventId ? 'Updated' : 'Created'} Successfully!
              </h3>
            </div>
            <p className="mb-6 text-sm text-[#067a53]">
              Share this link with your guests:
            </p>
            <input
              type="text"
              value={inviteLink}
              readOnly
              className="block w-full rounded-lg border border-[#067a53]/25 bg-white px-4 py-3 font-mono text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-[#067a53]/20"
            />
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                onClick={() => navigator.clipboard.writeText(inviteLink)}
              >
                Copy Invite Link
              </Button>
              <Button
                onClick={() => router.push('/event')}
                variant="outline"
              >
                Go to My Events
              </Button>
            </div>
          </div>
        )}

        {/* Ticket Sidebar for Edit Form */}
        {showTicketSidebar && selectedTicketIndex !== null && editingTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-xl sm:p-8">
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Ticket
              </p>
              <h3 className="mb-6 text-xl font-semibold text-foreground">
                {tickets[selectedTicketIndex].id ? 'Edit' : 'Create'} Ticket
              </h3>

              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Ticket Name
                  </label>
                  <input
                    type="text"
                    value={editingTicket.name}
                    onChange={e =>
                      setEditingTicket(prev => prev ? {...prev, name: e.target.value} : null)
                    }
                    className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g., Early Bird, VIP, General"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editingTicket.price === 0 ? '' : editingTicket.price}
                    onChange={e => {
                      const value = e.target.value;
                      const numValue = value === '' ? 0 : parseInt(value);
                      if (!isNaN(numValue) && numValue >= 0) {
                        setEditingTicket(prev => prev ? {...prev, price: numValue} : null);
                      }
                    }}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter price (default $0)"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Quantity Available
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingTicket.quantity_available === 0 ? '' : editingTicket.quantity_available}
                    onChange={e => {
                      const value = e.target.value;
                      const numValue = value === '' ? 0 : parseInt(value);
                      if (!isNaN(numValue) && numValue >= 0) {
                        setEditingTicket(prev => prev ? {...prev, quantity_available: numValue} : null);
                      }
                    }}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter quantity (minimum 1)"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Purchase Deadline (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={
                      editingTicket.purchase_deadline
                        ?.toISOString()
                        .slice(0, 16) || ''
                    }
                    onChange={e =>
                      setEditingTicket(prev => prev ? {
                        ...prev,
                        purchase_deadline: e.target.value ? new Date(e.target.value) : null
                      } : null)
                    }
                    className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <Button
                  onClick={closeTicketEditor}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveTicketChanges}
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
