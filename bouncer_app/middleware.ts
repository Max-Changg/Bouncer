import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Define protected and public routes
const protectedRoutes = [
  '/event$', // Only exact match for /event (not /event/[id])
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
          const newResponse = NextResponse.next({
            request,
          });
          newResponse.cookies.set({
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
          const newResponse = NextResponse.next({
            request,
          });
          newResponse.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If the user is not logged in and is trying to access a protected route, redirect to login
  if (!session && protectedRoutes.some(route => {
    if (route.endsWith('$')) {
      // For routes ending with $, do exact match (remove the $ first)
      const exactRoute = route.slice(0, -1);
      return pathname === exactRoute;
    } else {
      // For other routes, check if pathname starts with the route
      return pathname.startsWith(route);
    }
  })) {
    const loginUrl = new URL('/login', request.url);
    // Preserve the current URL as the next parameter for RSVP routes
    if (pathname.startsWith('/rsvp')) {
      loginUrl.searchParams.set('next', pathname + request.nextUrl.search);
      console.log('Middleware - redirecting to login with next:', pathname + request.nextUrl.search);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Only redirect away from /login if the session is valid and not expired
  if (session && pathname === '/login') {
    // Check if session is expired
    // Supabase session.expires_at is in seconds since epoch
    if (session.expires_at && session.expires_at * 1000 < Date.now()) {
      // Session is expired, allow access to /login
      return response;
    }
    // Session is valid
    const next = request.nextUrl.searchParams.get('next');
    console.log('Middleware - authenticated user on login page, next:', next);
    if (next) {
      console.log('Middleware - redirecting to next:', next);
      return NextResponse.redirect(new URL(next, request.url));
    } else {
      console.log('Middleware - redirecting to /event');
      return NextResponse.redirect(new URL('/event', request.url));
    }
  }

  // Allow access to /login if session is missing or expired
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
