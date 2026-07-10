-- Gmail OAuth credentials for the organizer "email your guest list" feature.
-- Refresh tokens are encrypted by the app (AES-256-GCM, key in GMAIL_TOKEN_KEY
-- env var) before being written here — this table never holds plaintext tokens.

create table public.gmail_credentials (
  user_id uuid primary key references auth.users (id) on delete cascade,
  gmail_email text not null,
  refresh_token_enc text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS enabled with NO policies: the anon and authenticated roles (browser
-- clients) get zero access. Only the service role, which bypasses RLS and is
-- used exclusively in server-side API routes, can read or write this table.
alter table public.gmail_credentials enable row level security;
