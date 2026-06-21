-- app-settings-rls-fix.sql
-- Run this migration after admin-rls-fix.sql

drop policy if exists "Public read settings" on app_settings;

create policy "Public read non-admin settings" on app_settings
  for select to anon, authenticated
  using (key <> 'admin_settings');

create policy "Admin read admin settings" on app_settings
  for select to authenticated
  using (key = 'admin_settings' and is_admin_user());
