'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Session } from '@supabase/supabase-js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, toZonedTime } from 'date-fns-tz';

export default function CreateEvent() {
  const [step, setStep] = useState(1);
  const [eventName, setEventName] = useState('');
  const [eventTheme, setEventTheme] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [timeZone, setTimeZone] = useState('America/Los_Angeles');
  const [additionalInfo, setAdditionalInfo] = useState('');
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

    const { data, error } = await supabase
      .from('Events')
      .insert([
        {
          name: eventName,
          theme: eventTheme,
          start_date: startDate ? formatInTimeZone(startDate, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timeZone) : null,
          end_date: endDate ? formatInTimeZone(endDate, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timeZone) : null,
          additional_info: additionalInfo,
          user_id: session.user.id,
          time_zone: timeZone
        },
      ]);

    if (error) {
      console.error('Error creating event:', error);
      setError(`Error: ${error.message}. Please check the database permissions.`);
    } else {
      console.log('Event created successfully:', data);
      router.push('/event'); // Redirect to the event page
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
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium" style={{color: 'var(--foreground)'}}>
                      Start Date and Time
                    </label>
                    <DatePicker
                      selected={startDate}
                      onChange={(date) => setStartDate(date)}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={15}
                      dateFormat="MMMM d, yyyy h:mm aa"
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                    />
                  </div>
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium" style={{color: 'var(--foreground)'}}>
                      End Date and Time
                    </label>
                    <DatePicker
                      selected={endDate}
                      onChange={(date) => setEndDate(date)}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={15}
                      dateFormat="MMMM d, yyyy h:mm aa"
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                    />
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
        </main>
      </div>
    </div>
  );
}