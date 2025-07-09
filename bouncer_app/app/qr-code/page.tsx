"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import type { Session, User } from "@supabase/supabase-js";
import QRCode from "react-qr-code";

import type { Database } from '@/lib/database.types';

export default function QRCodePage() {
  const [session, setSession] = useState<User | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createBrowserClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookieOptions: { name: 'sb-auth-token' } });

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setSession(session.user);
        // Call the function to fetch QR code data here
        fetchQRCodeData(session.user.id);
      } else {
        setSession(null); // Clear session on logout
        router.push('/login');
      }
    });

    // Initial session check
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setSession(user);
        fetchQRCodeData(user.id);
      } else {
        setSession(null); // Clear session on logout
        router.push('/login');
      }
    });

    const fetchQRCodeData = async (userId: string) => {
      // Fetch QR code data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('qr_code_data')
        .eq('id', userId) // Use userId here
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setError(profileError.message); // Set error state
      } else if (profileData && profileData.qr_code_data) {
        setQrCodeData(profileData.qr_code_data);
      } else {
        // If no QR code data exists, create one (e.g., using user ID)
        const newQrCodeData = userId; // Use userId here
        setQrCodeData(newQrCodeData);
        // Optionally, save this new QR code data to the profile
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({ id: userId, qr_code_data: newQrCodeData }); // Use userId here
        if (upsertError) {
          console.error('Error upserting QR code data:', upsertError);
          setError(upsertError.message); // Set error state
        }
      }
      setLoading(false); // Set loading to false after data fetching is complete
    };

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  if (loading) {
    return <div>Loading QR Code...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!session) {
    return null; // Should redirect to login
  }

  return (
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
  );
}