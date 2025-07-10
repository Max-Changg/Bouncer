"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import Scanner from "@/components/scanner";

export default function ScanPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [scanResult, setScanResult] = useState<string | null>(null);
  const [guests, setGuests] = useState<string[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<
    "Verified" | "Not Found" | null
  >(null);
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchGuests = async () => {
      if (!eventId) return;
      const { data: rsvps, error } = await supabase
        .from("rsvps")
        .select("user_id")
        .eq("event_id", eventId);

      if (error) {
        console.error("Error fetching guests:", error);
      } else {
        setGuests(rsvps.map((rsvp) => rsvp.user_id));
      }
    };

    fetchGuests();
  }, [eventId, supabase]);

  useEffect(() => {
    if (scanResult) {
      if (guests.includes(scanResult)) {
        setVerificationStatus("Verified");
      } else {
        setVerificationStatus("Not Found");
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
    <div className="container mx-auto py-10 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-4">Scan Attendee QR Code</h1>
      
      <div className="w-full max-w-md mt-4">
        {!verificationStatus && (
            <Scanner
                onScan={handleScanSuccess}
                onError={handleScanFailure}
            />
        )}
      </div>

      {verificationStatus && (
        <div className="mt-8 text-center">
            <div
            className={`text-4xl font-bold p-4 rounded-lg ${
                verificationStatus === "Verified"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
            >
            {verificationStatus}
            </div>
        </div>
      )}
    </div>
  );
}
