import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const next = searchParams.get('next') || '/event';
    
    // Direct Google auth - next parameter
    
    // Create Supabase server client for OAuth
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    
    // Get the origin from the request to determine if we're local or production
    const { origin } = new URL(request.url);
    
    // Initiate Google OAuth directly
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      // Direct Google OAuth error
      // Return error response instead of redirect to non-existent login page
      return NextResponse.json(
        { error: 'Authentication failed', details: error.message },
        { status: 500 }
      );
    }

    if (data.url) {
      // Redirect to Google OAuth
      return NextResponse.redirect(data.url);
    }

    // Fallback if no URL is returned
    return NextResponse.json(
      { error: 'OAuth initialization failed' },
      { status: 500 }
    );

  } catch (err) {
    // Unexpected error in direct Google auth
    return NextResponse.json(
      { error: 'Unexpected authentication error' },
      { status: 500 }
    );
  }
}
