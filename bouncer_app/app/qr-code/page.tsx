"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Session } from "@supabase/supabase-js";
import QRCode from "react-qr-code";

import type { Database } from "@/lib/database.types";

export default function QRCodePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const getSessionAndQRCode = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (!session) {
        router.push("/login");
        return;
      }

      // Fetch user's QR code data from profiles table
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("qr_code_data")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        setError(profileError.message);
      } else if (profile && profile.qr_code_data) {
        setQrCodeData(profile.qr_code_data);
      } else {
        // If no profile or QR code data exists, generate one and save it
        const newQrCodeData = session.user.id; // Using user ID as QR code data for simplicity
        const { error: upsertError } = await supabase
          .from("profiles")
          .upsert({ id: session.user.id, qr_code_data: newQrCodeData });

        if (upsertError) {
          console.error("Error upserting QR code data:", upsertError);
          setError(upsertError.message);
        } else {
          setQrCodeData(newQrCodeData);
        }
      }
      setLoading(false);
    };

    getSessionAndQRCode();
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