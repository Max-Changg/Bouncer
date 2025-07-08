'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';

export default function Form() {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, we'll just log a message to the console.
    console.log('Submitting form...');
    // In the future, this will submit the guest's information to the database.
  };

  return (
    <div>
      <Header session={null} />
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
          <h1 className="text-4xl font-bold">RSVP</h1>
          <form onSubmit={handleSubmit} className="space-y-4 block text-sm font-medium text-white-800">
            <p>The customizable form will be displayed here.</p>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Submit
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}
