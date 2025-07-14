'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createBrowserClient } from '@supabase/ssr';
import { useSearchParams } from 'next/navigation';
import type { Database } from '@/lib/database.types';

export default function Login() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

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

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
        <h2 className="text-center text-2xl font-bold">Sign in to Bouncer</h2>

        {error && (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            <p className="font-medium">Authentication Error</p>
            <p className="text-sm">{decodeURIComponent(error)}</p>
          </div>
        )}

        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
          }}
          providers={['google']}
          queryParams={{
            prompt: 'select_account',
          }}
        />
      </div>
    </div>
  );
}
