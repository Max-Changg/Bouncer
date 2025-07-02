''''''export type Json = | string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          name: string;
          theme: string;
          start_date: string;
          end_date: string;
          time_zone: string;
          additional_info: string;
          user_id: string;
          created_at: string;
          rsvps: {
            id: number;
            event_id: number;
            name: string;
            email: string;
            status: string;
            created_at: string;
          }[];
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
      rsvps: {
        Row: {
          id: number;
          event_id: number;
          name: string;
          email: string;
          status: string;
          created_at: string;
        };
        Insert: {
          event_id: number;
          name: string;
          email: string;
          status: string;
        };
        Update: {
          name?: string;
          email?: string;
          status?: string;
        };
      };
    };
  };
}
'''
''
