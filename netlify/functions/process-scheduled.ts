import { schedule } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const handler = schedule('* * * * *', async () => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date().toISOString();

  const { data: reminders } = await supabase
    .from('reminders')
    .select('id')
    .eq('status', 'pending')
    .eq('automation_enabled', true)
    .lte('target_date', now);

  if (!reminders || reminders.length === 0) return { statusCode: 200 };

  const baseUrl = process.env.URL || 'https://remindingall.netlify.app';

  for (const reminder of reminders) {
    await fetch(`${baseUrl}/api/trigger-immediate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reminder_id: reminder.id }),
    });
  }

  return { statusCode: 200 };
});

export { handler };
