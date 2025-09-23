'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect to Vercel deployment after a short delay
    const timer = setTimeout(() => {
      window.location.href = 'https://bouncer-silk.vercel.app/';
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
      <div className="text-center max-w-md mx-4">
        {/* Spinner */}
        <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-6"></div>

        {/* Logo */}
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4">
          Bouncer
        </h1>

        {/* Message */}
        <p className="text-gray-300 text-lg mb-6">
          Redirecting you to our main site...
        </p>

        {/* Manual redirect button */}
        <a
          href="https://bouncer-silk.vercel.app/"
          className="inline-block bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 shadow-lg"
        >
          Go to Bouncer
        </a>

        {/* Additional info */}
        <p className="text-gray-500 text-sm mt-6">
          If you're not redirected automatically, click the button above
        </p>
      </div>
    </div>
  );
}
