'use client';

import React, { useState } from 'react';
import { Phone, Mail, Gift } from 'lucide-react';
import { createReminder } from '@/lib/supabase/client';
import { validateReminder } from '@/lib/utils/validators';
import { TEMPLATES } from '@/lib/constants';
import type { EventType, TemplateType } from '@/types';

interface ReminderFormProps {
  onSuccess: () => void;
}

const INITIAL_FORM_DATA = {
  event_type: 'birthday' as EventType,
  title: '',
  description: '',
  target_date: '',
  target_phone: '',
  target_email: '',
  wish_template: 'elegant' as TemplateType,
  automation_enabled: true,
  call_enabled: true,
  email_enabled: true,
};

export default function ReminderForm({ onSuccess }: ReminderFormProps) {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setIsSubmitting(true);

    const targetDateIso = formData.target_date
      ? new Date(formData.target_date).toISOString()
      : '';

    const validation = validateReminder({
      ...formData,
      target_date: targetDateIso,
    });

    if (!validation.success) {
      setErrors(validation.errors);
      setIsSubmitting(false);
      return;
    }

    try {
      await createReminder(validation.data);
      setFormData(INITIAL_FORM_DATA);
      onSuccess();
    } catch {
      setErrors(['Failed to create reminder. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = <K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.length > 0 && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-3">
          {errors.map((error, i) => (
            <p key={i} className="text-red-300 text-sm">
              • {error}
            </p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <select
          className="bg-slate-700 rounded-lg p-3 border border-slate-600 focus:border-purple-500 outline-none text-white"
          value={formData.event_type}
          onChange={(e) => updateField('event_type', e.target.value as EventType)}
        >
          <option value="birthday">Birthday</option>
          <option value="class">Class/Meeting</option>
          <option value="anniversary">Anniversary</option>
          <option value="custom">Custom Event</option>
        </select>

        <input
          type="datetime-local"
          className="bg-slate-700 rounded-lg p-3 border border-slate-600 text-white"
          value={formData.target_date}
          onChange={(e) => updateField('target_date', e.target.value)}
          required
        />
      </div>

      <input
        type="text"
        placeholder="Event Title"
        className="w-full bg-slate-700 rounded-lg p-3 border border-slate-600 text-white placeholder-slate-400"
        value={formData.title}
        onChange={(e) => updateField('title', e.target.value)}
        maxLength={200}
        required
      />

      <textarea
        placeholder="Description/Notes"
        className="w-full bg-slate-700 rounded-lg p-3 border border-slate-600 h-24 text-white placeholder-slate-400"
        value={formData.description}
        onChange={(e) => updateField('description', e.target.value)}
        maxLength={2000}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="relative">
          <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input
            type="tel"
            placeholder="+1234567890"
            className="w-full bg-slate-700 rounded-lg p-3 pl-10 border border-slate-600 text-white placeholder-slate-400"
            value={formData.target_phone}
            onChange={(e) => updateField('target_phone', e.target.value)}
          />
        </div>
        <div className="relative">
          <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input
            type="email"
            placeholder="email@domain.com"
            className="w-full bg-slate-700 rounded-lg p-3 pl-10 border border-slate-600 text-white placeholder-slate-400"
            value={formData.target_email}
            onChange={(e) => updateField('target_email', e.target.value)}
          />
        </div>
      </div>

      <div className="relative">
        <Gift className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
        <select
          className="w-full bg-slate-700 rounded-lg p-3 pl-10 border border-slate-600 text-white"
          value={formData.wish_template}
          onChange={(e) =>
            updateField('wish_template', e.target.value as TemplateType)
          }
        >
          {Object.entries(TEMPLATES).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2 cursor-pointer text-slate-300">
          <input
            type="checkbox"
            checked={formData.automation_enabled}
            onChange={(e) => updateField('automation_enabled', e.target.checked)}
            className="w-4 h-4 accent-purple-500"
          />
          Enable Automation
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-slate-300">
          <input
            type="checkbox"
            checked={formData.call_enabled}
            onChange={(e) => updateField('call_enabled', e.target.checked)}
            className="w-4 h-4 accent-pink-500"
          />
          Phone Call
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-slate-300">
          <input
            type="checkbox"
            checked={formData.email_enabled}
            onChange={(e) => updateField('email_enabled', e.target.checked)}
            className="w-4 h-4 accent-blue-500"
          />
          Email
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02]"
      >
        {isSubmitting ? 'Scheduling...' : 'Schedule Reminder'}
      </button>
    </form>
  );
}
