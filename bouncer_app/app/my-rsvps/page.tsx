"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { CalendarIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

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
        setError("You must be signed in to view your RSVPs.");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("rsvps")
        .select("*, event_id(name, start_date, end_date)")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
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
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden flex flex-col">
      {/* Neon orbs background (unique, no light beams) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-purple-700/30 blur-3xl mix-blend-screen"></div>
        <div className="absolute top-32 -right-24 w-[380px] h-[380px] rounded-full bg-indigo-600/25 blur-3xl mix-blend-screen"></div>
        <div className="absolute bottom-[-80px] left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full bg-pink-600/20 blur-3xl mix-blend-screen"></div>
        {/* dotted grid overlay */}
        <div className="absolute inset-0 opacity-[0.12]"
             style={{
               backgroundImage:
                 "radial-gradient(currentColor 1px, transparent 1px)",
               color: "#ffffff",
               backgroundSize: "22px 22px",
               backgroundPosition: "0 0, 11px 11px",
             }}></div>
      </div>

      {/* Header on top */}
      <div className="relative z-20">
        <Header />
      </div>

      {/* Main content area that grows to push footer down */}
      <div className="flex-1">
        {/* Hero section */}
        <div className="relative z-10 px-6 py-12 sm:px-8 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              My RSVPs
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl">
              Track the parties you&apos;re in for. Confirmed, pending, and everything in between.
            </p>
          </div>
        </div>

        {/* Content card */}
        <div className="relative max-w-7xl mx-auto px-6 pb-16 sm:px-8 lg:px-12">
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-3xl border border-gray-700/50 shadow-xl shadow-black/50 p-6 sm:p-8">
          {loading ? (
            <div className="text-gray-300">Loading...</div>
          ) : error ? (
            <div className="text-red-400">{error}</div>
          ) : rsvps.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-purple-800/30 flex items-center justify-center">
                <CalendarIcon className="w-10 h-10 text-purple-300" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">No RSVPs Yet</h3>
              <p className="text-gray-400 max-w-md mx-auto">
                When you RSVP to events, they&apos;ll appear here with their status.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-gray-700/60 text-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Event Name</th>
                    <th className="px-4 py-3 font-semibold">Event Date &amp; Time</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Submitted At</th>
                    <th className="px-4 py-3 font-semibold text-center">Approved by admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/60">
                  {rsvps.map((rsvp) => (
                    <tr key={rsvp.id} className="hover:bg-gray-700/30">
                      <td className="px-4 py-3 text-gray-100">{rsvp.event_id?.name || "Event"}</td>
                      <td className="px-4 py-3 text-gray-300">
                        {rsvp.event_id?.start_date && rsvp.event_id?.end_date
                          ? `${formatDate(rsvp.event_id.start_date)} - ${formatDate(rsvp.event_id.end_date)}`
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2 rounded-full bg-gray-700/70 px-3 py-1 text-sm text-gray-200 border border-gray-600">
                          {rsvp.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{formatDate(rsvp.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          {rsvp.is_approved ? (
                            <CheckCircleIcon className="w-6 h-6 text-green-400" title="Approved" />
                          ) : (
                            <XCircleIcon className="w-6 h-6 text-red-400" title="Not approved" />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}