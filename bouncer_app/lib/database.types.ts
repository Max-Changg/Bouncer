export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
      Events: {
        Row: {
          id: number;
          name: string;
          theme: string;
          start_date: string;
          end_date: string;
          time_zone: string;
          additional_info: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          name: string;
          theme: string;
          start_date: string;
          end_date: string;
          time_zone: string;
          additional_info: string;
          user_id: string;
        };
        Update: {
          name?: string;
          theme?: string;
          start_date?: string;
          end_date?: string;
          time_zone?: string;
          additional_info?: string;
        };
      };
      tickets: {
        Row: {
          id: string;
          event_id: number;
          name: string;
          price: number;
          quantity_available: number;
          purchase_deadline: string | null;
          created_at: string;
        };
        Insert: {
          event_id: number;
          name: string;
          price: number;
          quantity_available: number;
          purchase_deadline?: string | null;
        };
        Update: {
          name?: string;
          price?: number;
          quantity_available?: number;
          purchase_deadline?: string | null;
        };
      };
      rsvps: {
        Row: {
          id: string /* Corrected: uuid maps to string */;
          event_id: number;
          name: string;
          email: string;
          status: string;
          created_at: string;
          is_approved: boolean;
          user_id: string /* Corrected: uuid maps to string */;
          payment_status?: string; // 'paid', 'unpaid', 'overpaid'
          amount_paid?: number;
          payment_method?: string;
          ticket_id?: string;
          amount_owed?: number;
        };
        Insert: {
          event_id: number;
          name: string;
          email: string;
          status: string;
          is_approved?: boolean;
          user_id: string;
          payment_status?: string;
          amount_paid?: number;
          payment_method?: string;
          ticket_id?: string;
          amount_owed?: number;
        };
        Update: {
          name?: string;
          email?: string;
          status?: string;
          is_approved?: boolean;
          payment_status?: string;
          amount_paid?: number;
          payment_method?: string;
          ticket_id?: string;
          amount_owed?: number;
        };
      };
      profiles: {
        Row: {
          id: string;
          updated_at: string;
          username: string;
          full_name: string;
          avatar_url: string;
          website: string;
          qr_code_data: string;
        };
        Insert: {
          id: string;
          updated_at?: string;
          username?: string;
          full_name?: string;
          avatar_url?: string;
          website?: string;
          qr_code_data?: string;
        };
        Update: {
          id?: string;
          updated_at?: string;
          username?: string;
          full_name?: string;
          avatar_url?: string;
          website?: string;
          qr_code_data?: string;
        };
      };
    };
  };
}
