// ============================================
// Core Domain Types
// ============================================

export type EventType = 'birthday' | 'class' | 'anniversary' | 'custom';
export type ReminderStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type TemplateType = 'elegant' | 'fun' | 'corporate' | 'romantic' | 'dark';
export type ActionType = 'email_sent' | 'call_initiated' | 'sms_sent' | 'call_status_update';

export interface Reminder {
  id: string;
  event_type: EventType;
  title: string;
  description: string | null;
  target_date: string;
  target_phone: string | null;
  target_email: string | null;
  wish_template: TemplateType;
  automation_enabled: boolean;
  call_enabled: boolean;
  email_enabled: boolean;
  status: ReminderStatus;
  created_at: string;
  updated_at: string;
  user_id?: string | null;
}

export interface ReminderInput {
  event_type: EventType;
  title: string;
  description?: string;
  target_date: string;
  target_phone?: string;
  target_email?: string;
  wish_template: TemplateType;
  automation_enabled: boolean;
  call_enabled: boolean;
  email_enabled: boolean;
}

export interface WishTemplate {
  id: string;
  name: TemplateType;
  html_content: string;
  text_content: string;
  variables: string[];
}

export interface AutomationLog {
  id: string;
  reminder_id: string | null;
  action_type: ActionType;
  provider: 'resend' | 'twilio';
  payload: Record<string, unknown>;
  response?: Record<string, unknown>;
  created_at: string;
}

// ============================================
// API Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface BulkImportRecord {
  name?: string;
  phone?: string;
  email?: string;
  event_type?: EventType;
  date: string;
  description?: string;
}

export interface TwilioWebhookPayload {
  CallSid: string;
  CallStatus: string;
  From: string;
  To?: string;
  CallDuration?: string;
}
