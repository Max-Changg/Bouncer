import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server-client';
import { createAdminClient } from '@/lib/supabase-admin-client';
import { encryptToken } from '@/lib/token-crypto';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This contains the userId
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/event?error=gmail_auth_denied`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/event?error=invalid_callback`);
    }

    // Parse state data (eventId is only used for the redirect; the user is
    // taken from the session, never from state)
    let eventId;
    try {
      const stateData = JSON.parse(state);
      eventId = stateData.eventId;
    } catch {
      // Old format where state was just userId — no eventId to extract
    }

    // Identify the user from their session, not from client-supplied state
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/event?error=not_signed_in`);
    }

    // Validate that we have the Google OAuth credentials
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('Google OAuth credentials are not configured');
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/event?error=config_error`);
    }

    // Set up OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/gmail/callback`
    );

    // Exchange the authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info to store their email
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // The connect flow uses access_type=offline + prompt=consent, so Google
    // always returns a refresh token here
    if (!tokens.refresh_token || !userInfo.data.email) {
      console.error('Gmail callback missing refresh token or email');
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/event?error=missing_refresh_token`);
    }

    // Store the encrypted refresh token in the service-role-only
    // gmail_credentials table. Access tokens are short-lived and fetched on
    // demand from the refresh token, so they are not stored at all.
    const admin = createAdminClient();
    const { error: upsertError } = await admin
      .from('gmail_credentials')
      .upsert({
        user_id: user.id,
        gmail_email: userInfo.data.email,
        refresh_token_enc: encryptToken(tokens.refresh_token),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) {
      console.error('Error storing Gmail credentials:', upsertError);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/event?error=storage_error&details=${encodeURIComponent(upsertError.message)}`);
    }

    // Redirect back to the specific event page or event list
    let redirectUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/event?gmail_connected=true`;
    
    // If we have eventId from state, redirect to that specific event
    if (eventId) {
      redirectUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/event/${eventId}?gmail_connected=true`;
    }
    
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Error in Gmail callback route:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/event?error=callback_error`);
  }
}
