-- Fixed SQL functions for atomic ticket quantity management with proper UUID handling
-- Run this in your Supabase SQL editor to fix the UUID type mismatch

-- Function to atomically decrement ticket quantity (FIXED for UUID and type casting)
CREATE OR REPLACE FUNCTION decrement_ticket_quantity(ticket_id text)
RETURNS TABLE(
  id text,
  event_id bigint,
  name text,
  price bigint,
  quantity_available bigint,
  purchase_deadline timestamp with time zone,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atomically update and return the ticket if quantity > 0
  -- Fixed: Cast ticket_id to UUID for comparison and ensure proper type casting
  RETURN QUERY
  UPDATE tickets 
  SET quantity_available = tickets.quantity_available - 1
  WHERE tickets.id = ticket_id::uuid 
    AND tickets.quantity_available > 0
  RETURNING 
    tickets.id::text,
    tickets.event_id::bigint,
    tickets.name,
    tickets.price::bigint,
    tickets.quantity_available::bigint,
    tickets.purchase_deadline,
    tickets.created_at;
  
  -- If no rows were updated, it means ticket was not available
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not available or sold out';
  END IF;
END;
$$;

-- Function to atomically increment ticket quantity (FIXED for UUID and type casting)
CREATE OR REPLACE FUNCTION increment_ticket_quantity(ticket_id text)
RETURNS TABLE(
  id text,
  event_id bigint,
  name text,
  price bigint,
  quantity_available bigint,
  purchase_deadline timestamp with time zone,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atomically increment the ticket quantity
  -- Fixed: Cast ticket_id to UUID for comparison and ensure proper type casting
  RETURN QUERY
  UPDATE tickets 
  SET quantity_available = tickets.quantity_available + 1
  WHERE tickets.id = ticket_id::uuid
  RETURNING 
    tickets.id::text,
    tickets.event_id::bigint,
    tickets.name,
    tickets.price::bigint,
    tickets.quantity_available::bigint,
    tickets.purchase_deadline,
    tickets.created_at;
END;
$$;

-- Function to get current ticket availability with sold count (FIXED for UUID and type casting)
CREATE OR REPLACE FUNCTION get_ticket_availability(event_id_param bigint)
RETURNS TABLE(
  ticket_id text,
  ticket_name text,
  price bigint,
  quantity_available bigint,
  quantity_sold bigint,
  purchase_deadline timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id::text as ticket_id,
    t.name as ticket_name,
    t.price::bigint,
    t.quantity_available::bigint,
    COALESCE(COUNT(r.id), 0)::bigint as quantity_sold,
    t.purchase_deadline
  FROM tickets t
  LEFT JOIN rsvps r ON t.id::text = r.ticket_id
  WHERE t.event_id = event_id_param
  GROUP BY t.id, t.name, t.price, t.quantity_available, t.purchase_deadline
  ORDER BY t.created_at;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION decrement_ticket_quantity(text) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_ticket_quantity(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ticket_availability(bigint) TO authenticated;

-- Confirmation message
SELECT 'Ticket management functions updated with proper UUID handling!' as status;
