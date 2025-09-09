import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Define protected and public routes
const protectedRoutes = [
  '/event$', // Only exact match for /event (not /event/[id])
  '/event/', // Match /event/[id] routes
  '/create-event',
  '/qr-code',
  '/test-auth',
  '/test-google',
  '/rsvp',
  '/my-rsvps',
];
const publicRoutes = ['/login', '/auth/callback', '/'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files and Next.js internals to bypass middleware
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/public') ||
    pathname === '/favicon.ico' ||
    pathname.match(/\.[a-zA-Z0-9]+$/) // allow all files with an extension (e.g., .jpg, .png, .css, .js)
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
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
        remove(name: string, options: CookieOptions) {
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

  // Try to refresh the session if it exists but might be expired
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  // If there's a session error (like invalid refresh token), clear the session
  if (sessionError) {
    console.log('Middleware - session error, clearing session:', sessionError.message);
    await supabase.auth.signOut();
  }

  console.log('Middleware - pathname:', pathname, 'session:', !!session);

  // Check if this is a protected route
  const isProtectedRoute = protectedRoutes.some(route => {
    if (route.endsWith('$')) {
      // For routes ending with $, do exact match (remove the $ first)
      const exactRoute = route.slice(0, -1);
      return pathname === exactRoute;
    } else {
      // For other routes, check if pathname starts with the route
      return pathname.startsWith(route);
    }
  });

  console.log('Middleware - isProtectedRoute:', isProtectedRoute);

  // If the user is not logged in and is trying to access a protected route, redirect to direct Google OAuth
  if (!session && isProtectedRoute) {
    const authUrl = new URL('/api/auth/direct-google', request.url);
    // Preserve the current URL as the next parameter
    authUrl.searchParams.set('next', pathname + request.nextUrl.search);
    console.log('Middleware - redirecting to direct Google auth with next:', pathname + request.nextUrl.search);
    return NextResponse.redirect(authUrl);
  }

  // If authenticated user somehow reaches /login, redirect to /event
  if (session && pathname === '/login') {
    console.log('Middleware - authenticated user on login page, redirecting to /event');
    return NextResponse.redirect(new URL('/event', request.url));
  }
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|auth).*)',
  ],
};
