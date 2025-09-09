import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server-client';

export async function GET() {
  try {
    console.log('Testing database connection...');
    const supabase = await createClient();
    
    // Test basic connection
    const { data: tables, error: tablesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (tablesError) {
      console.error('Database error:', tablesError);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: tablesError
      });
    }
    
    // Check if Gmail columns exist by trying to select them
    const { data: profileTest, error: profileError } = await supabase
      .from('profiles')
      .select('id, gmail_access_token, gmail_refresh_token, gmail_email')
      .limit(1);
    
    console.log('Database test results:', { profileTest, profileError });
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      hasGmailColumns: !profileError,
      profileError: profileError?.message,
      sampleData: profileTest?.[0] || null
    });
    
  } catch (error) {
    console.error('Test DB error:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
