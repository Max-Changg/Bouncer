/**
 * Dynamic base URL utility that works across both domains
 * Automatically detects the current domain and returns the appropriate base URL
 */

export function getBaseUrl(): string {
  // Client-side: use current window location
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Server-side: use environment variable or fallback
  return process.env.NEXT_PUBLIC_BASE_URL || 'https://bouncer-app.dev';
}

/**
 * Get the NextAuth URL (same as base URL for this app)
 * This is useful for NextAuth configuration
 */
export function getNextAuthUrl(): string {
  return getBaseUrl();
}

/**
 * Get the full URL for a specific path
 * @param path - The path to append to the base URL
 * @returns Full URL with the current domain
 */
export function getFullUrl(path: string): string {
  const baseUrl = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Get the invite link for an event
 * @param eventId - The event ID
 * @returns Full invite link URL
 */
export function getInviteLink(eventId: string): string {
  return getFullUrl(`/rsvp?event_id=${eventId}`);
}

/**
 * Get the auth callback URL
 * @param next - Optional next parameter for redirect after auth
 * @returns Full auth callback URL
 */
export function getAuthCallbackUrl(next?: string): string {
  const baseUrl = getBaseUrl();
  const nextParam = next ? `?next=${encodeURIComponent(next)}` : '';
  return `${baseUrl}/auth/callback${nextParam}`;
}
