"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Session } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

export default function Rsvp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("Attending");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [eventId, setEventId] = useState<string | null>(null);
  const supabase = createClientComponentClient<Database>();
  const [session, setSession] = useState<Session | null>(null);





  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (!session) {
        router.push('/login'); // Redirect to login if not signed in
      } else if (session.user.email) {
        setEmail(session.user.email);
      }
    };
    getSession();

    const id = searchParams.get('event_id');
    if (id) {
      setEventId(id);
    }
  }, [supabase.auth, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!eventId) {
      console.error("Event ID not found in URL.");
      return;
    }

    if (!session) {
      console.error("User not authenticated.");
      router.push('/login');
      return;
    }

    const { data, error } = await supabase
      .from("rsvps")
      .insert([
        {
          name,
          email,
          status,
          event_id: Number(eventId),
          user_id: session.user.id, // Associate RSVP with the logged-in user
        },
      ])
      .select();

    if (error) {
      console.log(error);
    } else {
      router.push("/event");
    }
  };

  if (!session) {
    return <div>You need to be signed in to RSVP. Redirecting to login...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold">RSVP</h1>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Name"
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                readOnly={!!session} // Make read-only if session exists
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="status" className="sr-only">
                Status
              </label>
              <select
                id="status"
                name="status"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                onChange={(e) => setStatus(e.target.value)}
              >
                <option>Attending</option>
                <option>Maybe</option>
                <option>Not Attending</option>
              </select>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}