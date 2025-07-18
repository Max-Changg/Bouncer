'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import { Button } from '@/components/ui/button';

export default function Form() {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, we'll just log a message to the console.
    console.log('Submitting form...');
    // In the future, this will submit the guest's information to the database.
  };

  return (
    <div className="min-h-screen bg-black text-gray-300">
      <Header session={null} />
      <div className="grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center gap-16 p-8 pb-20 font-[family-name:var(--font-geist-sans)] sm:p-20">
        <main className="row-start-2 flex flex-col items-center gap-[32px] sm:items-start">
          <h1 className="text-4xl font-bold">RSVP</h1>
          <form
            onSubmit={handleSubmit}
            className="block space-y-4 text-sm font-medium"
          >
            <p>The customizable form will be displayed here.</p>
            <Button type="submit">Submit</Button>
          </form>
        </main>
      </div>
    </div>
  );
}
