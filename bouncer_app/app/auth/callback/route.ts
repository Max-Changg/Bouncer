export const dynamic = 'force-dynamic'

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/';

  // Auth callback processing

  if (error) {
    // OAuth error
    
    // Handle PKCE errors by redirecting back to direct Google auth
    if (error === 'access_denied' || errorDescription?.includes('code_challenge')) {
      // PKCE or access denied error, redirecting back to Google auth with next param
      return NextResponse.redirect(`${origin}/api/auth/direct-google?next=${encodeURIComponent(next)}`);
    }
    
    // For other errors, redirect to home page with error
    return NextResponse.redirect(
      `${origin}/?error=${encodeURIComponent(`Authentication failed: ${error}`)}`
    );
  }

  if (code) {
    // Create the response early to handle cookies properly
    const response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            request.cookies.set({
              name,
              value,
              ...options,
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: any) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            });
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    try {
      // Auth callback - attempting code exchange
      
      // First try the standard PKCE flow
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        // Code exchange error details
        
        // If PKCE fails, try alternative approaches
        if (exchangeError.message?.includes('code verifier')) {
          // PKCE error detected, trying session refresh
          
          // Try to get the session directly
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionData?.session) {
            // Session found via getSession, redirecting
            return response;
          }
          
          // Session error
        }
        
        return NextResponse.redirect(
          `${origin}/api/auth/direct-google?next=${encodeURIComponent(next)}`
        );
      }

      if (data?.session) {
        // Auth callback - successful exchange
        return response;
      } else {
        // Code exchange succeeded but no session returned
        return NextResponse.redirect(
          `${origin}/?error=${encodeURIComponent('Authentication succeeded but no session created')}`
        );
      }
    } catch (err) {
      // Unexpected error during code exchange
      return NextResponse.redirect(
        `${origin}/?error=${encodeURIComponent('Unexpected authentication error')}`
      );
    }
  }

  // No code or error - redirect back to Google auth
  // Auth callback - no code received
  return NextResponse.redirect(
    `${origin}/api/auth/direct-google?next=${encodeURIComponent(next)}`
  );
}
