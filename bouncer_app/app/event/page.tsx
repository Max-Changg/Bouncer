'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/header';

export default function Event() {
  const router = useRouter();

  const handleShare = () => {
    // For now, we'll just log a message to the console.
    console.log('Sharing invite...');
    // In the future, this will generate a unique invite link and copy it to the clipboard.
  };

  return (
    <div>
      <Header />
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
          <h1 className="text-4xl font-bold">Event Details</h1>
          <div className="space-y-4">
            <p>Event details will be displayed here.</p>
            <button
              onClick={handleShare}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Share Invite
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
