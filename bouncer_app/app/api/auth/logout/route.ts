import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
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

    // Sign out the user
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to logout' },
        { status: 500 }
      );
    }

    // Clear all auth-related cookies
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    // Clear Supabase cookies
    response.cookies.set('sb-access-token', '', { 
      expires: new Date(0),
      path: '/',
      domain: '.bouncer-app.dev'
    });
    response.cookies.set('sb-refresh-token', '', { 
      expires: new Date(0),
      path: '/',
      domain: '.bouncer-app.dev'
    });

    return response;

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://bouncer-app.dev, https://bouncer-silk.vercel.app',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type',
    },
  });
}
