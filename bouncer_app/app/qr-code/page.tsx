'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import QRCode from 'react-qr-code';
import type { Database } from '@/lib/database.types';
import Header from '@/components/header';

export default function QRCodePage() {
  const [session, setSession] = useState<User | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createBrowserClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const fetchQRCodeData = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('qr_code_data')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // Ignore no rows found error
      console.error('Error fetching profile:', profileError);
      setError(profileError.message);
    } else if (profileData && profileData.qr_code_data) {
      setQrCodeData(profileData.qr_code_data);
    } else {
      const newQrCodeData = userId;
      setQrCodeData(newQrCodeData);
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({ id: userId, qr_code_data: newQrCodeData }, { onConflict: 'id' });

      if (upsertError) {
        console.error('Error upserting QR code data:', upsertError);
        setError(upsertError.message);
      }
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
      fetchQRCodeData(session.id);
    }
  }, [session, fetchQRCodeData]);

  if (loading) {
    return <div>Loading QR Code...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!session) {
    return null; // Redirecting...
  }

  return (
    <div>
      <Header />
      <div className="flex flex-col items-center justify-center min-h-screen py-2">
        <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
          <h1 className="text-6xl font-bold">Your QR Code</h1>
          {qrCodeData ? (
            <div className="mt-8">
              <QRCode value={qrCodeData} size={256} level="H" title="Event QR Code" />
              <p className="mt-4 text-lg">Scan this code at the event entrance.</p>
            </div>
          ) : (
            <p className="mt-8 text-lg">No QR code available.</p>
          )}
        </main>
      </div>
    </div>
  );
}