'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useState, useEffect } from 'react';
import type { Database } from '@/lib/database.types';

export default function DebugAuth() {
  const [cookies, setCookies] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
            ?.split('=')[1]
        },
        set(name: string, value: string, options: any) {
          document.cookie = `${name}=${value}; path=/; max-age=${options.maxAge || 31536000}`
        },
        remove(name: string, options: any) {
          document.cookie = `${name}=; path=/; max-age=0`
        },
      },
    }
  );

  useEffect(() => {
    setCookies(document.cookie);
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCookies(document.cookie);
  };

  const refreshCookies = () => {
    setCookies(document.cookie);
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Debug</h1>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-bold">Environment Variables:</h3>
          <p>SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing'}</p>
          <p>SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}</p>
          <p>BASE_URL: {process.env.NEXT_PUBLIC_BASE_URL || 'Not set'}</p>
        </div>

        <div>
          <h3 className="font-bold">Current Cookies:</h3>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-w-full">
            {cookies || 'No cookies'}
          </pre>
          <button 
            onClick={refreshCookies}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Refresh Cookies
          </button>
        </div>

        <div>
          <h3 className="font-bold">User Status:</h3>
          {loading ? (
            <p>Loading...</p>
          ) : user ? (
            <div>
              <p>✅ Logged in as: {user.email}</p>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-w-full">
                {JSON.stringify(user, null, 2)}
              </pre>
              <button 
                onClick={signOut}
                className="mt-2 px-4 py-2 bg-red-500 text-white rounded"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <p>❌ Not logged in</p>
          )}
        </div>

        <div>
          <h3 className="font-bold">Auth Flow Test:</h3>
          <p>Go to <a href="/login" className="text-blue-500 underline">/login</a> to test Google OAuth</p>
        </div>
      </div>
    </div>
  );
} 