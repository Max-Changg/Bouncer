import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This contains the userId
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'https://bouncer-app.dev'}/event?error=gmail_auth_denied`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'https://bouncer-app.dev'}/event?error=invalid_callback`);
    }

    const userId = state;

    // Validate that we have the Google OAuth credentials
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('Google OAuth credentials are not configured');
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'https://bouncer-app.dev'}/event?error=config_error`);
    }

    // Set up OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL || 'https://bouncer-app.dev'}/api/auth/gmail/callback`
    );

    // Exchange the authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info to store their email
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // Store the tokens in Supabase using existing profiles table
    const supabase = createClient();
    
    // Update the existing profiles table with Gmail tokens
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        gmail_access_token: tokens.access_token,
        gmail_refresh_token: tokens.refresh_token,
        gmail_email: userInfo.data.email,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (upsertError) {
      console.error('Error storing Gmail tokens:', upsertError);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'https://bouncer-app.dev'}/event?error=storage_error`);
    }

    // Redirect back to the event page with success
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'https://bouncer-app.dev'}/event?gmail_connected=true`);

  } catch (error) {
    console.error('Error in Gmail callback route:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'https://bouncer-app.dev'}/event?error=callback_error`);
  }
}
