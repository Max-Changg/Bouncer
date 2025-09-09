import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const next = searchParams.get('next') || '/event';
    
    console.log('Direct Google auth - next parameter:', next);
    
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
    
    // Initiate Google OAuth directly
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/callback?next=${encodeURIComponent(next)}`,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      console.error('Direct Google OAuth error:', error);
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
    console.error('Unexpected error in direct Google auth:', err);
    return NextResponse.json(
      { error: 'Unexpected authentication error' },
      { status: 500 }
    );
  }
}
