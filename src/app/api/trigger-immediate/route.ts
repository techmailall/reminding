import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/server';

const triggerSchema = z.object({
  reminder_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = triggerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid reminder ID' },
        { status: 400 }
      );
    }

    const { reminder_id } = validation.data;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Validate reminder exists (clearer errors than edge function 404)
    const { data: exists, error: lookupError } = await getSupabaseAdmin()
      .from('reminders')
      .select('id')
      .eq('id', reminder_id)
      .maybeSingle();

    if (lookupError || !exists) {
      return NextResponse.json(
        { success: false, error: 'Reminder not found' },
        { status: 404 }
      );
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/process-reminder`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reminder_id, immediate: true }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Edge function error: ${errorText}`);
    }

    return NextResponse.json({ success: true, message: 'Reminder triggered' });
  } catch (error) {
    console.error('Trigger immediate error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to trigger reminder' },
      { status: 500 }
    );
  }
}
