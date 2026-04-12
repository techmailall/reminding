'use client';

import React from 'react';
import { Calendar, Phone, Mail, Gift, Trash2, Play } from 'lucide-react';
import type { Reminder } from '@/types';
import {
  formatDate,
  getEventTypeColor,
  getTemplateLabel,
  maskPhone,
  maskEmail,
} from '@/lib/utils/formatters';

interface ReminderListProps {
  reminders: Reminder[];
  onDelete: (id: string) => void;
  onTrigger: (reminder: Reminder) => void;
  isLoading?: boolean;
}

export default function ReminderList({
  reminders,
  onDelete,
  onTrigger,
  isLoading,
}: ReminderListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (reminders.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p>No reminders scheduled yet.</p>
        <p className="text-sm mt-2">Create your first reminder using the form!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reminders.map((reminder) => (
        <ReminderCard
          key={reminder.id}
          reminder={reminder}
          onDelete={onDelete}
          onTrigger={onTrigger}
        />
      ))}
    </div>
  );
}

// ============================================
// Individual Reminder Card
// ============================================

interface ReminderCardProps {
  reminder: Reminder;
  onDelete: (id: string) => void;
  onTrigger: (reminder: Reminder) => void;
}

function ReminderCard({ reminder, onDelete, onTrigger }: ReminderCardProps) {
  const statusColors: Record<string, string> = {
    pending: 'text-yellow-400',
    processing: 'text-blue-400',
    completed: 'text-green-400',
    failed: 'text-red-400',
  };

  return (
    <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600 hover:border-purple-500 transition-all hover:shadow-lg hover:shadow-purple-500/10">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0">
          <span
            className={`inline-block px-2 py-1 rounded text-xs font-bold mb-2 ${getEventTypeColor(reminder.event_type)}`}
          >
            {reminder.event_type.toUpperCase()}
          </span>
          <h3 className="font-bold text-lg text-white truncate">{reminder.title}</h3>
          <p className="text-slate-400 text-sm">{formatDate(reminder.target_date)}</p>
          <p
            className={`text-xs mt-1 ${statusColors[reminder.status] || 'text-slate-500'}`}
          >
            Status: {reminder.status}
          </p>
        </div>
        <div className="flex gap-2 ml-4">
          <button
            type="button"
            onClick={() => onTrigger(reminder)}
            className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            title="Trigger Now"
          >
            <Play className="w-4 h-4 text-white" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(reminder.id)}
            className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-slate-300 mt-3">
        {reminder.target_phone && (
          <span className="flex items-center gap-1">
            <Phone className="w-3 h-3" /> {maskPhone(reminder.target_phone)}
          </span>
        )}
        {reminder.target_email && (
          <span className="flex items-center gap-1">
            <Mail className="w-3 h-3" /> {maskEmail(reminder.target_email)}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Gift className="w-3 h-3" /> {getTemplateLabel(reminder.wish_template)}
        </span>
      </div>
    </div>
  );
}
