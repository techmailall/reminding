import Queue from 'bull';
import { createClient } from '@supabase/supabase-js';
import {
  generateEmailTemplate,
  generatePlainText,
} from '../src/lib/templates/email-templates';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const MAX_CONCURRENT_JOBS = 50;

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY are required');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const reminderQueue = new Queue('reminder processing', REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

reminderQueue.process(MAX_CONCURRENT_JOBS, async (job) => {
  const { reminder_id } = job.data as { reminder_id: string };

  console.log(`[Job ${job.id}] Processing reminder: ${reminder_id}`);

  try {
    const { data: reminder, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('id', reminder_id)
      .single();

    if (error || !reminder) {
      throw new Error(`Reminder not found: ${error?.message}`);
    }

    const results = await executeNotifications(reminder);

    const finalStatus = results.some((r) => r.success) ? 'completed' : 'failed';
    await supabase
      .from('reminders')
      .update({ status: finalStatus, updated_at: new Date().toISOString() })
      .eq('id', reminder_id);

    console.log(`[Job ${job.id}] Completed with status: ${finalStatus}`);

    return { success: true, results };
  } catch (error) {
    console.error(`[Job ${job.id}] Failed:`, error);
    throw error;
  }
});

async function executeNotifications(
  reminder: Record<string, unknown>
): Promise<Array<{ type: string; success: boolean }>> {
  const promises: Promise<{ type: string; success: boolean }>[] = [];

  if (reminder.email_enabled && reminder.target_email) {
    promises.push(sendEmail(reminder));
  }

  if (reminder.call_enabled && reminder.target_phone) {
    promises.push(makeVoiceCall(reminder));
  }

  if (reminder.target_phone) {
    promises.push(sendSMS(reminder));
  }

  return Promise.all(promises);
}

async function sendEmail(
  reminder: Record<string, unknown>
): Promise<{ type: string; success: boolean }> {
  try {
    const variables = {
      title: String(reminder.title),
      message: String(reminder.description || ''),
      date: new Date(String(reminder.target_date)).toLocaleDateString(),
      eventType: String(reminder.event_type),
    };

    const wishTemplate = reminder.wish_template as
      | 'elegant'
      | 'fun'
      | 'corporate'
      | 'romantic'
      | 'dark';

    const html = generateEmailTemplate(wishTemplate, variables);
    const text = generatePlainText(wishTemplate, variables);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Automated Reminder System <${process.env.FROM_EMAIL || 'notifications@darkgarden.dev'}>`,
        to: reminder.target_email,
        subject: `⏰ ${reminder.title} - Automated Notification`,
        html,
        text,
      }),
    });

    const data = (await response.json()) as Record<string, unknown>;

    await logAction(String(reminder.id), 'email_sent', 'resend', {
      status: response.status,
      ...data,
    });

    return { type: 'email', success: response.ok };
  } catch (error) {
    console.error('Email failed:', error);
    await logAction(String(reminder.id), 'email_sent', 'resend', {
      error: (error as Error).message,
    });
    return { type: 'email', success: false };
  }
}

async function makeVoiceCall(
  reminder: Record<string, unknown>
): Promise<{ type: string; success: boolean }> {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    const webhookUrl = process.env.WEBHOOK_URL;

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Missing Twilio configuration');
    }

    const twiml = generateTwiML(reminder);

    const params = new URLSearchParams({
      Twiml: twiml,
      To: String(reminder.target_phone),
      From: fromNumber,
      StatusCallbackEvent: 'initiated ringing answered completed',
      StatusCallbackMethod: 'POST',
    });
    if (webhookUrl) {
      params.set('StatusCallback', `${webhookUrl.replace(/\/$/, '')}/api/twilio-status`);
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
      {
        method: 'POST',
        headers: {
          Authorization:
            'Basic ' +
            Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      }
    );

    const data = (await response.json()) as Record<string, unknown>;

    await logAction(String(reminder.id), 'call_initiated', 'twilio', {
      status: response.status,
      ...data,
    });

    return { type: 'call', success: response.ok };
  } catch (error) {
    console.error('Call failed:', error);
    await logAction(String(reminder.id), 'call_initiated', 'twilio', {
      error: (error as Error).message,
    });
    return { type: 'call', success: false };
  }
}

async function sendSMS(
  reminder: Record<string, unknown>
): Promise<{ type: string; success: boolean }> {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Missing Twilio configuration');
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization:
            'Basic ' +
            Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          Body: `🔔 ${reminder.title}: ${reminder.description || 'Reminder'}`,
          To: String(reminder.target_phone),
          From: fromNumber,
        }),
      }
    );

    const data = (await response.json()) as Record<string, unknown>;

    await logAction(String(reminder.id), 'sms_sent', 'twilio', {
      status: response.status,
      ...data,
    });

    return { type: 'sms', success: response.ok };
  } catch (error) {
    console.error('SMS failed:', error);
    await logAction(String(reminder.id), 'sms_sent', 'twilio', {
      error: (error as Error).message,
    });
    return { type: 'sms', success: false };
  }
}

function generateTwiML(reminder: Record<string, unknown>): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Pause length="1"/>
  <Say voice="Polly.Joanna" language="en-US">
    <prosody rate="slow" pitch="+10%">
      Hello. This is your automated reminder for ${escapeXml(String(reminder.title))}.
    </prosody>
  </Say>
  <Pause length="1"/>
  <Say voice="Polly.Matthew">
    ${escapeXml(String(reminder.description || 'No additional details provided.'))}
  </Say>
  <Pause length="2"/>
  <Say voice="Polly.Joanna">
    This message was sent on ${new Date().toLocaleDateString()}.
    Goodbye.
  </Say>
  <Hangup/>
</Response>`;
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
  payload: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.from('automation_logs').insert({
    reminder_id: reminderId,
    action_type: actionType,
    provider,
    payload,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Failed to log action:', error);
  }
}

reminderQueue.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

reminderQueue.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});

console.log('🚀 Worker started.');
console.log(`📊 Max concurrent jobs: ${MAX_CONCURRENT_JOBS}`);
console.log(`🔌 Redis URL: ${REDIS_URL.replace(/:\/\/[^@]+@/, '://***@')}`);
