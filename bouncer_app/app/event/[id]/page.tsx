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
  const [zelleData, setZelleData] = useState<Array<{name: string, amount: number}>>([]);
  const [venmoData, setVenmoData] = useState<Array<{name: string, amount: number}>>([]);
  const [processingPayments, setProcessingPayments] = useState(false);
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

  const parseZelleFile = async (file: File) => {
    const text = await file.text();
    const lines = text.split('\n');
    const zellePayments: Array<{name: string, amount: number}> = [];
    
    // Regex pattern from KASA system: "BofA: (name) sent you $amount"
    const pattern = /BofA: (.*?) sent you \$([0-9]+\.\d{2})(?: for.*)?/i;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      const match = pattern.exec(trimmedLine);
      if (match) {
        const name = match[1].trim().toLowerCase().replace(/\s+/g, ' ');
        const amount = parseFloat(match[2]);
        zellePayments.push({ name, amount });
      }
    }
    
    setZelleData(zellePayments);
    return zellePayments;
  };

  const parseVenmoFile = async (file: File) => {
    const text = await file.text();
    const lines = text.split('\n');
    const venmoPayments: Array<{name: string, amount: number}> = [];
    
    // Skip header rows (first 3 lines based on the CSV format)
    for (let i = 3; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const columns = line.split(',');
      if (columns.length >= 9) {
        const from = columns[6]?.trim().toLowerCase().replace(/\s+/g, ' ');
        const amountStr = columns[8]?.trim().replace(/[^\d.-]/g, '');
        const amount = parseFloat(amountStr);
        
        // Only include incoming payments (positive amounts)
        if (from && amount > 0 && !isNaN(amount)) {
          venmoPayments.push({ name: from, amount });
        }
      }
    }
    
    setVenmoData(venmoPayments);
    return venmoPayments;
  };

  const crossCheckPayments = async () => {
    if (!rsvps.length) return;
    
    setProcessingPayments(true);
    const updatedRsvps = [...rsvps];
    
    for (const rsvp of updatedRsvps) {
      const rsvpName = rsvp.name.toLowerCase().trim().replace(/\s+/g, ' ');
      let totalPaid = 0;
      let paymentMethod = '';
      
      // Check Zelle payments
      const zelleMatches = zelleData.filter(payment => 
        payment.name === rsvpName
      );
      if (zelleMatches.length > 0) {
        totalPaid += zelleMatches.reduce((sum, payment) => sum + payment.amount, 0);
        paymentMethod = 'zelle';
      }
      
      // Check Venmo payments
      const venmoMatches = venmoData.filter(payment => 
        payment.name === rsvpName
      );
      if (venmoMatches.length > 0) {
        totalPaid += venmoMatches.reduce((sum, payment) => sum + payment.amount, 0);
        paymentMethod = paymentMethod ? 'multiple' : 'venmo';
      }
      
      // Determine payment status
      let paymentStatus = 'unpaid';
      if (totalPaid > 0) {
        // For now, mark as paid if any payment is received
        // TODO: Add expected amount logic when ticketing is implemented
        paymentStatus = totalPaid > 0 ? 'paid' : 'unpaid';
      }
      
      // Update RSVP with payment info
      rsvp.payment_status = paymentStatus;
      rsvp.amount_paid = totalPaid;
      rsvp.payment_method = paymentMethod;
    }
    
    // Update database
    const { error } = await supabase
      .from('rsvps')
      .upsert(updatedRsvps, { onConflict: 'id' });
    
    if (error) {
      console.error('Error updating payment status:', error);
      setError('Failed to update payment status');
    } else {
      setRsvps(updatedRsvps);
      alert('Payment verification completed!');
    }
    
    setProcessingPayments(false);
  };

  const handleZelleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      await parseZelleFile(file);
      await crossCheckPayments();
    } catch (error) {
      console.error('Error processing Zelle file:', error);
      setError('Failed to process Zelle file');
    }
  };

  const handleVenmoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      await parseVenmoFile(file);
      await crossCheckPayments();
    } catch (error) {
      console.error('Error processing Venmo file:', error);
      setError('Failed to process Venmo file');
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

          {/* Admin-only payment upload UI */}
          {session && event && session.id === event.user_id && (
            <div className="w-full mb-8 p-4 border rounded bg-gray-50">
              <h3 className="text-lg font-semibold mb-2">Upload Payment Statements</h3>
              <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
                <div>
                  <label className="block mb-1 font-medium">Zelle Statement (.txt)</label>
                  <input
                    type="file"
                    accept=".txt"
                    onChange={e => handleZelleUpload(e)}
                    className="block w-full border rounded p-1"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Venmo Statement (.csv)</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={e => handleVenmoUpload(e)}
                    className="block w-full border rounded p-1"
                  />
                </div>
              </div>
              {/* Optionally show upload status or errors here */}
            </div>
          )}

          <h2 className="mt-8 text-2xl font-bold">RSVPs</h2>
          <DataTable columns={columns} data={rsvps} onSave={handleSave} />
        </main>
      </div>
    </div>
  );
}
