import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getReminderWithTemplate, updateReminderStatus, logAutomationAction } from '@/lib/supabase/server';
import { generateEmailTemplate, generatePlainText } from '@/lib/templates/email-templates';
import type { Reminder, TemplateType } from '@/types';

const triggerSchema = z.object({
  reminder_id: z.string().uuid(),
});

async function sendEmail(
  reminder: Reminder & { wish_templates?: { html_content: string; text_content: string } | null }
): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) { console.error('RESEND_API_KEY not set'); return false; }
  if (!reminder.target_email) return false;

  const vars = {
    title: reminder.title,
    message: reminder.description || 'No additional details',
    quote: 'Time waits for no one.',
    date: new Date(reminder.target_date).toLocaleDateString(),
    eventType: reminder.event_type,
  };

  const html = generateEmailTemplate(reminder.wish_template as TemplateType, vars);
  const text = generatePlainText(reminder.wish_template as TemplateType, vars);
  const from = process.env.FROM_EMAIL || 'onboarding@resend.dev';

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: reminder.target_email,
      subject: reminder.title,
      html,
      text,
    }),
  });

  const data = await response.json() as Record<string, unknown>;
  await logAutomationAction(reminder.id, 'email_sent', 'resend', { to: reminder.target_email }, response.ok ? data : undefined);
  return response.ok;
}

async function makeCall(reminder: Reminder): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  const webhookUrl = process.env.WEBHOOK_URL || 'https://remindall.netlify.app';

  if (!sid || !token || !from) { console.error('Twilio env vars not set'); return false; }
  if (!reminder.target_phone) return false;

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Hello! This is your automated reminder from RemindAll.</Say>
  <Pause length="1"/>
  <Say voice="Polly.Joanna">You have a reminder: ${reminder.title.replace(/[<>&"']/g, '')}.</Say>
  <Pause length="1"/>
  <Say voice="Polly.Joanna">${(reminder.description || '').replace(/[<>&"']/g, '')}.</Say>
  <Pause length="1"/>
  <Say voice="Polly.Joanna">Goodbye.</Say>
  <Hangup/>
</Response>`;

  const params = new URLSearchParams({
    To: reminder.target_phone,
    From: from,
    Twiml: twiml,
    StatusCallback: `${webhookUrl}/api/twilio-status`,
    StatusCallbackMethod: 'POST',
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    }
  );

  const data = await response.json() as Record<string, unknown>;
  await logAutomationAction(reminder.id, 'call_initiated', 'twilio', { to: reminder.target_phone }, response.ok ? data : undefined);
  return response.ok;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = triggerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, error: 'Invalid reminder ID' }, { status: 400 });
    }

    const { reminder_id } = validation.data;
    const reminder = await getReminderWithTemplate(reminder_id);

    if (!reminder) {
      return NextResponse.json({ success: false, error: 'Reminder not found' }, { status: 404 });
    }

    await updateReminderStatus(reminder_id, 'processing');

    const results: { email?: boolean; call?: boolean } = {};

    if (reminder.email_enabled && reminder.target_email) {
      results.email = await sendEmail(reminder);
    }
    if (reminder.call_enabled && reminder.target_phone) {
      results.call = await makeCall(reminder);
    }

    const finalStatus = Object.values(results).some(Boolean) ? 'completed' : 'failed';
    await updateReminderStatus(reminder_id, finalStatus);

    return NextResponse.json({ success: true, results, status: finalStatus });
  } catch (error) {
    console.error('Trigger immediate error:', error);
    return NextResponse.json({ success: false, error: 'Failed to trigger reminder' }, { status: 500 });
  }
}