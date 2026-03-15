-- Prevent oversized auth cookies by removing base64 avatar payloads from auth metadata.
update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) - 'avatar_url'
where coalesce(raw_user_meta_data ->> 'avatar_url', '') like 'data:image/%';
