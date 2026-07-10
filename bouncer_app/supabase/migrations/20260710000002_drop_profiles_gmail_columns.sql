-- Removes the old plaintext Gmail token columns from profiles.
-- RUN THIS ONLY AFTER the app code reading/writing these columns is deployed
-- (the code now uses the gmail_credentials table instead). Existing Gmail
-- connections are not migrated — organizers reconnect Gmail once.

alter table public.profiles
  drop column if exists gmail_access_token,
  drop column if exists gmail_refresh_token,
  drop column if exists gmail_email;
