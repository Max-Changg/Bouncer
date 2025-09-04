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

  console.log('Auth callback - code:', !!code);
  console.log('Auth callback - next parameter:', next);
  console.log('Auth callback - error:', error);
  console.log('Auth callback - all cookies:', request.cookies.getAll().map(c => c.name));

  if (error) {
    console.error('OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(`${error}: ${errorDescription || 'Unknown error'}`)}`
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
      console.log('Auth callback - attempting code exchange...');
      
      // First try the standard PKCE flow
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('Code exchange error details:', {
          message: exchangeError.message,
          status: exchangeError.status,
          name: exchangeError.name
        });
        
        // If PKCE fails, try alternative approaches
        if (exchangeError.message?.includes('code verifier')) {
          console.log('PKCE error detected, trying session refresh...');
          
          // Try to get the session directly
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionData?.session) {
            console.log('Session found via getSession, redirecting...');
            return response;
          }
          
          console.error('Session error:', sessionError);
        }
        
        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent(`Exchange failed: ${exchangeError.message}`)}`
        );
      }

      if (data?.session) {
        console.log('Auth callback - successful exchange, user:', data.user?.email);
        console.log('Auth callback - session expires at:', data.session.expires_at);
        console.log('Auth callback - redirecting to:', `${origin}${next}`);
        return response;
      } else {
        console.error('Code exchange succeeded but no session returned');
        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent('Authentication succeeded but no session created')}`
        );
      }
    } catch (err) {
      console.error('Unexpected error during code exchange:', err);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('Unexpected authentication error')}`
      );
    }
  }

  // No code or error - redirect back to login with error
  console.error('Auth callback - no code received');
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent('No authorization code received')}`
  );
}
