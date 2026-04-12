-- ============================================
-- Extensions (Supabase: enable in Dashboard if migration fails locally)
-- ============================================

-- Enable via Supabase Dashboard → Database → Extensions if these fail on your host.
create extension if not exists "pg_cron";
create extension if not exists "pg_net";

-- ============================================
-- Tables
-- ============================================

create table public.reminders (
    id uuid default gen_random_uuid() primary key,
    event_type text not null check (event_type in ('birthday', 'class', 'anniversary', 'custom')),
    title text not null check (length(title) <= 200),
    description text check (description is null or length(description) <= 2000),
    target_date timestamp with time zone not null,
    target_phone text check (target_phone is null or target_phone ~ '^\+[1-9]\d{1,14}$'),
    target_email text check (target_email is null or target_email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
    wish_template text default 'elegant' check (wish_template in ('elegant', 'fun', 'corporate', 'romantic', 'dark')),
    automation_enabled boolean default true,
    call_enabled boolean default true,
    email_enabled boolean default true,
    status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    user_id uuid references auth.users(id) on delete cascade
);

create table public.automation_logs (
    id uuid default gen_random_uuid() primary key,
    reminder_id uuid references public.reminders(id) on delete set null,
    action_type text not null,
    provider text not null check (provider in ('resend', 'twilio')),
    payload jsonb not null default '{}',
    response jsonb,
    created_at timestamp with time zone default now()
);

create table public.wish_templates (
    id uuid default gen_random_uuid() primary key,
    name text unique not null check (name in ('elegant', 'fun', 'corporate', 'romantic', 'dark')),
    html_content text not null,
    text_content text not null,
    variables jsonb default '[]'::jsonb,
    created_at timestamp with time zone default now()
);

-- ============================================
-- Indexes
-- ============================================

create index idx_reminders_status on public.reminders(status);
create index idx_reminders_target_date on public.reminders(target_date);
create index idx_reminders_user_id on public.reminders(user_id);
create index idx_automation_logs_reminder_id on public.automation_logs(reminder_id);
create index idx_automation_logs_created_at on public.automation_logs(created_at desc);

-- ============================================
-- Seed Data
-- ============================================

insert into public.wish_templates (name, html_content, text_content, variables) values
('elegant', 
'<div style="font-family: Georgia, serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 20px; color: white; text-align: center;">
    <h1 style="font-size: 36px; margin-bottom: 20px;">{{title}}</h1>
    <p style="font-size: 20px; line-height: 1.6;">{{message}}</p>
    <div style="margin-top: 30px; padding: 20px; background: rgba(255,255,255,0.2); border-radius: 10px;">
        <p style="font-style: italic;">"{{quote}}"</p>
    </div>
</div>',
'{{title}} - {{message}} - "{{quote}}"',
'["title", "message", "quote"]'),

('dark',
'<div style="font-family: Courier New, monospace; background: #0a0a0a; color: #ff006e; padding: 40px; border: 3px solid #ff006e; box-shadow: 0 0 20px #ff006e;">
    <h1 style="text-transform: uppercase; letter-spacing: 5px;">{{title}}</h1>
    <p style="font-size: 18px;">{{message}}</p>
    <hr style="border-color: #ff006e; margin: 20px 0;">
    <p style="color: #8338ec;">{{quote}}</p>
</div>',
'[DARK MODE] {{title}}: {{message}}',
'["title", "message", "quote"]'),

('fun',
'<div style="font-family: Comic Sans MS, cursive; background: linear-gradient(45deg, #f093fb 0%, #f5576c 100%); padding: 40px; border-radius: 20px; color: white; text-align: center;">
    <h1 style="font-size: 40px;">🎉 {{title}} 🎉</h1>
    <p style="font-size: 24px;">{{message}}</p>
    <div style="font-size: 50px; margin-top: 20px;">🎈🎊🎁</div>
</div>',
'🎉 {{title}}: {{message}} 🎉',
'["title", "message"]'),

('corporate',
'<div style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 40px; border: 1px solid #ddd;">
    <div style="background: #1a365d; color: white; padding: 20px; margin: -40px -40px 20px -40px;">
        <h1 style="margin: 0;">BUSINESS REMINDER</h1>
    </div>
    <p><strong>{{title}}</strong></p>
    <p>{{message}}</p>
    <div style="background: #edf2f7; padding: 15px; margin-top: 20px;">
        <p style="margin: 0;"><strong>Date:</strong> {{date}}</p>
    </div>
</div>',
'BUSINESS REMINDER: {{title}} - {{message}}',
'["title", "message", "date"]'),

('romantic',
'<div style="font-family: Georgia, serif; background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); padding: 40px; border-radius: 15px; text-align: center; color: #4a5568;">
    <h1 style="font-family: cursive; color: #e53e3e; font-size: 42px;">{{title}}</h1>
    <div style="font-size: 30px; margin: 20px 0;">❤️ 💕 ❤️</div>
    <p style="font-size: 20px; line-height: 1.6;">{{message}}</p>
    <p style="color: #e53e3e; margin-top: 20px;">With love, on {{date}}</p>
</div>',
'❤️ {{title}}: {{message}} ❤️',
'["title", "message", "date"]');

-- ============================================
-- RLS — permissive demo policies (tighten with auth for production)
-- ============================================

alter table public.reminders enable row level security;
alter table public.automation_logs enable row level security;
alter table public.wish_templates enable row level security;

create policy "reminders_select_all" on public.reminders for select using (true);
create policy "reminders_insert_all" on public.reminders for insert with check (true);
create policy "reminders_update_all" on public.reminders for update using (true);
create policy "reminders_delete_all" on public.reminders for delete using (true);

create policy "automation_logs_select_all" on public.automation_logs for select using (true);
create policy "automation_logs_insert_all" on public.automation_logs for insert with check (true);

create policy "wish_templates_select_all" on public.wish_templates for select using (true);

-- ============================================
-- Functions & Triggers
-- ============================================

create or replace function public.update_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger update_reminders_timestamp
    before update on public.reminders
    for each row
    execute function public.update_updated_at();

-- ============================================
-- Cron (run manually in SQL Editor if extensions are available)
-- Replace URL and Bearer token with your project values.
-- ============================================

-- select cron.schedule(
--   'process-due-reminders',
--   '* * * * *',
--   $$
--     select net.http_post(
--       url:='https://YOUR_PROJECT.supabase.co/functions/v1/cron-scheduler',
--       headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_OR_ANON_KEY", "Content-Type": "application/json"}'::jsonb,
--       body:='{}'::jsonb
--     ) as request_id;
--   $$
-- );
