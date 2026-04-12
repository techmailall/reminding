import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY'];
for (const envVar of requiredEnvVars) {
  if (!Deno.env.get(envVar)) {
    console.error(`Missing required environment variable: ${envVar}`);
  }
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  try {
    const { reminder_id, immediate = false } = await req.json();

    if (!reminder_id) {
      return new Response(JSON.stringify({ error: 'reminder_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: reminder, error: fetchError } = await supabase
      .from('reminders')
      .select('*')
      .eq('id', reminder_id)
      .single();

    if (fetchError || !reminder) {
      console.error('Reminder not found:', fetchError);
      return new Response(JSON.stringify({ error: 'Reminder not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: wishTpl } = await supabase
      .from('wish_templates')
      .select('html_content, text_content')
      .eq('name', reminder.wish_template)
      .maybeSingle();

    const reminderWithTpl = {
      ...reminder,
      wish_templates: wishTpl,
    };

    if (!immediate && !reminder.automation_enabled) {
      return new Response(JSON.stringify({ status: 'skipped', reason: 'automation_disabled' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await supabase
      .from('reminders')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', reminder_id);

    const variables: Record<string, string> = {
      title: reminder.title,
      message: reminder.description || 'No additional details',
      quote: 'Time waits for no one.',
      date: new Date(reminder.target_date).toLocaleDateString(),
      eventType: reminder.event_type,
    };

    const results: { email?: boolean; call?: boolean } = {};

    if (reminder.email_enabled && reminder.target_email) {
      results.email = await sendEmail(reminderWithTpl, variables);
    }

    if (reminder.call_enabled && reminder.target_phone) {
      results.call = await makeCall(reminderWithTpl);
    }

    const finalStatus = Object.values(results).some(Boolean) ? 'completed' : 'failed';
    await supabase
      .from('reminders')
      .update({ status: finalStatus, updated_at: new Date().toISOString() })
      .eq('id', reminder_id);

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Process reminder error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

async function sendEmail(reminder: Record<string, unknown>, variables: Record<string, string>): Promise<boolean> {
  try {
    const wishTemplates = reminder.wish_templates as { html_content?: string; text_content?: string } | null;
    const html = interpolateTemplate(
      wishTemplates?.html_content || '{{title}}',
      variables
    );
    const text = interpolateTemplate(
      wishTemplates?.text_content || '{{title}}',
      variables
    );

    const fromAddr = Deno.env.get('RESEND_FROM') ?? 'Reminders <noreply@yourdomain.com>';

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddr,
        to: reminder.target_email,
        subject: `🔔 Reminder: ${reminder.title}`,
        html,
        text,
      }),
    });

    const data = await response.json();
    await logAction(
      reminder.id as string,
      'email_sent',
      'resend',
      data as Record<string, unknown>,
      response.ok ? undefined : (data as Record<string, unknown>)
    );

    return response.ok;
  } catch (error) {
    console.error('Email send error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    await logAction(reminder.id as string, 'email_sent', 'resend', { error: msg });
    return false;
  }
}

async function makeCall(reminder: Record<string, unknown>): Promise<boolean> {
  try {
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Missing Twilio configuration');
    }

    const webhookBase = Deno.env.get('WEBHOOK_URL') ?? '';
    const statusCallback =
      webhookBase.length > 0 ? `${webhookBase.replace(/\/$/, '')}/api/twilio-status` : undefined;

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    Hello. This is an automated reminder for ${escapeXml(String(reminder.title))}.
    ${escapeXml(String(reminder.description || ''))}.
    Thank you. Goodbye.
  </Say>
  <Hangup/>
</Response>`;

    const params = new URLSearchParams({
      Twiml: twiml,
      To: String(reminder.target_phone),
      From: fromNumber,
      StatusCallbackEvent: 'initiated ringing answered completed',
      StatusCallbackMethod: 'POST',
    });
    if (statusCallback) {
      params.set('StatusCallback', statusCallback);
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + btoa(`${accountSid}:${authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      }
    );

    const data = await response.json();
    await logAction(
      reminder.id as string,
      'call_initiated',
      'twilio',
      data as Record<string, unknown>,
      response.ok ? undefined : (data as Record<string, unknown>)
    );

    return response.ok;
  } catch (error) {
    console.error('Call error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    await logAction(reminder.id as string, 'call_initiated', 'twilio', { error: msg });
    return false;
  }
}

function interpolateTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => vars[key] || match);
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function logAction(
  reminderId: string,
  actionType: string,
  provider: string,
  payload: Record<string, unknown>,
  response?: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.from('automation_logs').insert({
    reminder_id: reminderId,
    action_type: actionType,
    provider,
    payload,
    response: response ?? null,
  });

  if (error) {
    console.error('Failed to log action:', error);
  }
}
