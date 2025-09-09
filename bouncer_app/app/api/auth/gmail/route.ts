import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const eventId = searchParams.get('eventId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate that we have the Google OAuth credentials
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('Google OAuth credentials are not configured');
      return NextResponse.json(
        { error: 'Gmail authentication is not properly configured' },
        { status: 500 }
      );
    }

    // Set up OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/gmail/callback`
    );

    // Generate the authentication URL
    const stateData = JSON.stringify({ userId, eventId });
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/userinfo.email'],
      state: stateData, // Pass userId and eventId in state to retrieve in callback
      prompt: 'consent' // Force consent to get refresh token
    });

    return NextResponse.json({ authUrl });

  } catch (error) {
    console.error('Error in Gmail auth route:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
