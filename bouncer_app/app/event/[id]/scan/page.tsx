'use client';

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';
import Scanner from '@/components/scanner';
import Footer from '@/components/footer';

export default function ScanPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [scanResult, setScanResult] = useState<string | null>(null);
  const [guests, setGuests] = useState<string[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<
    'Verified' | 'Not Found' | null
  >(null);
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchGuests = async () => {
      if (!eventId) return;
      const { data: rsvps, error } = await supabase
        .from('rsvps')
        .select('user_id')
        .eq('event_id', eventId);

      if (error) {
        console.error('Error fetching guests:', error);
      } else {
        setGuests(rsvps.map(rsvp => rsvp.user_id));
      }
    };

    fetchGuests();
  }, [eventId, supabase]);

  useEffect(() => {
    if (scanResult) {
      if (guests.includes(scanResult)) {
        setVerificationStatus('Verified');
      } else {
        setVerificationStatus('Not Found');
      }

      const timer = setTimeout(() => {
        setScanResult(null);
        setVerificationStatus(null);
      }, 3000); // 3-second delay

      return () => clearTimeout(timer);
    }
  }, [scanResult, guests]);

  const handleScanSuccess = (decodedText: string) => {
    if (!verificationStatus) {
      setScanResult(decodedText);
    }
  };

  const handleScanFailure = (error: any) => {
    if (typeof error === 'string' && error.includes('No QR code found')) {
      return;
    }
    console.warn(`QR code scan error:`, error);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex flex-1 flex-col items-center px-6 py-12 sm:py-16">
        <div className="text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
            Door Scanner
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Scan Attendee QR Code
          </h1>
        </div>

        <div className="mt-8 w-full max-w-md rounded-2xl border border-border bg-white p-4 shadow-sm">
          {!verificationStatus && (
            <Scanner onScan={handleScanSuccess} onError={handleScanFailure} />
          )}

          {verificationStatus && (
            <div
              className={`rounded-xl px-4 py-8 text-center ${
                verificationStatus === 'Verified'
                  ? 'bg-[#e4f5ec]'
                  : 'bg-red-50'
              }`}
            >
              <div
                className={`text-3xl font-semibold tracking-tight ${
                  verificationStatus === 'Verified'
                    ? 'text-[#067a53]'
                    : 'text-red-600'
                }`}
              >
                {verificationStatus === 'Verified' ? '✓ ' : ''}
                {verificationStatus}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
