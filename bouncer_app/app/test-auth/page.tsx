'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useState } from 'react';
import type { Database } from '@/lib/database.types';
import { Button } from '@/components/ui/button';

export default function TestAuth() {
  const [status, setStatus] = useState<string>('Testing...');
  const [user, setUser] = useState<any>(null);

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const testConnection = async () => {
    try {
      setStatus('Testing connection...');

      // Test basic connection
      const { data, error } = await supabase
        .from('Events')
        .select('count')
        .limit(1);

      if (error) {
        setStatus(`Connection error: ${error.message}`);
      } else {
        setStatus('Connection successful!');
      }
    } catch (err) {
      setStatus(`Error: ${err}`);
    }
  };

  const checkUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setStatus(user ? 'User logged in!' : 'No user found');
    } catch (err) {
      setStatus(`Error checking user: ${err}`);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setStatus('Signed out');
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="mb-4 text-2xl font-bold">Supabase Auth Test</h1>

      <div className="space-y-4">
        <div>
          <p>
            <strong>Status:</strong> {status}
          </p>
          <p>
            <strong>Supabase URL:</strong>{' '}
            {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing'}
          </p>
          <p>
            <strong>Supabase Key:</strong>{' '}
            {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}
          </p>
        </div>

        <div className="space-x-4">
          <Button onClick={testConnection}>Test Connection</Button>

          <Button onClick={checkUser}>Check User</Button>

          {user && (
            <Button onClick={signOut} variant="destructive">
              Sign Out
            </Button>
          )}
        </div>

        {user && (
          <div className="rounded bg-gray-100 p-4">
            <h3 className="font-bold">Current User:</h3>
            <pre className="text-sm">{JSON.stringify(user, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
