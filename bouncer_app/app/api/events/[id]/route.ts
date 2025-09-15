import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server-client';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = parseInt(params.id);
    
    if (!eventId || isNaN(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user owns the event
    const { data: event, error: eventError } = await supabase
      .from('Events')
      .select('user_id')
      .eq('id', eventId)
      .single();

    if (eventError) {
      // Error fetching event
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - you can only delete your own events' },
        { status: 403 }
      );
    }

    // Delete all related data in the correct order (due to foreign key constraints)
    // Deleting all data for event

    // Step 1: Delete RSVPs (references tickets)
    const { error: rsvpError } = await supabase
      .from('rsvps')
      .delete()
      .eq('event_id', eventId);

    if (rsvpError) {
      // Error deleting RSVPs
      return NextResponse.json(
        { error: 'Failed to delete RSVPs' },
        { status: 500 }
      );
    }

    // Step 2: Delete tickets (references events)
    const { error: ticketsError } = await supabase
      .from('tickets')
      .delete()
      .eq('event_id', eventId);

    if (ticketsError) {
      // Error deleting tickets
      return NextResponse.json(
        { error: 'Failed to delete tickets' },
        { status: 500 }
      );
    }

    // Step 3: Delete the event itself
    const { error: eventDeleteError } = await supabase
      .from('Events')
      .delete()
      .eq('id', eventId);

    if (eventDeleteError) {
      // Error deleting event
      return NextResponse.json(
        { error: 'Failed to delete event' },
        { status: 500 }
      );
    }

    // Successfully deleted event and all related data

    return NextResponse.json(
      { 
        success: true, 
        message: 'Event and all related data deleted successfully' 
      },
      { status: 200 }
    );

  } catch (error) {
    // Unexpected error deleting event
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
