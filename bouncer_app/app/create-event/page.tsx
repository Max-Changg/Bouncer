'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import { createBrowserClient } from '@supabase/ssr';
import type { Session, User } from '@supabase/supabase-js';

import { format, toZonedTime } from 'date-fns-tz';
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
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: 'sb-auth-token',
      },
    }
  );
  const [session, setSession] = useState<User | null>(null);
  const [eventId, setEventId] = useState<number | null>(null);
  const [tickets, setTickets] = useState<Array<{
    id?: string;
    name: string;
    price: number;
    quantity_available: number;
    purchase_deadline: Date | null;
  }>>([]);
  const [selectedTicketIndex, setSelectedTicketIndex] = useState<number | null>(null);
  const [showTicketSidebar, setShowTicketSidebar] = useState(false);

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
        setAdditionalInfo(data.additional_info);
      }
      
      // Load existing tickets for this event
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .eq('event_id', id);
      
      if (!ticketsError && ticketsData) {
        setTickets(ticketsData.map(ticket => ({
          id: ticket.id,
          name: ticket.name,
          price: ticket.price,
          quantity_available: ticket.quantity_available,
          purchase_deadline: ticket.purchase_deadline ? new Date(ticket.purchase_deadline) : null,
        })));
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
      subscription.unsubscribe();
    };
  }, [supabase.auth, router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim()) {
      setError('Event name is required.');
      return;
    }
    if (!eventTheme.trim()) {
      setError('Event theme is required.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Start and end dates are required.');
      return;
    }
    if (!additionalInfo.trim()) {
      setError('Additional information is required.');
      return;
    }
    setError('');

    if (!session) {
      setError(
        'You must be logged in to create an event. Redirecting to login...'
      );
      setTimeout(() => router.push('/login'), 3000);
      return;
    }

    const formatInTimeZone = (date: Date, fmt: string, tz: string) => {
      return format(toZonedTime(date, tz), fmt, {
        timeZone: tz,
      });
    };

    // Combine date and time
    const createDateTime = (date: Date | null, time: string) => {
      if (!date) return null;
      const [hours, minutes] = time.split(':').map(Number);
      const combinedDate = new Date(date);
      combinedDate.setHours(hours, minutes, 0, 0);
      return combinedDate;
    };

    const startDateTime = createDateTime(startDate, startTime);
    const endDateTime = createDateTime(endDate, endTime);

    if (eventId) {
      // Update existing event
      const { error } = await supabase
        .from('Events')
        .update({
          name: eventName,
          theme: eventTheme,
          start_date: startDateTime
            ? formatInTimeZone(
                startDateTime,
                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                timeZone
              )
            : null,
          end_date: endDateTime
            ? formatInTimeZone(
                endDateTime,
                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                timeZone
              )
            : null,
          additional_info: additionalInfo,
          time_zone: timeZone,
        })
        .eq('id', eventId);

      if (error) {
        console.error('Error updating event:', error);
        setError(error.message);
        return;
      }

      // Save tickets
      await saveTickets();

      setInviteLink(`${window.location.origin}/rsvp?event_id=${eventId}`);
    } else {
      // Create new event
      const { data, error } = await supabase
        .from('Events')
        .insert({
          name: eventName,
          theme: eventTheme,
          start_date: startDateTime
            ? formatInTimeZone(
                startDateTime,
                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                timeZone
              )
            : null,
          end_date: endDateTime
            ? formatInTimeZone(
                endDateTime,
                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                timeZone
              )
            : null,
          additional_info: additionalInfo,
          time_zone: timeZone,
          user_id: session.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating event:', error);
        setError(error.message);
        return;
      }

      if (data) {
        setEventId(data.id);
        setInviteLink(`${window.location.origin}/rsvp?event_id=${data.id}`);
        
        // Save tickets for the new event
        await saveTickets();
      }
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
    setTickets([...tickets, newTicket]);
    setSelectedTicketIndex(tickets.length);
    setShowTicketSidebar(true);
  };

  const updateTicket = (index: number, updates: Partial<typeof tickets[0]>) => {
    const updatedTickets = [...tickets];
    updatedTickets[index] = { ...updatedTickets[index], ...updates };
    setTickets(updatedTickets);
  };

  const removeTicket = (index: number) => {
    setTickets(tickets.filter((_, i) => i !== index));
    if (selectedTicketIndex === index) {
      setSelectedTicketIndex(null);
      setShowTicketSidebar(false);
    }
  };

  const saveTickets = async () => {
    if (!eventId) {
      // If no eventId, we need to create the event first
      await handleSubmit(new Event('submit') as any);
      return;
    }
    
    try {
      // Delete existing tickets for this event
      await supabase.from('tickets').delete().eq('event_id', eventId);
      
      // Insert new tickets
      if (tickets.length > 0) {
        const ticketsToInsert = tickets.map(ticket => ({
          event_id: eventId,
          name: ticket.name,
          price: ticket.price,
          quantity_available: ticket.quantity_available,
          purchase_deadline: ticket.purchase_deadline?.toISOString(),
        }));
        
        const { error } = await supabase.from('tickets').insert(ticketsToInsert);
        if (error) throw error;
      }
      
      // Generate invite link and move to success step
      setInviteLink(`${window.location.origin}/rsvp?event_id=${eventId}`);
      // setStep(6); // This line is removed as per the edit hint
    } catch (error) {
      console.error('Error saving tickets:', error);
      setError('Failed to save tickets');
    }
  };

  if (!session) {
    return <div>Loading...</div>; // Or a spinner component
  }

  return (
    <div>
      <Header />
      <div className="grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center gap-16 p-8 pb-20 font-[family-name:var(--font-geist-sans)] sm:p-20">
        <main className="row-start-2 flex flex-col items-center gap-[32px] sm:items-start w-full max-w-2xl">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <h1
            className="text-4xl font-bold"
            style={{
              color: 'var(--foreground)',
            }}
          >
            {eventId ? 'Edit Your Event' : 'Create Your Event'}
          </h1>
          <form
            onSubmit={handleSubmit}
            className="block space-y-4 text-sm font-medium"
          >
            <div>
              <label
                htmlFor="eventName"
                className="block text-sm font-medium"
                style={{
                  color: 'var(--foreground)',
                }}
              >
                Event Name
              </label>
              <input
                type="text"
                id="eventName"
                value={eventName}
                onChange={e => setEventName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="eventTheme"
                className="block text-sm font-medium"
                style={{
                  color: 'var(--foreground)',
                }}
              >
                Event Theme
              </label>
              <input
                type="text"
                id="eventTheme"
                value={eventTheme}
                onChange={e => setEventTheme(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="start-date-picker" className="px-1">
                  Start Date and Time
                </Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="start-date-picker"
                        className="w-40 justify-between font-normal"
                      >
                        {startDate
                          ? startDate.toLocaleDateString()
                          : 'Select date'}
                        <ChevronDownIcon />
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
                    className="w-32 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="end-date-picker" className="px-1">
                  End Date and Time
                </Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="end-date-picker"
                        className="w-40 justify-between font-normal"
                      >
                        {endDate
                          ? endDate.toLocaleDateString()
                          : 'Select date'}
                        <ChevronDownIcon />
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
                    className="bg-background w-32 appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                  />
                </div>
              </div>
            </div>
            <div>
              <label
                htmlFor="timeZone"
                className="block text-sm font-medium"
                style={{
                  color: 'var(--foreground)',
                }}
              >
                Time Zone
              </label>
              <select
                id="timeZone"
                value={timeZone}
                onChange={e => setTimeZone(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
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
                htmlFor="additionalInfo"
                className="block text-sm font-medium"
                style={{
                  color: 'var(--foreground)',
                }}
              >
                What other information do you want to ask your guests?
              </label>
              <textarea
                id="additionalInfo"
                value={additionalInfo}
                onChange={e => setAdditionalInfo(e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
              />
            </div>
            
            {/* Ticket Management Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                Event Tickets
              </h3>
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Manage up to 5 different ticket types for your event. Each ticket type can have its own price, quantity, and purchase deadline.
                </p>
                
                {tickets.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500 mb-4">No tickets created yet</p>
                    <Button
                      onClick={addTicket}
                      className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
                    >
                      Create Your First Ticket
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tickets.map((ticket, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border rounded-lg bg-white"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold">{ticket.name || 'Untitled Ticket'}</h3>
                          <p className="text-sm text-gray-600">
                            ${ticket.price} • {ticket.quantity_available} available
                            {ticket.purchase_deadline && (
                              <span> • Until {ticket.purchase_deadline.toLocaleDateString()}</span>
                            )}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setSelectedTicketIndex(index);
                              setShowTicketSidebar(true);
                            }}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => removeTicket(index)}
                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {tickets.length < 5 && (
                      <Button
                        onClick={addTicket}
                        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600"
                      >
                        + Add Another Ticket Type
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button
                onClick={() => router.push('/event')}
                className="inline-flex justify-center rounded-md border border-transparent bg-gray-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
              >
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button
                  onClick={saveTickets}
                  className="inline-flex justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
                >
                  Save Tickets
                </Button>
                <Button
                  type="submit"
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
                >
                  {eventId ? 'Update Event' : 'Create Event'}
                </Button>
              </div>
            </div>
          </form>
          
          {/* Success Section - Show invite link after event creation */}
          {inviteLink && (
            <div className="mt-8 p-6 border border-green-200 rounded-lg bg-green-50">
              <h3 className="text-lg font-semibold text-green-800 mb-4">
                Event {eventId ? 'Updated' : 'Created'} Successfully!
              </h3>
              <p className="text-green-700 mb-4">
                Share this link with your guests:
              </p>
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="block w-full rounded-md border border-green-300 bg-white px-3 py-2 text-black shadow-sm focus:border-green-500 focus:ring-green-500 focus:outline-none sm:text-sm"
              />
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => navigator.clipboard.writeText(inviteLink)}
                  className="inline-flex justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
                >
                  Copy Invite Link
                </Button>
                <Button
                  onClick={() => router.push('/event')}
                  className="inline-flex justify-center rounded-md border border-transparent bg-gray-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
                >
                  Go to My Events
                </Button>
              </div>
            </div>
          )}
          
          {/* Ticket Sidebar for Edit Form */}
          {showTicketSidebar && selectedTicketIndex !== null && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-semibold mb-4">
                  {tickets[selectedTicketIndex].id ? 'Edit' : 'Create'} Ticket
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Ticket Name</label>
                    <input
                      type="text"
                      value={tickets[selectedTicketIndex].name}
                      onChange={(e) => updateTicket(selectedTicketIndex, { name: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      placeholder="e.g., Early Bird, VIP, General"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Price ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={tickets[selectedTicketIndex].price}
                      onChange={(e) => updateTicket(selectedTicketIndex, { price: parseFloat(e.target.value) || 0 })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Quantity Available</label>
                    <input
                      type="number"
                      min="1"
                      value={tickets[selectedTicketIndex].quantity_available}
                      onChange={(e) => updateTicket(selectedTicketIndex, { quantity_available: parseInt(e.target.value) || 1 })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Purchase Deadline (Optional)</label>
                    <input
                      type="datetime-local"
                      value={tickets[selectedTicketIndex].purchase_deadline?.toISOString().slice(0, 16) || ''}
                      onChange={(e) => updateTicket(selectedTicketIndex, { 
                        purchase_deadline: e.target.value ? new Date(e.target.value) : null 
                      })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 mt-6">
                  <Button
                    onClick={() => setShowTicketSidebar(false)}
                    className="flex-1 px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => setShowTicketSidebar(false)}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
