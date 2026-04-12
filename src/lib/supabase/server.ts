import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Reminder, WishTemplate } from '@/types';

function createSupabaseAdmin(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase server configuration: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

let _admin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_admin) {
    _admin = createSupabaseAdmin();
  }
  return _admin;
}

/** Lazy admin client; API routes must set env vars at runtime. */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop: string | symbol) {
    const client = getSupabaseAdmin();
    const value = Reflect.get(client, prop, client) as unknown;
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(client) : value;
  },
});

// ============================================
// Server-Only Operations
// ============================================

export async function getReminderWithTemplate(
  id: string
): Promise<(Reminder & { wish_templates?: WishTemplate | null }) | null> {
  const { data: row, error } = await getSupabaseAdmin()
    .from('reminders')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !row) {
    console.error('Error fetching reminder:', error);
    return null;
  }

  const reminder = row as Reminder;
  const { data: tpl } = await getSupabaseAdmin()
    .from('wish_templates')
    .select('*')
    .eq('name', reminder.wish_template)
    .maybeSingle();

  return { ...reminder, wish_templates: tpl as WishTemplate | null };
}

export async function updateReminderStatus(id: string, status: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('reminders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function logAutomationAction(
  reminderId: string | null,
  actionType: string,
  provider: string,
  payload: Record<string, unknown>,
  response?: Record<string, unknown>
): Promise<void> {
  const { error } = await getSupabaseAdmin().from('automation_logs').insert({
    reminder_id: reminderId,
    action_type: actionType,
    provider,
    payload,
    response,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Failed to log action:', error);
  }
}

export async function getDueReminderIds(): Promise<{ id: string }[]> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - 5 * 60000);

  const { data, error } = await getSupabaseAdmin()
    .from('reminders')
    .select('id')
    .eq('status', 'pending')
    .eq('automation_enabled', true)
    .lte('target_date', now.toISOString())
    .gte('target_date', windowStart.toISOString());

  if (error) throw error;
  return data || [];
}
