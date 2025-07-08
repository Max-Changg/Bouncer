import Image from "next/image";
import Header from "@/components/header";
import Link from "next/link";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from '@/lib/database.types';

export default async function Home() {
  const supabase = createServerComponentClient<Database>({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let events;
  if (session) {
    const { data, error } = await supabase
      .from("Events")
      .select("*")
      .eq("user_id", session.user.id);
    if (error) {
      console.error("Error fetching events:", error);
    } else {
      events = data;
    }
  }

  return (
    <div>
      <Header session={session} />

      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
          <h1 className="text-4xl font-bold">Bouncer</h1>
          <p className="text-lg">The easiest way to manage your events.</p>
          {session ? (
            <>
              <Link href="/create-event">
                <button className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Create Event
                </button>
              </Link>
              <div>
                <h2 className="text-2xl font-bold">Your Events</h2>
                <ul>
                  {events?.map((event) => (
                    <li key={event.id}>{event.name}</li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <Link href="/login">
              <button className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Login to Create Events
              </button>
            </Link>
          )}
        </main>
        <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
          <a
            className="flex items-center gap-2 hover:underline hover:underline-offset-4"
            href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              aria-hidden
              src="/file.svg"
              alt="File icon"
              width={16}
              height={16}
            />
            Learn
          </a>
          <a
            className="flex items-center gap-2 hover:underline hover:underline-offset-4"
            href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              aria-hidden
              src="/window.svg"
              alt="Window icon"
              width={16}
              height={16}
            />
            Examples
          </a>
          <a
            className="flex items-center gap-2 hover:underline hover:underline-offset-4"
            href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              aria-hidden
              src="/globe.svg"
              alt="Globe icon"
              width={16}
              height={16}
            />
            Go to nextjs.org →
          </a>
        </footer>
      </div>
    </div>
  );
}
