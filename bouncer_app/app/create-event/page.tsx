export const dynamic = 'force-dynamic'

'use client';

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
    console.log('📍 Location state changed to:', location);
  }, [location]);

  useEffect(() => {
    let mounted = true;
    let redirectTimeout: NodeJS.Timeout | null = null;

    // Set up auth state listener first
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log(
        'Auth state changed:',
        event,
        session?.user?.email || 'no user'
      );

      // Clear any pending redirect
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
        redirectTimeout = null;
      }

      setSessionLoading(false);
      if (session?.user) {
        console.log('Session found from auth change:', session.user.email);
        setSession(session.user);
      } else {
        console.log('No session from auth state change');
        setSession(null);
        // Only redirect on explicit sign out, not initial load
        if (event === 'SIGNED_OUT') {
          console.log('User signed out, redirecting to login');
          router.push('/login');
        } else if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          // For initial session or token refresh, if no user, set a delay before redirect
          console.log(
            'No user after initial session check, setting redirect timeout'
          );
          redirectTimeout = setTimeout(() => {
            if (mounted) {
              // Check current session state before redirecting
              supabase.auth
                .getSession()
                .then(({ data: { session: currentSession } }) => {
                  if (!currentSession?.user && mounted) {
                    console.log(
                      'No session found after timeout, redirecting to login'
                    );
                    router.push('/login');
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
          console.error('Initial session error:', error);
          setSessionLoading(false);
          setSession(null);
          return;
        }

        console.log(
          'Initial session check:',
          session?.user?.email || 'no session'
        );
        setSessionLoading(false);

        if (session?.user) {
          console.log('Setting session for user:', session.user.email);
          setSession(session.user);
        } else {
          console.log('No session found, will set redirect timeout');
          setSession(null);
          // Set a timeout to redirect if no session is established
          redirectTimeout = setTimeout(() => {
            if (mounted) {
              console.log('Timeout reached, checking session one more time...');
              // Double-check session state before redirecting
              supabase.auth
                .getSession()
                .then(({ data: { session: currentSession } }) => {
                  if (!currentSession?.user && mounted) {
                    console.log('Confirmed no session, redirecting to login');
                    router.push('/login');
                  } else if (currentSession?.user) {
                    console.log(
                      'Session found during timeout check, not redirecting'
                    );
                  }
                });
            }
          }, 2000); // Reduced to 2 seconds
        }
      } catch (error) {
        console.error('Failed to get initial session:', error);
        if (mounted) {
          setSessionLoading(false);
          setSession(null);
          router.push('/login');
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
        console.error('Error fetching event data:', error);
        setError(error.message);
      } else if (data) {
        setEventName(data.name);
        setEventTheme(data.theme);
        setStartDate(new Date(data.start_date));
        setEndDate(new Date(data.end_date));
        setTimeZone(data.time_zone);
        setLocation(data.location || '');
        const { baseInfo, venmo, zelle } = extractPaymentInfo(
          data.additional_info || ''
        );
        setAdditionalInfo(baseInfo);
        setVenmoHandle(venmo);
        setZelleHandle(zelle);
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
      console.log('🔍 Initializing Google Places Autocomplete...');
      console.log('📍 locationInputRef.current:', locationInputRef.current);
      console.log('🌐 window.google:', window.google);
      console.log(
        '🔑 Google Maps API Key:',
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'Set' : 'Missing'
      );

      // Check if Google Maps API is fully loaded
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        console.log('⏳ Google Maps API not fully loaded yet, retrying in 100ms...');
        setTimeout(initAutocomplete, 100);
        return;
      }

      if (locationInputRef.current) {
        try {
          console.log('✅ Creating Autocomplete widget...');
          const autocomplete = new window.google.maps.places.Autocomplete(
            locationInputRef.current,
            {
              types: ['establishment', 'geocode'],
              fields: ['formatted_address', 'geometry', 'name'],
            }
          );

          console.log('✅ Autocomplete widget created successfully');
          console.log('🎯 Setting up place_changed listener...');

          autocomplete.addListener('place_changed', () => {
            console.log('🎉 Place selection triggered!');
            const place = autocomplete.getPlace();
            console.log('📋 Selected place data:', place);

            if (place.formatted_address) {
              console.log('📍 Setting location to:', place.formatted_address);
              setLocation(place.formatted_address);
              console.log('✅ Location updated successfully');
            } else {
              console.log('⚠️ No formatted_address found in place data');
              console.log('🔍 Available place data:', Object.keys(place));
            }
          });

          console.log('✅ Place listener set up successfully');
        } catch (error) {
          console.error('❌ Error initializing autocomplete:', error);
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
        console.log('❌ Cannot initialize autocomplete:');
        console.log(
          '  - locationInputRef.current:',
          !!locationInputRef.current
        );
        console.log('  - window.google:', !!window.google);
      }
    };

    if (window.google && window.google.maps && window.google.maps.places) {
      console.log('🌐 Google Maps API already loaded');
      initAutocomplete();
    } else {
      console.log('📡 Google Maps API not loaded, loading script...');
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
          console.error('❌ Failed to load Google Maps API script:', error);
          setError(
            'Failed to load Google Maps API. Please check your API key configuration.'
          );
        };
        
        // Set up global callback
        (window as any).initGoogleMaps = () => {
          console.log('✅ Google Maps API script loaded successfully');
          initAutocomplete();
        };
        
        document.head.appendChild(script);
        console.log('📡 Google Maps script added to DOM');
      } else {
        console.log('📡 Google Maps script already exists in DOM');
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
      if (!eventTheme.trim()) {
        setError('Event theme is required.');
        setLoading(false);
        return;
      }
      if (!startDate || !endDate) {
        setError('Start and end dates are required.');
        setLoading(false);
        return;
      }
      // Require at least one ticket
      if (!tickets || tickets.length === 0) {
        setError('Please add at least one ticket type.');
        setLoading(false);
        return;
      }
      // Basic ticket validation: non-empty name, non-negative price, positive quantity
      const invalidTicket = tickets.find(
        t => !t.name.trim() || t.price < 0 || !Number.isFinite(t.price) || t.quantity_available <= 0
      );
      if (invalidTicket) {
        setError('Each ticket must have a name, non-negative price, and quantity of at least 1.');
        setLoading(false);
        return;
      }
      if (!location.trim()) {
        setError('Event location is required.');
        setLoading(false);
        return;
      }
      if (!additionalInfo.trim()) {
        setError('Additional information is required.');
        setLoading(false);
        return;
      }
      setError('');

      if (!session) {
        setError(
          'You must be logged in to create an event. Redirecting to login...'
        );
        setTimeout(() => router.push('/login'), 3000);
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

      // Merge payment info if applicable
      const additionalInfoToSave = buildAdditionalInfoWithPayment(additionalInfo);

      if (eventId) {
        // Update existing event (including auto-created ones)
        const { error } = await supabase
          .from('Events')
          .update({
            name: eventName,
            theme: eventTheme,
            start_date: startUtcDateTime
              ? startUtcDateTime.toISOString()
              : null,
            end_date: endUtcDateTime ? endUtcDateTime.toISOString() : null,
            location: location,
            additional_info: additionalInfoToSave,
            time_zone: timeZone,
          })
          .eq('id', eventId);

        if (error) {
          console.error('Error updating event:', error);
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
            theme: eventTheme,
            start_date: startUtcDateTime
              ? startUtcDateTime.toISOString()
              : null,
            end_date: endUtcDateTime ? endUtcDateTime.toISOString() : null,
            location: location,
            additional_info: additionalInfoToSave,
            time_zone: timeZone,
            user_id: session.id,
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating event:', error);
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
    setSelectedTicketIndex(tickets.length);
    setShowTicketSidebar(true);

    // Auto-save new ticket only if event already exists
    if (eventId) {
      debouncedSaveTickets(eventId);
    }
  };

  const updateTicket = (
    index: number,
    updates: Partial<(typeof tickets)[0]>
  ) => {
    const updatedTickets = [...tickets];
    updatedTickets[index] = { ...updatedTickets[index], ...updates };
    setTickets(updatedTickets);

    // Auto-save tickets after a short delay
    if (eventId) {
      debouncedSaveTickets(eventId);
    }
  };

  const removeTicket = (index: number) => {
    // Prevent removing the last ticket; require at least one ticket
    if (tickets.length <= 1) {
      setError('At least one ticket type is required.');
      return;
    }
    const updatedTickets = tickets.filter((_, i) => i !== index);
    setTickets(updatedTickets);
    if (selectedTicketIndex === index) {
      setSelectedTicketIndex(null);
      setShowTicketSidebar(false);
    }

    // Auto-save after removing ticket
    if (eventId) {
      debouncedSaveTickets(eventId);
    }
  };

  const [isSavingTickets, setIsSavingTickets] = useState(false);
  const saveTicketsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      // Delete existing tickets for this event
      await supabase.from('tickets').delete().eq('event_id', eventIdToUse);
      
      // Insert new tickets (only non-empty tickets)
      const validTickets = tickets.filter(ticket => ticket.name.trim() !== '');
      if (validTickets.length > 0) {
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
      }
      setInviteLink(`${window.location.origin}/rsvp?event_id=${eventIdToUse}`);
    } catch (error) {
      console.error('Error saving tickets:', error);
      setError('Failed to save tickets');
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
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      {/* Extended Hero Section with Header */}
      <div className="relative bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 text-white overflow-hidden">
        {/* Background: subtle beams + dotted grid */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Thin rave-style light beams */}
          <div
            className="absolute top-0 left-1/2 w-32 h-full bg-gradient-to-b from-purple-600/50 via-purple-600/25 to-transparent transform -translate-x-[460px] skew-x-16"
            style={{ clipPath: 'polygon(45% 0%, 55% 0%, 85% 100%, 15% 100%)' }}
          ></div>
          <div
            className="absolute top-0 left-1/2 w-24 h-full bg-gradient-to-b from-orange-400/60 via-orange-500/30 to-transparent transform -translate-x-[200px]"
            style={{ clipPath: 'polygon(45% 0%, 55% 0%, 85% 100%, 15% 100%)' }}
          ></div>
          <div
            className="absolute top-0 left-1/2 w-28 h-full bg-gradient-to-b from-purple-400/55 via-purple-500/28 to-transparent transform -skew-x-16 translate-x-[60px]"
            style={{ clipPath: 'polygon(45% 0%, 55% 0%, 85% 100%, 15% 100%)' }}
          ></div>
          <div
            className="absolute top-0 left-1/2 w-20 h-full bg-gradient-to-b from-orange-600/45 via-orange-600/20 to-transparent transform translate-x-[300px] skew-x-12"
            style={{ clipPath: 'polygon(45% 0%, 55% 0%, 85% 100%, 15% 100%)' }}
          ></div>
          <div
            className="absolute top-0 left-1/2 w-16 h-full bg-gradient-to-b from-purple-500/40 via-purple-500/18 to-transparent transform -translate-x-[600px] -skew-x-8"
            style={{ clipPath: 'polygon(45% 0%, 55% 0%, 85% 100%, 15% 100%)' }}
          ></div>
          <div
            className="absolute top-0 left-1/2 w-18 h-full bg-gradient-to-b from-orange-400/40 via-orange-400/18 to-transparent transform translate-x-[500px] skew-x-8"
            style={{ clipPath: 'polygon(45% 0%, 55% 0%, 85% 100%, 15% 100%)' }}
          ></div>
          {/* Dotted grid overlay */}
          <div className="absolute inset-0 opacity-[0.14]" style={{
            backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
            color: '#ffffff',
            backgroundSize: '22px 22px',
            backgroundPosition: '0 0, 11px 11px',
          }}></div>
        </div>

        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-800/15 via-transparent to-indigo-800/25"></div>

        {/* Header integrated into hero */}
        <div className="relative z-20">
          <Header />
        </div>

        {/* Hero content */}
        <div className="relative px-6 py-16 sm:px-8 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              {eventId ? 'Edit Your Event' : 'Create Your Event'}
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl">
              {eventId
                ? 'Update your event details and manage tickets'
                : 'Bring your vision to life. Create an unforgettable experience for your guests.'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 sm:px-8 lg:px-12">
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-8">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Main Form Card */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-3xl border border-gray-700/50 shadow-xl shadow-black/50 p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Event Details</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="eventName"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Event Name
                </label>
                <input
                  type="text"
                  id="eventName"
                  value={eventName}
                  onChange={e => setEventName(e.target.value)}
                  className="w-full rounded-lg border border-gray-600 bg-gray-700/50 px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-colors"
                  placeholder="Enter your event name"
                />
              </div>
              <div>
                <label
                  htmlFor="eventTheme"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Event Theme
                </label>
                <input
                  type="text"
                  id="eventTheme"
                  value={eventTheme}
                  onChange={e => setEventTheme(e.target.value)}
                  className="w-full rounded-lg border border-gray-600 bg-gray-700/50 px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-colors"
                  placeholder="e.g., Birthday Party, Corporate Event"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label
                  htmlFor="start-date-picker"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Start Date and Time
                </Label>
                <div className="flex gap-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="start-date-picker"
                        className="flex-1 justify-between font-normal bg-gray-700/50 border-gray-600 text-white hover:bg-gray-600"
                      >
                        {startDate
                          ? startDate.toLocaleDateString()
                          : 'Select date'}
                        <ChevronDownIcon className="text-purple-300" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto overflow-hidden p-0 bg-gray-800 border-gray-600"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={startDate || undefined}
                        onSelect={date => setStartDate(date || null)}
                        className="text-white"
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    step="60"
                    className="w-32 bg-gray-700/50 border-gray-600 text-white focus:border-purple-500 focus:ring-purple-500/20 appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                  />
                </div>
              </div>
              <div>
                <Label
                  htmlFor="end-date-picker"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  End Date and Time
                </Label>
                <div className="flex gap-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="end-date-picker"
                        className="flex-1 justify-between font-normal bg-gray-700/50 border-gray-600 text-white hover:bg-gray-600"
                      >
                        {endDate ? endDate.toLocaleDateString() : 'Select date'}
                        <ChevronDownIcon className="text-purple-300" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto overflow-hidden p-0 bg-gray-800 border-gray-600"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={endDate || undefined}
                        onSelect={date => setEndDate(date || null)}
                        className="text-white"
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    step="60"
                    className="w-32 bg-gray-700/50 border-gray-600 text-white focus:border-purple-500 focus:ring-purple-500/20 appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                  />
                </div>
              </div>
            </div>
            <div>
              <label
                htmlFor="timeZone"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Time Zone
              </label>
              <select
                id="timeZone"
                value={timeZone}
                onChange={e => setTimeZone(e.target.value)}
                className="w-full rounded-lg border border-gray-600 bg-gray-700/50 px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-colors"
              >
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="Europe/London">Greenwich Mean Time</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Event Location
              </label>
              <input
                ref={locationInputRef}
                type="text"
                id="location"
                value={location}
                onChange={e => {
                  console.log('✏️ Manual location input:', e.target.value);
                  setLocation(e.target.value);
                }}
                className="w-full rounded-lg border border-gray-600 bg-gray-700/50 px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-colors"
                placeholder="Start typing to search for a location..."
              />
            </div>
            <div>
              <label
                htmlFor="additionalInfo"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Description
              </label>
              <textarea
                id="additionalInfo"
                value={additionalInfo}
                onChange={e => setAdditionalInfo(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-600 bg-gray-700/50 px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-colors resize-none"
                placeholder="Address, dress code, what to bring, parking info..."
              />
            </div>
          </form>
        </div>

        {/* Ticket Management Section */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-3xl border border-gray-700/50 shadow-xl shadow-black/50 p-8 mb-8">
          <h3 className="text-2xl font-bold text-white mb-6">Event Tickets</h3>
          <div className="mb-6">
            <p className="text-gray-300 mb-6">
              Manage up to 5 different ticket types for your event. Each ticket
              type can have its own price, quantity, and purchase deadline.
              {!eventId && (
                <span className="block mt-2 text-sm text-orange-300">
                  💡 Tickets will auto-save after you create the main event
                </span>
              )}
            </p>

            {tickets.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-600/50 rounded-2xl bg-gray-800/30">
                <div className="w-16 h-16 bg-purple-800/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-purple-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                    />
                  </svg>
                </div>
                <p className="text-gray-400 mb-2">No tickets created yet</p>
                <p className="text-gray-300 mb-6">A default <span className="font-semibold text-white">Free</span> ticket for 100 guests has been added.</p>
                <Button
                  onClick={addTicket}
                  className="bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 shadow-lg hover:shadow-purple-800/50 transition-all duration-200"
                >
                  Add Another Ticket Type
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-6 border border-gray-600/50 rounded-xl bg-gray-700/30 backdrop-blur-sm hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-lg">
                        {ticket.name || 'Untitled Ticket'}
                      </h3>
                      <p className="text-sm text-gray-300 mt-1">
                        ${ticket.price} • {ticket.quantity_available} available
                        {ticket.purchase_deadline && (
                          <span>
                            {' '}
                            • Until{' '}
                            {ticket.purchase_deadline.toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => {
                          setSelectedTicketIndex(index);
                          setShowTicketSidebar(true);
                        }}
                        variant="outline"
                        className="px-4 py-2 text-sm bg-purple-800/20 border-purple-500/50 text-purple-300 hover:bg-purple-800/40 hover:text-white"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => removeTicket(index)}
                        variant="outline"
                        className="px-4 py-2 text-sm bg-red-800/20 border-red-500/50 text-red-300 hover:bg-red-800/40 hover:text-white"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}

                {tickets.length < 5 && (
                  <Button
                    onClick={addTicket}
                    variant="outline"
                    className="w-full py-4 border-2 border-dashed border-gray-600/50 rounded-xl text-gray-300 hover:border-purple-500/50 hover:text-purple-300 hover:bg-purple-800/10 transition-all"
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
          <div className="mt-4 rounded-2xl border border-fuchsia-600/30 bg-fuchsia-900/10 p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Payment Details for Paid Tickets</h4>
            <p className="text-sm text-fuchsia-200 mb-4">
              Add your payment handle(s) so guests can send payment after selecting a paid ticket.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Venmo Username</label>
                <input
                  type="text"
                  value={venmoHandle}
                  onChange={e => setVenmoHandle(e.target.value)}
                  placeholder="e.g., @yourname"
                  className="w-full rounded-lg border border-gray-600 bg-gray-700/50 px-4 py-3 text-white placeholder-gray-400 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Zelle (phone or email)</label>
                <input
                  type="text"
                  value={zelleHandle}
                  onChange={e => setZelleHandle(e.target.value)}
                  placeholder="e.g., 555-123-4567 or you@email.com"
                  className="w-full rounded-lg border border-gray-600 bg-gray-700/50 px-4 py-3 text-white placeholder-gray-400 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 focus:outline-none transition-colors"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">These will be shown on the RSVP page under Additional Info.</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <Button
            onClick={() => router.push('/event')}
            variant="outline"
            className="bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
          >
            Cancel
          </Button>
          <div className="flex gap-3">
            <Button
              type="submit"
              onClick={handleSubmit}
              className="bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 shadow-lg hover:shadow-purple-800/50 transition-all duration-200"
              disabled={loading}
            >
              {eventId ? 'Update Event' : 'Create Event'}
            </Button>
          </div>
        </div>

        {/* Success Section - Show invite link after event creation */}
        {inviteLink && (
          <div className="bg-green-900/20 backdrop-blur-sm rounded-3xl border border-green-500/30 shadow-xl shadow-black/50 p-8 mt-8">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-green-400"
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
              <h3 className="text-xl font-bold text-green-400">
                Event {eventId ? 'Updated' : 'Created'} Successfully!
              </h3>
            </div>
            <p className="text-green-300 mb-6">
              Share this link with your guests:
            </p>
            <input
              type="text"
              value={inviteLink}
              readOnly
              className="block w-full rounded-lg border border-green-500/30 bg-green-900/20 px-4 py-3 text-green-100 shadow-sm focus:border-green-400 focus:ring-2 focus:ring-green-400/20 focus:outline-none"
            />
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => navigator.clipboard.writeText(inviteLink)}
                className="bg-gradient-to-r from-green-700 to-emerald-700 hover:from-green-800 hover:to-emerald-800 shadow-lg hover:shadow-green-800/50 transition-all duration-200"
              >
                Copy Invite Link
              </Button>
              <Button
                onClick={() => router.push('/event')}
                variant="outline"
                className="bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
              >
                Go to My Events
              </Button>
            </div>
          </div>
        )}

        {/* Ticket Sidebar for Edit Form */}
        {showTicketSidebar && selectedTicketIndex !== null && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800/95 backdrop-blur-sm rounded-2xl border border-gray-600/50 shadow-2xl p-8 w-full max-w-md mx-4">
              <h3 className="text-xl font-bold text-white mb-6">
                {tickets[selectedTicketIndex].id ? 'Edit' : 'Create'} Ticket
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ticket Name
                  </label>
                  <input
                    type="text"
                    value={tickets[selectedTicketIndex].name}
                    onChange={e =>
                      updateTicket(selectedTicketIndex, {
                        name: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-600 bg-gray-700/50 px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-colors"
                    placeholder="e.g., Early Bird, VIP, General"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={tickets[selectedTicketIndex].price || ''}
                    onChange={e => {
                      const value = e.target.value;
                      const numValue = value === '' ? 0 : parseInt(value);
                      if (!isNaN(numValue) && numValue >= 0) {
                        updateTicket(selectedTicketIndex, {
                          price: numValue,
                        });
                      }
                    }}
                    className="w-full rounded-lg border border-gray-600 bg-gray-700/50 px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Quantity Available
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={tickets[selectedTicketIndex].quantity_available || ''}
                    onChange={e => {
                      const value = e.target.value;
                      const numValue = value === '' ? 0 : parseInt(value);
                      if (!isNaN(numValue) && numValue >= 1) {
                        updateTicket(selectedTicketIndex, {
                          quantity_available: numValue,
                        });
                      }
                    }}
                    className="w-full rounded-lg border border-gray-600 bg-gray-700/50 px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Purchase Deadline (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={
                      tickets[selectedTicketIndex].purchase_deadline
                        ?.toISOString()
                        .slice(0, 16) || ''
                    }
                    onChange={e =>
                      updateTicket(selectedTicketIndex, {
                        purchase_deadline: e.target.value
                          ? new Date(e.target.value)
                          : null,
                      })
                    }
                    className="w-full rounded-lg border border-gray-600 bg-gray-700/50 px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-center gap-3 mt-8">
                <Button
                  onClick={() => setShowTicketSidebar(false)}
                  className="bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 shadow-lg hover:shadow-purple-800/50 transition-all duration-200"
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
