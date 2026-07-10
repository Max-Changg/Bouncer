import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server-client';
import { createAdminClient } from '@/lib/supabase-admin-client';
import { decryptToken } from '@/lib/token-crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipients, message, eventName } = body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Recipients array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate that we have the Google OAuth credentials
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('Google OAuth credentials are not configured');
      return NextResponse.json(
        { error: 'Email service is not properly configured' },
        { status: 500 }
      );
    }

    // Identify the sender from their session — never from the request body
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'You must be signed in to send emails.' },
        { status: 401 }
      );
    }

    // Read the user's Gmail credentials via the service-role client — the
    // gmail_credentials table is not accessible to browser clients
    const admin = createAdminClient();
    const { data: credentials, error: credentialsError } = await admin
      .from('gmail_credentials')
      .select('gmail_email, refresh_token_enc')
      .eq('user_id', user.id)
      .maybeSingle();

    if (credentialsError) {
      console.error('Error fetching Gmail credentials:', credentialsError);
      return NextResponse.json(
        { error: 'Failed to look up Gmail connection.' },
        { status: 500 }
      );
    }

    // If Gmail isn't connected, fall back to mailto approach
    if (!credentials) {
      return NextResponse.json({
        success: true,
        useMailto: true,
        message: 'Gmail not connected. Will use mailto fallback.',
        results: {
          successful: recipients.length,
          failed: 0,
          details: recipients.map(email => ({ email, success: true, method: 'mailto' }))
        }
      });
    }

    // Set up OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/gmail/callback`
    );

    // Only the refresh token is stored (encrypted); googleapis fetches a
    // short-lived access token from it automatically
    oauth2Client.setCredentials({
      refresh_token: decryptToken(credentials.refresh_token_enc),
    });

    // Initialize Gmail API
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Send emails to all recipients
    const emailPromises = recipients.map(async (email: string) => {
      try {
        // Create email content
        const emailContent = [
          `To: ${email}`,
          `From: ${credentials.gmail_email}`,
          `Subject: Update from ${eventName || 'Your Event'}`,
          'Content-Type: text/html; charset=utf-8',
          '',
          `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Update from ${eventName || 'Your Event'}</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
              <div style="white-space: pre-wrap; line-height: 1.6; color: #333;">${message.replace(/\n/g, '<br>')}</div>
            </div>
            
            <div style="text-align: center; padding: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
              <p>This message was sent via Bouncer</p>
            </div>
          </div>`
        ].join('\n');

        // Encode email content
        const encodedEmail = Buffer.from(emailContent)
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        const result = await gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: encodedEmail,
          },
        });

        return { email, success: true, id: result.data.id };
      } catch (error) {
        console.error(`Failed to send email to ${email}:`, error);
        return { email, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    const results = await Promise.all(emailPromises);
    
    // Count successful and failed sends
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return NextResponse.json({
      success: true,
      message: `Emails sent successfully to ${successful.length} recipients`,
      results: {
        successful: successful.length,
        failed: failed.length,
        details: results
      }
    });

  } catch (error) {
    console.error('Error in send-emails API route:', error);
    
    // Handle token refresh if needed
    if (error instanceof Error && error.message.includes('invalid_grant')) {
      return NextResponse.json(
        { error: 'Gmail authentication expired. Please re-authenticate with Gmail.' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
