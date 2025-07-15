"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';
import Header from '@/components/header';

export default function MyRsvps() {
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  useEffect(() => {
    const fetchRsvps = async () => {
      setLoading(true);
      setError(null);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError('You must be signed in to view your RSVPs.');
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('rsvps')
        .select('*, event_id(name, start_date, end_date)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        setRsvps(data || []);
        setLoading(false);
      }
    };
    fetchRsvps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Format: YYYY-MM-DD HH:mm
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <div>
      <Header />
      <div className="flex flex-col items-center justify-center min-h-screen py-8">
        <h1 className="text-4xl font-bold mb-8">My RSVPs</h1>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : rsvps.length === 0 ? (
          <div>You have not RSVP'd to any events yet.</div>
        ) : (
          <div className="w-full max-w-2xl">
            <table className="min-w-full border rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Event Name</th>
                  <th className="px-4 py-2 text-left">Event Date & Time</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Submitted At</th>
                  <th className="px-4 py-2 text-left">Approved by admin</th>
                </tr>
              </thead>
              <tbody>
                {rsvps.map((rsvp) => (
                  <tr key={rsvp.id} className="border-t">
                    <td className="px-4 py-2">{rsvp.event_id?.name || 'Event'}</td>
                    <td className="px-4 py-2">
                      {rsvp.event_id?.start_date && rsvp.event_id?.end_date
                        ? `${formatDate(rsvp.event_id.start_date)} - ${formatDate(rsvp.event_id.end_date)}`
                        : '-'}
                    </td>
                    <td className="px-4 py-2">{rsvp.status}</td>
                    <td className="px-4 py-2">{formatDate(rsvp.created_at)}</td>
                    <td className="px-4 py-2 text-center">
                      {rsvp.is_approved ? (
                        <span title="Approved" className="text-green-600 text-xl">✔️</span>
                      ) : (
                        <span title="Not approved" className="text-red-600 text-xl">✖️</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 