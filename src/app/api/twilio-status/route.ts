import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import type { TwilioWebhookPayload } from '@/types';

const statusMapping: Record<string, string> = {
  queued: 'call_queued',
  ringing: 'call_ringing',
  'in-progress': 'call_in_progress',
  completed: 'call_completed',
  busy: 'call_busy',
  failed: 'call_failed',
  'no-answer': 'call_no_answer',
  canceled: 'call_canceled',
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const payload: TwilioWebhookPayload = {
      CallSid: formData.get('CallSid') as string,
      CallStatus: formData.get('CallStatus') as string,
      From: formData.get('From') as string,
      To: formData.get('To') as string | undefined,
      CallDuration: formData.get('CallDuration') as string | undefined,
    };

    if (!payload.CallSid || !payload.CallStatus) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await supabaseAdmin.from('automation_logs').insert({
      reminder_id: null,
      action_type: statusMapping[payload.CallStatus] || 'call_status_update',
      provider: 'twilio',
      payload: {
        call_sid: payload.CallSid,
        status: payload.CallStatus,
        from: payload.From,
        to: payload.To,
        duration: payload.CallDuration,
        timestamp: new Date().toISOString(),
        raw_data: Object.fromEntries(formData.entries()),
      },
    });

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    console.error('Twilio webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
