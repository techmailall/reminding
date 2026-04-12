import { z } from 'zod';
import { VALIDATION } from '../constants';
import type { ReminderInput, BulkImportRecord, EventType } from '@/types';

// ============================================
// Reminder Validation Schema
// ============================================

const parseableDate = z
  .string()
  .min(1, 'Date is required')
  .refine((val) => !Number.isNaN(Date.parse(val)), { message: 'Invalid date' });

export const reminderSchema = z
  .object({
    event_type: z.enum(['birthday', 'class', 'anniversary', 'custom']),
    title: z.string().min(1).max(VALIDATION.maxTitleLength),
    description: z.string().max(VALIDATION.maxDescriptionLength).optional().or(z.literal('')),
    target_date: parseableDate,
    target_phone: z.string().regex(VALIDATION.phoneRegex).optional().or(z.literal('')),
    target_email: z.string().email().optional().or(z.literal('')),
    wish_template: z.enum(['elegant', 'fun', 'corporate', 'romantic', 'dark']),
    automation_enabled: z.boolean().default(true),
    call_enabled: z.boolean().default(true),
    email_enabled: z.boolean().default(true),
  })
  .refine((data) => Boolean(data.target_phone) || Boolean(data.target_email), {
    message: 'At least one contact method (phone or email) is required',
    path: ['target_phone'],
  });

// ============================================
// Bulk Import Validation
// ============================================

export const bulkImportSchema = z.object({
  csvData: z.string().min(1, 'CSV data is required'),
  defaultTemplate: z.enum(['elegant', 'fun', 'corporate', 'romantic', 'dark']).default('elegant'),
});

// ============================================
// CSV Record Validation
// ============================================

export const csvRecordSchema = z
  .object({
    name: z.string().optional(),
    phone: z
      .string()
      .optional()
      .refine((s) => !s || VALIDATION.phoneRegex.test(s), { message: 'Invalid phone' }),
    email: z
      .string()
      .optional()
      .refine((s) => !s || VALIDATION.emailRegex.test(s), { message: 'Invalid email' }),
    event_type: z.enum(['birthday', 'class', 'anniversary', 'custom']).optional(),
    date: z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }),
    description: z.string().optional(),
  })
  .refine(
    (row) =>
      Boolean(row.phone && row.phone.trim()) || Boolean(row.email && row.email.trim()),
    {
      message: 'Each row needs a phone or email',
      path: ['phone'],
    }
  );

// ============================================
// Validation Functions
// ============================================

export function validateReminder(
  data: unknown
): { success: true; data: ReminderInput } | { success: false; errors: string[] } {
  const result = reminderSchema.safeParse(data);

  if (result.success) {
    const d = result.data;
    return {
      success: true,
      data: {
        event_type: d.event_type,
        title: d.title,
        description: d.description || undefined,
        target_date: new Date(d.target_date).toISOString(),
        target_phone: d.target_phone || undefined,
        target_email: d.target_email || undefined,
        wish_template: d.wish_template,
        automation_enabled: d.automation_enabled,
        call_enabled: d.call_enabled,
        email_enabled: d.email_enabled,
      },
    };
  }

  return {
    success: false,
    errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
  };
}

export function validateBulkImport(
  data: unknown
):
  | { success: true; data: { csvData: string; defaultTemplate: string } }
  | { success: false; errors: string[] } {
  const result = bulkImportSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
  };
}

export function validateCsvRecord(record: unknown): BulkImportRecord | null {
  const result = csvRecordSchema.safeParse(record);
  if (!result.success) return null;
  const r = result.data;
  const event_type = r.event_type as EventType | undefined;
  return {
    name: r.name,
    phone: r.phone || undefined,
    email: r.email || undefined,
    event_type,
    date: r.date,
    description: r.description,
  };
}
