import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server-client';

export async function POST(request: NextRequest) {
  try {
    const { eventId, userId, name, email, ticketId, paymentProofUrl } = await request.json();

    if (!eventId || !userId || !name || !email || !ticketId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Start a transaction-like operation using RPC or multiple queries
    // First, check if user already has an RSVP
    const { data: existingRsvp, error: checkError } = await supabase
      .from('rsvps')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing RSVP:', checkError);
      return NextResponse.json(
        { error: 'Failed to check existing RSVP' },
        { status: 500 }
      );
    }

    if (existingRsvp) {
      return NextResponse.json(
        { error: 'You have already RSVP\'d to this event' },
        { status: 409 }
      );
    }

    // Atomically decrement ticket quantity and check availability
    // Use RPC (Remote Procedure Call) for atomic operation
    const { data: ticketUpdate, error: ticketError } = await supabase
      .rpc('decrement_ticket_quantity', {
        ticket_id: ticketId
      });

    if (ticketError || !ticketUpdate) {
      console.error('Ticket update error:', ticketError);
      return NextResponse.json(
        { error: 'Selected ticket is no longer available' },
        { status: 409 }
      );
    }

    // If ticket decrement succeeded, create the RSVP
    const { data: rsvpData, error: rsvpError } = await supabase
      .from('rsvps')
      .insert([
        {
          name,
          email,
          event_id: eventId,
          user_id: userId,
          ticket_id: ticketId,
          payment_proof_url: paymentProofUrl,
        },
      ])
      .select()
      .single();

    if (rsvpError) {
      console.error('RSVP insertion error:', rsvpError);
      
      // If RSVP creation fails, we need to rollback the ticket quantity
      // This is a compensation action since we don't have true transactions
      await supabase
        .rpc('increment_ticket_quantity', {
          ticket_id: ticketId
        });

      return NextResponse.json(
        { error: 'Failed to create RSVP' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        rsvp: rsvpData,
        remainingTickets: ticketUpdate.quantity_available 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('RSVP API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
