import { createClient } from '@supabase/supabase-js';
import type { Reminder, ReminderInput } from '@/types';

// Placeholders allow `next build` without .env; set real values in .env.local for runtime.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || 'https://placeholder.supabase.co';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || 'public-anon-key-placeholder';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// ============================================
// Typed Database Helpers
// ============================================

export async function fetchReminders(): Promise<Reminder[]> {
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .order('target_date', { ascending: true });

  if (error) throw error;
  return (data as Reminder[]) || [];
}

export async function createReminder(
  reminder: ReminderInput & { status?: Reminder['status']; user_id?: string | null }
): Promise<Reminder> {
  const row = {
    event_type: reminder.event_type,
    title: reminder.title,
    description: reminder.description ?? null,
    target_date: reminder.target_date,
    target_phone: reminder.target_phone ?? null,
    target_email: reminder.target_email ?? null,
    wish_template: reminder.wish_template,
    automation_enabled: reminder.automation_enabled,
    call_enabled: reminder.call_enabled,
    email_enabled: reminder.email_enabled,
    status: reminder.status ?? 'pending',
    ...(reminder.user_id !== undefined ? { user_id: reminder.user_id } : {}),
  };

  const { data, error } = await supabase.from('reminders').insert([row]).select().single();

  if (error) throw error;
  if (!data) throw new Error('Failed to create reminder');
  return data as Reminder;
}

export async function deleteReminder(id: string): Promise<void> {
  const { error } = await supabase.from('reminders').delete().eq('id', id);
  if (error) throw error;
}

export function subscribeToReminders(callback: () => void) {
  return supabase
    .channel('reminders_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'reminders' },
      callback
    )
    .subscribe();
}
