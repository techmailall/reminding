import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const CONFIG = {
  windowMinutes: 5,
  maxBatchSize: 50,
};

serve(async (_req) => {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - CONFIG.windowMinutes * 60000);

    const { data: dueReminders, error } = await supabase
      .from('reminders')
      .select('id')
      .eq('status', 'pending')
      .eq('automation_enabled', true)
      .lte('target_date', now.toISOString())
      .gte('target_date', windowStart.toISOString())
      .limit(CONFIG.maxBatchSize);

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({ error: 'Database query failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const results = await Promise.allSettled(
      (dueReminders || []).map((row: { id: string }) => processReminder(row.id))
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return new Response(
      JSON.stringify({
        processed: dueReminders?.length || 0,
        succeeded,
        failed,
        timestamp: now.toISOString(),
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Cron scheduler error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

async function processReminder(reminderId: string): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase configuration');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/process-reminder`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reminder_id: reminderId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Process reminder failed: ${errorText}`);
  }
}
