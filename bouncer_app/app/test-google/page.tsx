'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useState } from 'react';
import type { Database } from '@/lib/database.types';
import { Button } from '@/components/ui/button';
import Footer from '@/components/footer';

export default function TestGoogle() {
  const [status, setStatus] = useState<string>('Ready');
  const [user, setUser] = useState<any>(null);

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return document.cookie
            .split('; ')
            .find(row => row.startsWith(`${name}=`))
            ?.split('=')[1];
        },
        set(name: string, value: string, options: any) {
          document.cookie = `${name}=${value}; path=/; max-age=${options.maxAge || 31536000}`;
        },
        remove(name: string, options: any) {
          document.cookie = `${name}=; path=/; max-age=0`;
        },
      },
    }
  );

  const signInWithGoogle = async () => {
    try {
      setStatus('Signing in...');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        setStatus(`Error: ${error.message}`);
      } else {
        setStatus('Redirecting to Google...');
        console.log('OAuth data:', data);
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
      setStatus(user ? `Logged in as: ${user.email}` : 'Not logged in');
    } catch (error) {
      setStatus(`Error checking user: ${error}`);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setStatus('Signed out');
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="mb-4 text-2xl font-bold">Google OAuth Test</h1>

      <div className="space-y-4">
        <div>
          <p>
            <strong>Status:</strong> {status}
          </p>
        </div>

        <div className="space-x-4">
          <Button onClick={signInWithGoogle}>Sign In with Google</Button>

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

        <div>
          <h3 className="font-bold">Instructions:</h3>
          <ol className="list-inside list-decimal space-y-1">
            <li>Click "Sign In with Google"</li>
            <li>You should be redirected to Google's OAuth page</li>
            <li>Choose your account or sign in</li>
            <li>You'll be redirected back to the callback</li>
            <li>Click "Check User" to see if you're logged in</li>
          </ol>
        </div>
      </div>
      <Footer />
    </div>
  );
}
