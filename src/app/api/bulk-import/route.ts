import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import { supabaseAdmin } from '@/lib/supabase/server';
import { validateCsvRecord } from '@/lib/utils/validators';
import type { EventType, TemplateType } from '@/types';

interface CsvRow {
  name?: string;
  phone?: string;
  email?: string;
  event_type?: string;
  date: string;
  description?: string;
}

function parseCsvData(csvData: string): CsvRow[] {
  return parse(csvData, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CsvRow[];
}

function transformToReminder(record: CsvRow, defaultTemplate: string) {
  const validated = validateCsvRecord(record);
  if (!validated) return null;

  const template = (['elegant', 'fun', 'corporate', 'romantic', 'dark'] as const).includes(
    defaultTemplate as TemplateType
  )
    ? (defaultTemplate as TemplateType)
    : 'elegant';

  const eventType: EventType = validated.event_type ?? 'custom';

  return {
    title: validated.name?.trim() || 'Bulk Import Event',
    target_phone: validated.phone?.trim() || null,
    target_email: validated.email?.trim() || null,
    event_type: eventType,
    target_date: new Date(validated.date).toISOString(),
    description: validated.description?.trim() || null,
    wish_template: template,
    automation_enabled: true,
    call_enabled: Boolean(validated.phone?.trim()),
    email_enabled: Boolean(validated.email?.trim()),
    status: 'pending' as const,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { csvData, defaultTemplate = 'elegant' } = await req.json();

    if (!csvData || typeof csvData !== 'string') {
      return NextResponse.json(
        { success: false, error: 'CSV data is required' },
        { status: 400 }
      );
    }

    const records = parseCsvData(csvData);

    if (records.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid records found in CSV' },
        { status: 400 }
      );
    }

    if (records.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Maximum 100 records allowed per import' },
        { status: 400 }
      );
    }

    const reminders = records
      .map((record) => transformToReminder(record, defaultTemplate))
      .filter((row): row is NonNullable<typeof row> => row != null);

    if (reminders.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid reminders could be created from CSV' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('reminders')
      .insert(reminders)
      .select();

    if (error) {
      console.error('Bulk import database error:', error);
      return NextResponse.json(
        { success: false, error: 'Database error during import' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      imported: data?.length || 0,
      total: records.length,
      ids: data?.map((r) => r.id),
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process CSV import' },
      { status: 500 }
    );
  }
}
