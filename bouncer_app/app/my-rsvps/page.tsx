"use client";

export const dynamic = 'force-dynamic'

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

  const isGoing = (status: string | null | undefined) =>
    typeof status === "string" && /going|yes|approved|confirmed/i.test(status);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />

      {/* Main content area that grows to push footer down */}
      <main className="flex-1">
        <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Page header */}
          <div className="font-mono text-[11px] tracking-[0.2em] text-primary uppercase">
            My RSVPs
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            The parties you&apos;re in for.
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Confirmed, pending, and everything in between.
          </p>

          {/* Content */}
          <div className="mt-10">
            {loading ? (
              <div className="rounded-xl border border-border bg-white px-6 py-16 text-center shadow-sm">
                <div className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                  Loading&hellip;
                </div>
              </div>
            ) : error ? (
              <div className="rounded-xl border border-border bg-white px-6 py-16 text-center shadow-sm">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            ) : rsvps.length === 0 ? (
              <div className="rounded-xl border border-border bg-white px-6 py-16 text-center shadow-sm">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <CalendarIcon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight">No RSVPs Yet</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  When you RSVP to events, they&apos;ll appear here with their status.
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {rsvps.map((rsvp) => (
                  <li
                    key={rsvp.id}
                    className="rounded-xl border border-border bg-white p-5 shadow-sm transition-colors hover:border-primary/40 sm:p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold tracking-tight sm:text-lg">
                          {rsvp.event_id?.name || "Event"}
                        </h2>
                        <div className="mt-1 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                          {rsvp.event_id?.start_date && rsvp.event_id?.end_date
                            ? `${formatDate(rsvp.event_id.start_date)} – ${formatDate(rsvp.event_id.end_date)}`
                            : "-"}
                        </div>
                      </div>
                      <span
                        className={`rounded-md px-2 py-1 font-mono text-[10px] tracking-wide uppercase ${
                          isGoing(rsvp.status)
                            ? "bg-[#e4f5ec] text-[#067a53]"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {rsvp.status}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border pt-4">
                      <div className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                        Submitted {formatDate(rsvp.created_at)}
                      </div>
                      {rsvp.is_approved ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-[#e4f5ec] px-2 py-1 font-mono text-[10px] tracking-wide text-[#067a53] uppercase">
                          <CheckCircleIcon className="h-3.5 w-3.5" title="Approved" />
                          Approved by admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
                          <XCircleIcon className="h-3.5 w-3.5" title="Not approved" />
                          Not approved
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
