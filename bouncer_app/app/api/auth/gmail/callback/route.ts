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
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/event?error=gmail_auth_denied`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/event?error=invalid_callback`);
    }

    // Parse state data
    let userId, eventId;
    try {
      const stateData = JSON.parse(state);
      userId = stateData.userId;
      eventId = stateData.eventId;
    } catch {
      // Fallback for old format where state was just userId
      userId = state;
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

    // Store the tokens in Supabase using existing profiles table
    const supabase = await createClient();
    
    // Update the existing profiles table with Gmail tokens
    console.log('Attempting to store tokens for user:', userId);
    console.log('User email from Google:', userInfo.data.email);
    console.log('Access token exists:', !!tokens.access_token);
    console.log('Refresh token exists:', !!tokens.refresh_token);
    
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        gmail_access_token: tokens.access_token,
        gmail_refresh_token: tokens.refresh_token,
        gmail_email: userInfo.data.email
      }, {
        onConflict: 'id'
      });

    if (upsertError) {
      console.error('Error storing Gmail tokens:', upsertError);
      console.error('Upsert error details:', JSON.stringify(upsertError, null, 2));
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/event?error=storage_error&details=${encodeURIComponent(upsertError.message)}`);
    }
    
    console.log('Gmail tokens stored successfully for user:', userId);

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
