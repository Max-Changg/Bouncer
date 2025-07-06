
'use client';

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import type { Database } from "@/lib/database.types";
import type { Session } from "@supabase/supabase-js";

export default function Header({ session }: { session: Session | null }) {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <div>
        <header className="flex items-center justify-between p-4 bg-gray-800 text-white">
            <h1 className="text-xl font-bold">Bouncer</h1>
            <nav>
            <ul className="flex space-x-4">
                <li><a href="/" className="hover:underline">Home</a></li>
                <li><a href="/about" className="hover:underline">About</a></li>
                <li><a href="/contact" className="hover:underline">Contact</a></li>
                {session && <li><a href="/event" className="hover:underline">My Events</a></li>}
                {session && <li><a href="/qr-code" className="hover:underline">My QR Code</a></li>}
                {session && <li><button onClick={handleSignOut} className="hover:underline">Sign Out</button></li>}
            </ul>
            </nav>
        </header>

    </div>
    );
}