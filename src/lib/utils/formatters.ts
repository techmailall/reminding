import { format, parseISO } from 'date-fns';
import type { EventType, TemplateType } from '@/types';
import { EVENT_TYPE_LABELS, TEMPLATES } from '../constants';

// ============================================
// Date Formatters
// ============================================

export function formatDate(dateString: string): string {
  try {
    return format(parseISO(dateString), 'PPpp');
  } catch {
    return dateString;
  }
}

export function formatShortDate(dateString: string): string {
  try {
    return format(parseISO(dateString), 'PP');
  } catch {
    return dateString;
  }
}

// ============================================
// Type Label Getters
// ============================================

export function getEventTypeLabel(type: EventType): string {
  return EVENT_TYPE_LABELS[type]?.label || type;
}

export function getEventTypeColor(type: EventType): string {
  return EVENT_TYPE_LABELS[type]?.color || 'bg-gray-600';
}

export function getTemplateLabel(template: TemplateType): string {
  return TEMPLATES[template]?.label || template;
}

// ============================================
// Phone/Email Masking
// ============================================

export function maskPhone(phone: string): string {
  if (phone.length < 8) return phone;
  return phone.slice(0, 4) + '****' + phone.slice(-4);
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const maskedLocal =
    local.length > 2 ? local[0] + '***' + local.slice(-1) : '***';
  return `${maskedLocal}@${domain}`;
}
