import type { EventType, TemplateType } from '@/types';

export const APP_CONFIG = {
  name: 'Automated Reminder System',
  description: 'Dream-based notification infrastructure',
  fromEmail: process.env.FROM_EMAIL || 'Reminders <onboarding@resend.dev>',
  notificationEmail: process.env.FROM_EMAIL || 'onboarding@resend.dev',
} as const;

export const VALIDATION = {
  phoneRegex: /^\+[1-9]\d{1,14}$/,
  emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  maxTitleLength: 200,
  maxDescriptionLength: 2000,
} as const;

export const TEMPLATES: Record<TemplateType, { label: string; description: string }> = {
  elegant: {
    label: 'Elegant Floral Design',
    description: 'Sophisticated purple gradient with serif fonts',
  },
  fun: {
    label: 'Fun & Colorful',
    description: 'Playful design with emojis and bright colors',
  },
  corporate: {
    label: 'Corporate Professional',
    description: 'Clean business-focused design',
  },
  romantic: {
    label: 'Romantic & Intimate',
    description: 'Soft pinks and elegant script fonts',
  },
  dark: {
    label: 'Dark & Mysterious',
    description: 'Cyberpunk-inspired dark theme',
  },
} as const;

export const EVENT_TYPE_LABELS: Record<EventType, { label: string; color: string }> = {
  birthday: { label: 'Birthday', color: 'bg-pink-600' },
  anniversary: { label: 'Anniversary', color: 'bg-red-600' },
  class: { label: 'Class/Meeting', color: 'bg-blue-600' },
  custom: { label: 'Custom Event', color: 'bg-purple-600' },
} as const;

export const CRON_CONFIG = {
  checkInterval: '* * * * *',
  reminderWindowMinutes: 5,
  maxConcurrentJobs: 50,
} as const;