'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Session } from '@supabase/supabase-js';
import { format, toZonedTime } from 'date-fns-tz';
import { ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function CreateEvent() {
  const [step, setStep] = useState(1);
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
  const supabase = createClientComponentClient();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (!session) {
        router.push('/login');
      }
    };

    getSession();
  }, [supabase.auth, router]);

  const nextStep = () => {
    setError('');
    setStep(step + 1);
  }
  const prevStep = () => {
    setError('');
    setStep(step - 1);
  }

  const handleNext = (validation: () => boolean) => {
    if (validation()) {
      nextStep();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!additionalInfo.trim()) {
      setError('Additional information is required.');
      return;
    }
    setError('');

    if (!session) {
      setError('You must be logged in to create an event. Redirecting to login...');
      setTimeout(() => router.push('/login'), 3000);
      return;
    }

    const formatInTimeZone = (date: Date, fmt: string, tz: string) => {
      return format(toZonedTime(date, tz), fmt, { timeZone: tz });
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

    const { data, error } = await supabase
      .from('Events')
      .insert([
        {
          name: eventName,
          theme: eventTheme,
          start_date: startDateTime ? formatInTimeZone(startDateTime, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timeZone) : null,
          end_date: endDateTime ? formatInTimeZone(endDateTime, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timeZone) : null,
          additional_info: additionalInfo,
          user_id: session.user.id,
          time_zone: timeZone
        },
      ])
      .select();

    if (error) {
      console.error('Error creating event:', error);
      setError(`Error: ${error.message}. Please check the database permissions.`);
    } else {
      console.log('Event created successfully:', data);
      if (data && data.length > 0) {
        const eventId = data[0].id;
        setInviteLink(`${window.location.origin}/rsvp?event_id=${eventId}`);
        setStep(5); // Move to the next step to display the invite link
      } else {
        setError('Event created but no data returned.');
      }
    }
  };

  if (!session) {
    return <div>Loading...</div>; // Or a spinner component
  }

  return (
    <div>
      <Header session={session} />
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {step === 1 && (
            <div>
              <h1 className="text-4xl font-bold" style={{color: 'var(--foreground)'}}>What is your event called?</h1>
              <form onSubmit={(e) => { e.preventDefault(); handleNext(() => { if (!eventName.trim()) { setError('Event name is required.'); return false; } return true; }); }} className="space-y-4 block text-sm font-medium">
                <div>
                  <label htmlFor="eventName" className="block text-sm font-medium" style={{color: 'var(--foreground)'}}>
                    Event Name
                  </label>
                  <input
                    type="text"
                    id="eventName"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Next
                </button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div>
              <h1 className="text-4xl font-bold" style={{color: 'var(--foreground)'}}>What is the theme of your event?</h1>
              <form onSubmit={(e) => { e.preventDefault(); handleNext(() => { if (!eventTheme.trim()) { setError('Event theme is required.'); return false; } return true; }); }} className="space-y-4 block text-sm font-medium">
                <div>
                  <label htmlFor="eventTheme" className="block text-sm font-medium" style={{color: 'var(--foreground)'}}>
                    Event Theme
                  </label>
                  <input
                    type="text"
                    id="eventTheme"
                    value={eventTheme}
                    onChange={(e) => setEventTheme(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                  />
                </div>
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Next
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 3 && (
            <div>
              <h1 className="text-4xl font-bold" style={{color: 'var(--foreground)'}}>When is your event?</h1>
              <form onSubmit={(e) => { e.preventDefault(); handleNext(() => { if (!startDate || !endDate) { setError('Start and end dates are required.'); return false; } return true; }); }} className="space-y-4 block text-sm font-medium">
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
                            {startDate ? startDate.toLocaleDateString() : "Select date"}
                            <ChevronDownIcon />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                                     <Calendar
                             mode="single"
                             selected={startDate || undefined}
                             onSelect={(date) => setStartDate(date || null)}
                           />
                        </PopoverContent>
                      </Popover>
                      <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        step="60"
                        className="w-a bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
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
                            {endDate ? endDate.toLocaleDateString() : "Select date"}
                            <ChevronDownIcon />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                                     <Calendar
                             mode="single"
                             selected={endDate || undefined}
                             onSelect={(date) => setEndDate(date || null)}
                           />
                        </PopoverContent>
                      </Popover>
                      <Input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        step="60"
                        className="w-32 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor="timeZone" className="block text-sm font-medium" style={{color: 'var(--foreground)'}}>
                    Time Zone
                  </label>
                  <select
                    id="timeZone"
                    value={timeZone}
                    onChange={(e) => setTimeZone(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                  >
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="Europe/London">Greenwich Mean Time</option>
                  </select>
                </div>
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Next
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 4 && (
            <div>
              <h1 className="text-4xl font-bold" style={{color: 'var(--foreground)'}}>Additional Information</h1>
              <form onSubmit={handleSubmit} className="space-y-4 block text-sm font-medium">
                <div>
                  <label htmlFor="additionalInfo" className="block text-sm font-medium" style={{color: 'var(--foreground)'}}>
                    What other information do you want to ask your guests?
                  </label>
                  <textarea
                    id="additionalInfo"
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    rows={4}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                  />
                </div>
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Create Event
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 5 && (
            <div>
              <h1 className="text-4xl font-bold" style={{color: 'var(--foreground)'}}>Event Created!</h1>
              <p className="mt-4 text-lg" style={{color: 'var(--foreground)'}}>Share this link with your guests:</p>
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="mt-2 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
              />
              <button
                onClick={() => navigator.clipboard.writeText(inviteLink)}
                className="mt-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Copy Invite Link
              </button>
              <button
                onClick={() => router.push('/event')}
                className="mt-4 ml-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Go to My Events
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}