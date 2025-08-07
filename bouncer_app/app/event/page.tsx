'use client';

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
  const [deleting, setDeleting] = useState(false);
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

  // Add deleteAllEvents function
  const deleteAllEvents = async () => {
    if (!session) return;
    setDeleting(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('Events')
        .delete()
        .eq('user_id', session.id);
      if (error) {
        setError('Failed to delete events: ' + error.message);
      } else {
        setEvents([]);
      }
    } catch (err) {
      setError('Failed to delete events.');
    } finally {
      setDeleting(false);
    }
  };

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
              My Events
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl">
              Manage and organize your events with style. View, edit, and share your upcoming events.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 sm:px-8 lg:px-12">
        {/* Controls Section with elevated dark card */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-3xl border border-gray-700/50 shadow-xl shadow-black/50 p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            {/* Sort Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <span className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                Filter & Sort
              </span>
              
              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="bg-gray-700/90 border-gray-600 text-white hover:bg-gray-600 shadow-sm">
                      Sort by: {sortBy === 'start_date' ? 'Date' : 'Name'}
                      <ChevronDownIcon className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48 bg-gray-800/95 backdrop-blur-sm border-gray-700 shadow-xl">
                    <DropdownMenuLabel className="text-gray-300">Sort Options</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-700" />
                                         <DropdownMenuItem 
                       onClick={() => setSortBy('start_date')}
                       className="cursor-pointer hover:bg-purple-800/30 text-gray-200 hover:text-white"
                     >
                       <CalendarIcon className="w-4 h-4 mr-2 text-purple-300" />
                       Start Date
                     </DropdownMenuItem>
                     <DropdownMenuItem 
                       onClick={() => setSortBy('name')}
                       className="cursor-pointer hover:bg-purple-800/30 text-gray-200 hover:text-white"
                     >
                       Event Name
                     </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="bg-gray-700/90 border-gray-600 text-white hover:bg-gray-600 shadow-sm">
                      {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                      <ChevronDownIcon className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-40 bg-gray-800/95 backdrop-blur-sm border-gray-700 shadow-xl">
                    <DropdownMenuLabel className="text-gray-300">Order</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-700" />
                                         <DropdownMenuItem 
                       onClick={() => setSortOrder('asc')}
                       className="cursor-pointer hover:bg-purple-800/30 text-gray-200 hover:text-white"
                     >
                       Ascending
                     </DropdownMenuItem>
                     <DropdownMenuItem 
                       onClick={() => setSortOrder('desc')}
                       className="cursor-pointer hover:bg-purple-800/30 text-gray-200 hover:text-white"
                     >
                       Descending
                     </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Delete All Button */}
            {events.length > 0 && (
              <Button
                onClick={deleteAllEvents}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-red-900/50 transition-all duration-200"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete All Events'}
              </Button>
            )}
          </div>
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-xl p-12 text-center">
            <div className="max-w-md mx-auto">
                             <div className="w-20 h-20 bg-purple-800/30 rounded-full flex items-center justify-center mx-auto mb-6">
                 <CalendarIcon className="w-10 h-10 text-purple-300" />
               </div>
               <h3 className="text-2xl font-semibold text-white mb-3">No Events Yet</h3>
               <p className="text-gray-400 mb-6">
                 Ready to create your first event? Get started and bring people together!
               </p>
               <Button 
                 onClick={() => router.push('/create-event')}
                 className="bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 shadow-lg hover:shadow-purple-800/50 transition-all duration-200"
               >
                Schedule Your First Event
              </Button>
            </div>
          </div>
         ) : (
           <>
             <div className="w-full flex flex-wrap gap-8 justify-start items-start content-start">
               {events.map(event => (
                 <EventCard
                   key={event.id}
                   event={event}
                   onShare={handleShare}
                 />
               ))}
             </div>
             <div className="mt-8">
              <Button
                 onClick={() => router.push('/create-event')}
                 className="bg-gray-800/95 shadow-lg hover:shadow-purple-800/50 transition-all duration-200"
               >
                <PlusIcon className="w-4 h-4 mr-2" />
                Schedule Another Event
               </Button>
             </div>
           </>
         )}
      </div>
      <Footer />
    </div>
  );
}

function handleShare(eventId: string) {
  const inviteLink = `${window.location.origin}/rsvp?event_id=${eventId}`;
  navigator.clipboard.writeText(inviteLink);
  alert('Invite link copied to clipboard!');
}
