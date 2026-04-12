import { schedule } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const handler = schedule('* * * * *', async (event) => {
  console.log('Cron job triggered at:', new Date().toISOString());
  console.log('Event body:', event.body);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase configuration');
    return { statusCode: 500, body: 'Missing Supabase configuration' };
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const now = new Date().toISOString();
  console.log('Checking for reminders due before:', now);

  const { data: reminders, error } = await supabase
    .from('reminders')
    .select('id, title, target_date')
    .eq('status', 'pending')
    .eq('automation_enabled', true)
    .lte('target_date', now);

  if (error) {
    console.error('Database error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }

  console.log(`Found ${reminders?.length || 0} reminders to process`);

  if (!reminders || reminders.length === 0) {
    return { statusCode: 200, body: JSON.stringify({ message: 'No reminders due' }) };
  }

  const baseUrl = process.env.URL || 'https://remindall.netlify.app';
  console.log('Using base URL:', baseUrl);

  const results = [];
  for (const reminder of reminders) {
    console.log(`Processing reminder: ${reminder.id} - ${reminder.title}`);
    try {
      const response = await fetch(`${baseUrl}/api/trigger-immediate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminder_id: reminder.id }),
      });
      const result = await response.json();
      console.log(`Reminder ${reminder.id} result:`, result);
      results.push({ id: reminder.id, success: response.ok, result });
    } catch (err) {
      console.error(`Failed to process reminder ${reminder.id}:`, err);
      results.push({ id: reminder.id, success: false, error: String(err) });
    }
  }

  return { statusCode: 200, body: JSON.stringify({ processed: reminders.length, results }) };
});

export { handler };
