import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const codeVerifier = searchParams.get('code_verifier');

  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/';

  if (error) {
    console.error('OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error)}`
    );
  }

  if (code) {
    let response = NextResponse.redirect(origin);

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

    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      return response;
    } else {
      console.error('Code exchange error:', exchangeError);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(`Exchange failed: ${exchangeError.message}`)}`
      );
    }
  }

  // No code or error - redirect back to login with error
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent('No authorization code received')}`
  );
}
