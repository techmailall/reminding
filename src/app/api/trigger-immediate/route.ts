import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import { getReminderWithTemplate, updateReminderStatus, logAutomationAction } from '@/lib/supabase/server';
import { generateEmailTemplate, generatePlainText } from '@/lib/templates/email-templates';
import type { Reminder, TemplateType } from '@/types';

const triggerSchema = z.object({
  reminder_id: z.string().uuid(),
});

async function sendEmail(
  reminder: Reminder & { wish_templates?: { html_content: string; text_content: string } | null }
): Promise<{ ok: boolean; error?: string }> {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (!gmailUser || !gmailPass) return { ok: false, error: 'GMAIL_USER or GMAIL_APP_PASSWORD not set' };
  if (!reminder.target_email) return { ok: false, error: 'No email address on this reminder' };

  const vars = {
    title: reminder.title,
    message: reminder.description || 'No additional details',
    quote: 'Time waits for no one.',
    date: new Date(reminder.target_date).toLocaleDateString(),
    eventType: reminder.event_type,
  };

  const html = generateEmailTemplate(reminder.wish_template as TemplateType, vars);
  const text = generatePlainText(reminder.wish_template as TemplateType, vars);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailUser, pass: gmailPass },
  });

  try {
    await transporter.sendMail({
      from: `RemindAll <${gmailUser}>`,
      to: reminder.target_email,
      subject: reminder.title,
      html,
      text,
    });
    await logAutomationAction(reminder.id, 'email_sent', 'resend', { to: reminder.target_email, via: 'gmail' });
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

async function sendSms(reminder: Reminder): Promise<{ ok: boolean; error?: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) return { ok: false, error: 'Twilio env vars not set' };
  if (!reminder.target_phone) return { ok: false, error: 'No phone number on this reminder' };

  const body = `RemindAll: ${reminder.title}${reminder.description ? ' — ' + reminder.description : ''}`;
  const params = new URLSearchParams({ To: reminder.target_phone, From: from, Body: body });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = await response.json() as Record<string, unknown>;
  if (!response.ok) {
    const errMsg = (data.message as string) || JSON.stringify(data);
    await logAutomationAction(reminder.id, 'sms_sent', 'twilio', { to: reminder.target_phone, error: errMsg });
    return { ok: false, error: errMsg };
  }
  await logAutomationAction(reminder.id, 'sms_sent', 'twilio', { to: reminder.target_phone }, data);
  return { ok: true };
}

async function makeCall(reminder: Reminder): Promise<{ ok: boolean; error?: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  const webhookUrl = process.env.WEBHOOK_URL || 'https://remindingall.netlify.app';
  if (!sid || !token || !from) return { ok: false, error: 'Twilio env vars not set' };
  if (!reminder.target_phone) return { ok: false, error: 'No phone number on this reminder' };

  const safe = (s: string) => s.replace(/[<>&"']/g, '');
  const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Joanna">Hello! This is a reminder from RemindAll.</Say><Pause length="1"/><Say voice="Polly.Joanna">Reminder: ${safe(reminder.title)}.</Say><Pause length="1"/><Say voice="Polly.Joanna">${safe(reminder.description || '')}.</Say><Pause length="1"/><Say voice="Polly.Joanna">Goodbye!</Say><Hangup/></Response>`;

  const params = new URLSearchParams({
    To: reminder.target_phone,
    From: from,
    Twiml: twiml,
    StatusCallback: `${webhookUrl}/api/twilio-status`,
    StatusCallbackMethod: 'POST',
  });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = await response.json() as Record<string, unknown>;
  if (!response.ok) {
    const errMsg = (data.message as string) || JSON.stringify(data);
    await logAutomationAction(reminder.id, 'call_initiated', 'twilio', { to: reminder.target_phone, error: errMsg });
    return { ok: false, error: errMsg };
  }
  await logAutomationAction(reminder.id, 'call_initiated', 'twilio', { to: reminder.target_phone }, data);
  return { ok: true };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = triggerSchema.safeParse(body);
    if (!validation.success) return NextResponse.json({ success: false, error: 'Invalid reminder ID' }, { status: 400 });

    const { reminder_id } = validation.data;
    const reminder = await getReminderWithTemplate(reminder_id);
    if (!reminder) return NextResponse.json({ success: false, error: 'Reminder not found' }, { status: 404 });

    await updateReminderStatus(reminder_id, 'processing');

    const results: Record<string, { ok: boolean; error?: string }> = {};
    if (reminder.email_enabled && reminder.target_email) results.email = await sendEmail(reminder);
    if (reminder.call_enabled && reminder.target_phone) {
      results.sms = await sendSms(reminder);
      results.call = await makeCall(reminder);
    }

    const anySuccess = Object.values(results).some((r) => r.ok);
    const finalStatus = anySuccess ? 'completed' : 'failed';
    await updateReminderStatus(reminder_id, finalStatus);

    return NextResponse.json({ success: anySuccess, results, status: finalStatus });
  } catch (error) {
    console.error('Trigger immediate error:', error);
    return NextResponse.json({ success: false, error: 'Failed to trigger reminder' }, { status: 500 });
  }
}
