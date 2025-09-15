-- Fix Row Level Security (RLS) for rsvps table
-- Run this in your Supabase SQL editor to fix the 406 error

-- Enable RLS on rsvps table (if not already enabled)
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own RSVPs" ON rsvps;
DROP POLICY IF EXISTS "Users can insert their own RSVPs" ON rsvps;
DROP POLICY IF EXISTS "Users can update their own RSVPs" ON rsvps;
DROP POLICY IF EXISTS "Event owners can view all RSVPs for their events" ON rsvps;

-- Policy: Users can view their own RSVPs
CREATE POLICY "Users can view their own RSVPs" ON rsvps
  FOR SELECT USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own RSVPs
CREATE POLICY "Users can insert their own RSVPs" ON rsvps
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own RSVPs (for payment proof, etc.)
CREATE POLICY "Users can update their own RSVPs" ON rsvps
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Policy: Event owners can view all RSVPs for their events
CREATE POLICY "Event owners can view all RSVPs for their events" ON rsvps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Events" 
      WHERE "Events".id = rsvps.event_id 
      AND "Events".user_id = auth.uid()::text
    )
  );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON rsvps TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Confirmation message
SELECT 'RSVP RLS policies created successfully! Users can now read/write their own RSVPs and event owners can view RSVPs for their events.' as status;
